import { prisma } from '@/lib/prisma';
import { receivingVoucherRepository } from '@/repositories/receiving-voucher.repository';
import { randomUUID } from 'crypto';
import {
  CreateReceivingVoucherInput,
  ReceivingVoucherWithDetails,
  ReceivingVoucherFilters,
  VarianceReport,
} from '@/types/receiving-voucher.types';
import { NotFoundError, ValidationError } from '@/lib/errors';
import { format } from 'date-fns';

export class ReceivingVoucherService {
  /**
   * Generate unique RV number in format: RV-YYYYMMDD-XXXX
   */
  async generateRVNumber(): Promise<string> {
    const today = new Date();
    const dateStr = format(today, 'yyyyMMdd');
    const prefix = `RV-${dateStr}-`;

    // Find the last RV number for today
    const lastRV = await prisma.receivingVoucher.findFirst({
      where: {
        rvNumber: {
          startsWith: prefix,
        },
      },
      orderBy: {
        rvNumber: 'desc',
      },
    });

    let sequence = 1;
    if (lastRV) {
      const parts = lastRV.rvNumber.split('-');
      if (parts.length === 3) {
        const lastSequence = parseInt(parts[2]);
        if (!isNaN(lastSequence)) {
          sequence = lastSequence + 1;
        }
      }
    }

    return `${prefix}${sequence.toString().padStart(4, '0')}`;
  }

