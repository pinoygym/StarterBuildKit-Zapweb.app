import { prisma } from '@/lib/prisma';
import { receivingVoucherRepository } from '@/repositories/receiving-voucher.repository';
import { inventoryService } from '@/services/inventory.service';
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
          items: {
            include: {
              product: true,
            },
          },
          supplier: true,
          warehouse: true,
          branch: true,
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
          items: {
            create: processedItems,
          },
        },
        include: {
          items: true,
        },
      });

      // 7. Create inventory batches for received quantities
      for (const item of processedItems) {
        if (item.receivedQuantity > 0) {
          const product = po.items.find((p) => p.productId === item.productId)?.product;
          if (!product) continue;

          // Add stock using inventory service
          await inventoryService.addStock({
            productId: item.productId,
            warehouseId: po.warehouseId,
            quantity: item.receivedQuantity,
            uom: product.baseUOM,
            unitCost: item.unitPrice,
            referenceId: rv.id,
            referenceType: 'RV',
            reason: `Received from RV ${rvNumber} (PO ${po.poNumber})`,
          });

          // Update PO item received quantity
          const poItem = po.items.find((p) => p.productId === item.productId);
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
        const dueDate = this.calculateDueDate(po.supplier.paymentTerms, new Date());

        await tx.accountsPayable.create({
          data: {
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
          purchaseOrder: {
            include: {
              supplier: true,
            },
          },
          warehouse: true,
          branch: true,
          items: {
            include: {
              product: true,
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
      const supplierId = rv.purchaseOrder.supplier.id;
      const supplierName = rv.purchaseOrder.supplier.companyName;

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
      for (const item of rv.items) {
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
            productName: item.product.name,
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
