import { prisma } from '@/lib/prisma';
import { receivingVoucherRepository } from '@/repositories/receiving-voucher.repository';
import { inventoryService } from '@/services/inventory.service';
import { randomUUID } from 'crypto';
import {
  CreateReceivingVoucherInput,
  ReceivingVoucherWithDetails,
  ReceivingVoucherFilters,
  VarianceReport,
} from '@/types/receiving-voucher.types';
import { CancelReceivingVoucherInput } from '@/lib/validations/receiving-voucher.validation';
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
      const lastSequence = parseInt(lastRV.rvNumber.split('-')[2]);
      sequence = lastSequence + 1;
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

      // Calculate gross received amount first to determine cost distribution ratio
      const grossReceivedAmount = data.items.reduce((sum, item) => {
        return sum + (Number(item.receivedQuantity) * Number(item.unitPrice));
      }, 0);

      // Calculate net amount for cost distribution
      let netReceivedAmount = grossReceivedAmount;
      if (data.recomputeAverageCost) {
        // Apply discount
        if (data.supplierDiscount && data.supplierDiscount > 0) {
          if (data.supplierDiscountType === 'percentage') {
            netReceivedAmount -= (grossReceivedAmount * data.supplierDiscount) / 100;
          } else {
            netReceivedAmount -= data.supplierDiscount;
          }
        }

        // Add fees
        if (data.additionalFees && data.additionalFees > 0) {
          netReceivedAmount += data.additionalFees;
        }
      }

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

        // Get the correct UOM from payload, fallback to PO item, then product's base UOM
        const poItem = po.PurchaseOrderItem.find(p => p.productId === item.productId);
        const itemUOM = item.uom || poItem?.uom || poItem?.Product.baseUOM || 'pcs';

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
          uom: itemUOM,
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
          // Save new fields
          supplierDiscount: data.supplierDiscount || 0,
          supplierDiscountType: data.supplierDiscountType,
          additionalFees: data.additionalFees || 0,
          additionalFeesDescription: data.additionalFeesDescription,
          recomputeAverageCost: data.recomputeAverageCost || false,
          netAmount: Number(netReceivedAmount.toFixed(2)),
          ReceivingVoucherItem: {
            create: processedItems,
          },
        },
        include: {
          ReceivingVoucherItem: true,
        },
      });

      // 7. Create inventory batches for received quantities
      for (const item of processedItems) {
        if (item.receivedQuantity > 0) {
          const product = po.PurchaseOrderItem.find((p) => p.productId === item.productId)?.Product;
          if (!product) continue;

          // Determine the unit cost to use for inventory valuation
          let inventoryUnitCost = item.unitPrice;

          if (data.recomputeAverageCost && grossReceivedAmount > 0) {
            // Calculate effective unit cost based on net amount
            // Formula: EffectiveCost = UnitPrice * (NetTotal / GrossTotal)
            const distributionRatio = netReceivedAmount / grossReceivedAmount;
            inventoryUnitCost = item.unitPrice * distributionRatio;
          }

          // Add stock using inventory service
          await inventoryService.addStock({
            productId: item.productId,
            warehouseId: po.warehouseId,
            quantity: item.receivedQuantity,
            uom: item.uom, // Use the PO item's UOM for proper conversion
            unitCost: inventoryUnitCost,
            referenceId: rv.id,
            referenceType: 'RV',
            reason: `Received from RV ${rvNumber} (PO ${po.poNumber})`,
          }, tx);

          // Update PO item received quantity
          const poItem = po.PurchaseOrderItem.find((p) => p.productId === item.productId);
          if (poItem) {
            await tx.purchaseOrderItem.update({
              where: { id: poItem.id },
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

  /**
   * Cancel a receiving voucher
   * This reverses inventory movements and updates the PO status
   */
  async cancelReceivingVoucher(
    id: string,
    data: CancelReceivingVoucherInput
  ): Promise<ReceivingVoucherWithDetails> {
    return await prisma.$transaction(async (tx) => {
      // 1. Get the receiving voucher with all its items
      const rv = await tx.receivingVoucher.findUnique({
        where: { id },
        include: {
          PurchaseOrder: {
            include: {
              Supplier: true,
              PurchaseOrderItem: true,
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

      if (!rv) {
        throw new NotFoundError('Receiving Voucher');
      }

      // 2. Validate status - can only cancel 'complete' vouchers
      if (rv.status === 'cancelled') {
        throw new ValidationError('Receiving voucher is already cancelled', {
          status: 'Cannot cancel an already cancelled voucher',
        });
      }

      if (rv.status !== 'complete') {
        throw new ValidationError('Invalid receiving voucher status', {
          status: 'Only complete receiving vouchers can be cancelled',
        });
      }

      // 3. Reverse inventory movements for all received items
      for (const item of rv.ReceivingVoucherItem) {
        if (item.receivedQuantity > 0) {
          // Deduct the stock that was previously added
          await inventoryService.deductStock({
            productId: item.productId,
            warehouseId: rv.warehouseId,
            quantity: item.receivedQuantity,
            uom: item.uom,
            referenceId: rv.id,
            referenceType: 'RV_CANCEL',
            reason: `Cancelled RV ${rv.rvNumber}: ${data.reason}`,
          }, tx);

          // Update the PO item's received quantity (decrement)
          const poItem = rv.PurchaseOrder.PurchaseOrderItem.find(
            (p) => p.productId === item.productId
          );
          if (poItem) {
            await tx.purchaseOrderItem.update({
              where: { id: poItem.id },
              data: {
                receivedQuantity: {
                  decrement: item.receivedQuantity,
                },
              },
            });
          }
        }
      }

      // 4. Update PO receiving status
      const updatedPOItems = await tx.purchaseOrderItem.findMany({
        where: { poId: rv.purchaseOrderId },
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

      // Update PO status back to 'ordered' if it was 'received'
      const newPOStatus = allItemsFullyReceived ? 'received' : 'ordered';

      await tx.purchaseOrder.update({
        where: { id: rv.purchaseOrderId },
        data: {
          receivingStatus,
          status: newPOStatus,
          actualDeliveryDate: allItemsFullyReceived ? rv.PurchaseOrder.actualDeliveryDate : null,
        },
      });

      // 5. Update the receiving voucher status to cancelled
      const cancelledRV = await tx.receivingVoucher.update({
        where: { id },
        data: {
          status: 'cancelled',
          deliveryNotes: rv.deliveryNotes
            ? `${rv.deliveryNotes}\n\n[CANCELLED] ${data.reason}`
            : `[CANCELLED] ${data.reason}`,
        },
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

      return cancelledRV;
    });
  }
}

export const receivingVoucherService = new ReceivingVoucherService();