  /**
   * Create receiving voucher from purchase order
   */
  async createReceivingVoucher(
    data: CreateReceivingVoucherInput
  ): Promise<ReceivingVoucherWithDetails> {
    return await prisma.$transaction(async (tx) => {
      // 1. Get PO with items and related data
      const po = await tx.purchaseOrder.findUnique({
        where: { id: data.purchaseOrderId },
        include: {
          PurchaseOrderItem: {
            include: {
              Product: true,
            },
          },
          Supplier: true,
          Warehouse: true,
          Branch: true,
        },
      });

      if (!po) {
        throw new NotFoundError('Purchase Order');
      }

      // 2. Validate PO status
      if (po.status !== 'ordered') {
        throw new ValidationError('Invalid purchase order status', {
          status: 'Purchase order must be in ordered status',
        });
      }

      // 3. Validate at least one item has received quantity > 0
      const hasReceivedItems = data.items.some((item) => item.receivedQuantity > 0);
      if (!hasReceivedItems) {
        throw new ValidationError('No items received', {
          items: 'At least one item must have received quantity greater than zero',
        });
      }

      // 4. Generate RV number
      const rvNumber = await this.generateRVNumber();

      // 5. Calculate totals and variances
      let totalOrderedAmount = 0;
      let totalReceivedAmount = 0;

      const processedItems = data.items.map((item) => {
        const orderedQty = Number(item.orderedQuantity);
        const receivedQty = Number(item.receivedQuantity);
        const unitPrice = Number(item.unitPrice);

        const varianceQty = receivedQty - orderedQty;
        const variancePercentage =
          orderedQty > 0 ? (varianceQty / orderedQty) * 100 : 0;
        const lineTotal = receivedQty * unitPrice;

        totalOrderedAmount += orderedQty * unitPrice;
        totalReceivedAmount += lineTotal;

        return {
          id: randomUUID(),
          productId: item.productId,
          orderedQuantity: orderedQty,
          receivedQuantity: receivedQty,
          varianceQuantity: varianceQty,
          variancePercentage: Number(variancePercentage.toFixed(2)),
          varianceReason: item.varianceReason || null,
          unitPrice: unitPrice,
          lineTotal: Number(lineTotal.toFixed(2)),
        };
      });

      const varianceAmount = totalReceivedAmount - totalOrderedAmount;

      // 6. Create ReceivingVoucher
      const rv = await tx.receivingVoucher.create({
        data: {
          id: randomUUID(),
          rvNumber,
          purchaseOrderId: po.id,
          warehouseId: po.warehouseId,
          branchId: po.branchId,
          receiverName: data.receiverName,
          deliveryNotes: data.deliveryNotes,
          status: 'complete',
          totalOrderedAmount: Number(totalOrderedAmount.toFixed(2)),
          totalReceivedAmount: Number(totalReceivedAmount.toFixed(2)),
          varianceAmount: Number(varianceAmount.toFixed(2)),
        },
      });

      // Create receiving voucher items (without updatedAt field)
      await tx.receivingVoucherItem.createMany({
        data: processedItems.map(item => ({
          id: randomUUID(),
          rvId: rv.id,
          productId: item.productId,
          orderedQuantity: item.orderedQuantity,
          receivedQuantity: item.receivedQuantity,
          varianceQuantity: item.varianceQuantity,
          variancePercentage: item.variancePercentage,
          varianceReason: item.varianceReason,
          unitPrice: item.unitPrice,
          lineTotal: item.lineTotal,
        })),
      });

      // 7. Create inventory batches for received quantities
      for (const item of processedItems) {
        if (item.receivedQuantity > 0) {
          const product = po.PurchaseOrderItem.find((p) => p.productId === item.productId)?.Product;
          if (!product) continue;

          // Get the UOM from the purchase order item
          const poItem = po.PurchaseOrderItem.find((p) => p.productId === item.productId);
          if (!poItem) continue;

          // Convert unit price to base UOM if necessary
          let unitCostInBaseUOM = item.unitPrice;

          // Check if the PO item UOM is different from base UOM
          if (poItem.uom.toLowerCase() !== product.baseUOM.toLowerCase()) {
            // Find the conversion factor for this UOM
            const productWithUOMs = await tx.product.findUnique({
              where: { id: item.productId },
              include: { ProductUOM: true },
            });

            if (productWithUOMs) {
              const alternateUOM = productWithUOMs.ProductUOM.find(
                (u) => u.name.toLowerCase() === poItem.uom.toLowerCase()
              );

              if (alternateUOM) {
                // Convert: unit price ÷ conversion factor = price per base unit
                // Example: ₱140 per case ÷ 12 bottles per case = ₱11.67 per bottle
                unitCostInBaseUOM = item.unitPrice / Number(alternateUOM.conversionFactor);
              }
            }
          }

          // Generate batch number
          const batchCount = await tx.inventoryBatch.count();
          const batchNumber = `BATCH-${String(batchCount + 1).padStart(6, '0')}`;

          // Calculate dates
          const receivedDate = new Date();
          const expiryDate = new Date(receivedDate);
          expiryDate.setDate(expiryDate.getDate() + product.shelfLifeDays);

          // Create inventory batch directly within the transaction
          const batch = await tx.inventoryBatch.create({
            data: {
              id: randomUUID(),
              batchNumber,
              productId: item.productId,
              warehouseId: po.warehouseId,
              quantity: item.receivedQuantity,
              unitCost: Number(unitCostInBaseUOM.toFixed(4)), // Store cost in base UOM with 4 decimal precision
              receivedDate,
              expiryDate,
              status: 'active',
            },
          });

          // Record stock movement within the transaction
          await tx.stockMovement.create({
            data: {
              id: randomUUID(),
              batchId: batch.id,
              type: 'IN',
              quantity: item.receivedQuantity,
              reason: `Received from RV ${rvNumber} (PO ${po.poNumber})`,
              referenceId: rv.id,
              referenceType: 'RV',
            },
          });

          // Update product's weighted average cost price
          // Formula: ((Current Avg Cost × Current Stock) + (New Cost × New Qty)) / (Current Stock + New Qty)
          const currentProduct = await tx.product.findUnique({
            where: { id: item.productId },
          });

          if (currentProduct) {
            // Get current total stock for this product across all warehouses
            const currentBatches = await tx.inventoryBatch.findMany({
              where: {
                productId: item.productId,
                status: 'active',
              },
            });

            const currentTotalStock = currentBatches.reduce(
              (sum, b) => sum + Number(b.quantity),
              0
            );
            const currentAvgCost = Number(currentProduct.averageCostPrice || 0);
            const newCost = Number(unitCostInBaseUOM); // Use converted cost in base UOM
            const newQty = Number(item.receivedQuantity);

            // Calculate new weighted average cost
            const totalValue = (currentAvgCost * currentTotalStock) + (newCost * newQty);
            const totalQty = currentTotalStock + newQty;
            const newAvgCost = totalQty > 0 ? totalValue / totalQty : newCost;

            // Update product's average cost price
            await tx.product.update({
              where: { id: item.productId },
              data: {
                averageCostPrice: Number(newAvgCost.toFixed(2)),
              },
            });
          }

          // Update PO item received quantity
          const poItemToUpdate = po.PurchaseOrderItem.find((p) => p.productId === item.productId);
          if (poItemToUpdate) {
            await tx.purchaseOrderItem.update({
              where: { id: poItemToUpdate.id },
              data: {
                receivedQuantity: {
                  increment: item.receivedQuantity,
                },
              },
            });
          }
        }
      }

      // 8. Update PO receiving status
      const updatedPOItems = await tx.purchaseOrderItem.findMany({
        where: { poId: po.id },
      });

      const allItemsFullyReceived = updatedPOItems.every(
        (item) => Number(item.receivedQuantity) >= Number(item.quantity)
      );
      const someItemsReceived = updatedPOItems.some(
        (item) => Number(item.receivedQuantity) > 0
      );

      let receivingStatus = 'pending';
      if (allItemsFullyReceived) {
        receivingStatus = 'fully_received';
      } else if (someItemsReceived) {
        receivingStatus = 'partially_received';
      }

      await tx.purchaseOrder.update({
        where: { id: po.id },
        data: {
          receivingStatus,
          status: allItemsFullyReceived ? 'received' : po.status,
          actualDeliveryDate: allItemsFullyReceived ? new Date() : po.actualDeliveryDate,
        },
      });

      // 9. Create Accounts Payable for received amount
      if (totalReceivedAmount > 0 && allItemsFullyReceived) {
        const dueDate = this.calculateDueDate(po.Supplier.paymentTerms, new Date());

        await tx.accountsPayable.create({
          data: {
            id: randomUUID(),
            branchId: po.branchId,
            supplierId: po.supplierId,
            purchaseOrderId: po.id,
            totalAmount: Number(totalReceivedAmount.toFixed(2)),
            paidAmount: 0,
            balance: Number(totalReceivedAmount.toFixed(2)),
            dueDate,
            status: 'pending',
          },
        });
      }

      // 10. Return created RV with details
      const createdRV = await tx.receivingVoucher.findUnique({
        where: { id: rv.id },
        include: {
          PurchaseOrder: {
            include: {
              Supplier: true,
            },
          },
          Warehouse: true,
          Branch: true,
          ReceivingVoucherItem: {
            include: {
              Product: true,
            },
          },
        },
      });

      return createdRV!;
    });
  }

  /**
   * Calculate due date based on payment terms
   */
  private calculateDueDate(paymentTerms: string, fromDate: Date): Date {
    const dueDate = new Date(fromDate);

    switch (paymentTerms) {
      case 'Net 15':
        dueDate.setDate(dueDate.getDate() + 15);
        break;
      case 'Net 30':
        dueDate.setDate(dueDate.getDate() + 30);
        break;
      case 'Net 60':
        dueDate.setDate(dueDate.getDate() + 60);
        break;
      case 'COD':
        // Due immediately
        break;
      default:
        dueDate.setDate(dueDate.getDate() + 30);
    }

    return dueDate;
  }

  /**
   * Get receiving voucher by ID
   */
  async getReceivingVoucherById(id: string): Promise<ReceivingVoucherWithDetails> {
    const rv = await receivingVoucherRepository.findById(id);

    if (!rv) {
      throw new NotFoundError('Receiving Voucher');
    }

    return rv;
  }

  /**
   * Get receiving voucher by RV number
   */
  async getReceivingVoucherByNumber(rvNumber: string): Promise<ReceivingVoucherWithDetails> {
    const rv = await receivingVoucherRepository.findByRVNumber(rvNumber);

    if (!rv) {
      throw new NotFoundError('Receiving Voucher');
    }

    return rv;
  }

  /**
   * List receiving vouchers with filters
   */
  async listReceivingVouchers(
    filters: ReceivingVoucherFilters
  ): Promise<ReceivingVoucherWithDetails[]> {
    return await receivingVoucherRepository.findMany(filters);
  }

  /**
   * Get receiving vouchers for a purchase order
   */
  async getReceivingVouchersByPO(poId: string): Promise<ReceivingVoucherWithDetails[]> {
    return await receivingVoucherRepository.findByPurchaseOrderId(poId);
  }

  /**
   * Generate variance report
   */
  async generateVarianceReport(
    filters: Pick<ReceivingVoucherFilters, 'branchId' | 'startDate' | 'endDate'>
  ): Promise<VarianceReport[]> {
    const rvs = await receivingVoucherRepository.findMany(filters);

    // Group by supplier
    const supplierMap = new Map<string, VarianceReport>();

    for (const rv of rvs) {
      const supplierId = rv.PurchaseOrder.Supplier.id;
      const supplierName = rv.PurchaseOrder.Supplier.companyName;

      if (!supplierMap.has(supplierId)) {
        supplierMap.set(supplierId, {
          supplierId,
          supplierName,
          totalPOs: 0,
          averageVariancePercentage: 0,
          overDeliveryCount: 0,
          underDeliveryCount: 0,
          exactMatchCount: 0,
          products: [],
        });
      }

      const report = supplierMap.get(supplierId)!;
      report.totalPOs++;

      // Analyze variance
      for (const item of rv.ReceivingVoucherItem) {
        const variance = Number(item.varianceQuantity);

        if (variance > 0) {
          report.overDeliveryCount++;
        } else if (variance < 0) {
          report.underDeliveryCount++;
        } else {
          report.exactMatchCount++;
        }

        // Track product variances
        const existingProduct = report.products.find(
          (p) => p.productId === item.productId
        );

        if (existingProduct) {
          existingProduct.totalOrdered += Number(item.orderedQuantity);
          existingProduct.totalReceived += Number(item.receivedQuantity);
          existingProduct.totalVariance += variance;
          existingProduct.varianceFrequency++;
        } else {
          report.products.push({
            productId: item.productId,
            productName: item.Product.name,
            totalOrdered: Number(item.orderedQuantity),
            totalReceived: Number(item.receivedQuantity),
            totalVariance: variance,
            varianceFrequency: 1,
          });
        }
      }
    }

    // Calculate average variance percentage per supplier
    const reports = Array.from(supplierMap.values());
    for (const report of reports) {
      const totalItems =
        report.overDeliveryCount + report.underDeliveryCount + report.exactMatchCount;
      const totalVarianceItems = report.overDeliveryCount + report.underDeliveryCount;

      report.averageVariancePercentage =
        totalItems > 0 ? Number(((totalVarianceItems / totalItems) * 100).toFixed(2)) : 0;
    }

    return reports;
  }
}

export const receivingVoucherService = new ReceivingVoucherService();
