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
import { convertUOMQuantity, calculateUnitCostInBaseUOM } from '@/lib/uom-conversion';

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
    console.log('=== RECEIVING VOUCHER SERVICE: createReceivingVoucher START ===');
    console.log('Input data:', JSON.stringify(data, null, 2));

    let rv: any = null;
    const createdInventoryBatches: string[] = [];

    try {
      // Phase 1: Create RV and RV items (core data only)
      console.log('=== Phase 1: Creating RV and RV items ===');
      rv = await prisma.$transaction(
        async (tx) => {
          // 1. Get PO with items and related data
          console.log('Step 1: Fetching purchase order with ID:', data.purchaseOrderId);
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

          console.log('Purchase order found:', !!po);
          if (po) {
            console.log('PO status:', po.status);
            console.log('PO items count:', po.PurchaseOrderItem.length);
          }

          if (!po) {
            throw new NotFoundError('Purchase Order');
          }

          // Validate related entities exist
          if (!po.Supplier) {
            throw new ValidationError('Purchase order is missing supplier information');
          }
          if (!po.Warehouse) {
            throw new ValidationError('Purchase order is missing warehouse information');
          }
          if (!po.Branch) {
            throw new ValidationError('Purchase order is missing branch information');
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
              uom: item.uom,
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

          // Create receiving voucher items
          await tx.receivingVoucherItem.createMany({
            data: processedItems.map(item => ({
              id: item.id,
              rvId: rv.id,
              productId: item.productId,
              uom: item.uom,
              orderedQuantity: item.orderedQuantity,
              receivedQuantity: item.receivedQuantity,
              varianceQuantity: item.varianceQuantity,
              variancePercentage: item.variancePercentage,
              varianceReason: item.varianceReason,
              unitPrice: item.unitPrice,
              lineTotal: item.lineTotal,
            })),
          });

          return { rv, po, processedItems };
        },
        { timeout: 10000 }
      );

      console.log('=== Phase 1 completed. RV ID:', rv.rv.id);

      // Phase 2: Create inventory batches and stock movements
      console.log('=== Phase 2: Creating inventory batches ===');
      await prisma.$transaction(
        async (tx) => {
          for (const item of rv.processedItems) {
            if (item.receivedQuantity > 0) {
              console.log('Processing item:', item.productId, 'quantity:', item.receivedQuantity);

              const product = rv.po.PurchaseOrderItem.find((p) => p.productId === item.productId)?.Product;
              if (!product) {
                console.error('Product not found for item:', item.productId);
                continue;
              }

              // Validate product has required fields
              if (!product.baseUOM || !product.shelfLifeDays) {
                throw new ValidationError(`Product ${product.name} is missing required configuration`);
              }

              const poItem = rv.po.PurchaseOrderItem.find((p) => p.productId === item.productId);
              if (!poItem) continue;

              // Convert unit price to base UOM if necessary
              const costConversion = calculateUnitCostInBaseUOM(
                item.unitPrice,
                poItem.uom,
                product.baseUOM,
                (await tx.product.findUnique({
                  where: { id: item.productId },
                  include: { ProductUOM: true },
                }))?.ProductUOM || []
              );

              if (!costConversion.success) {
                throw new ValidationError(costConversion.error || `Failed to calculate unit cost for ${poItem.uom}`);
              }

              const unitCostInBaseUOM = costConversion.unitCostInBaseUOM;

              // Generate batch number
              const batchCount = await tx.inventoryBatch.count();
              const batchNumber = `BATCH-${String(batchCount + 1).padStart(6, '0')}`;

              // Calculate dates
              const receivedDate = new Date();
              const expiryDate = new Date(receivedDate);
              expiryDate.setDate(expiryDate.getDate() + product.shelfLifeDays);

              // Determine quantity in base UOM
              const quantityConversion = convertUOMQuantity(
                item.receivedQuantity,
                poItem.uom,
                product.baseUOM,
                (await tx.product.findUnique({
                  where: { id: item.productId },
                  include: { ProductUOM: true },
                }))?.ProductUOM || []
              );

              if (!quantityConversion.success) {
                throw new ValidationError(quantityConversion.error || `Failed to convert quantity for ${poItem.uom}`);
              }

              const quantityInBaseUOM = quantityConversion.convertedQuantity;
              console.log(`✅ UOM Conversion successful: ${item.receivedQuantity} ${poItem.uom} = ${quantityInBaseUOM} ${product.baseUOM}`);

              const batch = await tx.inventoryBatch.create({
                data: {
                  id: randomUUID(),
                  batchNumber,
                  productId: item.productId,
                  warehouseId: rv.po.warehouseId,
                  quantity: quantityInBaseUOM,
                  unitCost: Number(unitCostInBaseUOM.toFixed(4)),
                  receivedDate,
                  expiryDate,
                  status: 'active',
                },
              });

              console.log(`✅ Inventory batch created: ${batch.batchNumber}`);
              console.log(`   Quantity: ${quantityInBaseUOM} ${product.baseUOM}`);
              console.log(`   Unit Cost: ₱${unitCostInBaseUOM.toFixed(4)} per ${product.baseUOM}`);

              createdInventoryBatches.push(batch.id);

              // Record stock movement with base UOM quantity
              await tx.stockMovement.create({
                data: {
                  id: randomUUID(),
                  batchId: batch.id,
                  type: 'IN',
                  quantity: quantityInBaseUOM, // Use base UOM quantity for stock movements
                  reason: `Received from RV ${rv.rv.rvNumber} (PO ${rv.po.poNumber}) - ${item.receivedQuantity} ${poItem.uom} = ${quantityInBaseUOM} ${product.baseUOM}`,
                  referenceId: rv.rv.id,
                  referenceType: 'RV',
                },
              });

              console.log(`Stock movement recorded: ${quantityInBaseUOM} ${product.baseUOM} for batch ${batch.batchNumber}`);

              // Update PO item received quantity
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
        },
        { timeout: 15000 }
      );

      console.log('=== Phase 2 completed ===');

      // Phase 3: Update product costs (separate transaction, less critical)
      console.log('=== Phase 3: Updating product costs ===');
      try {
        await prisma.$transaction(
          async (tx) => {
            for (const batchId of createdInventoryBatches) {
              const batch = await tx.inventoryBatch.findUnique({
                where: { id: batchId },
                include: { Product: true },
              });

              if (batch) {
                const currentBatches = await tx.inventoryBatch.findMany({
                  where: {
                    productId: batch.productId,
                    status: 'active',
                  },
                });

                const totalStock = currentBatches.reduce(
                  (sum, b) => sum + Number(b.quantity),
                  0
                );
                const avgCost = currentBatches.reduce(
                  (sum, b) => sum + Number(b.quantity) * Number(b.unitCost),
                  0
                ) / totalStock;

                await tx.product.update({
                  where: { id: batch.productId },
                  data: {
                    averageCostPrice: Number(avgCost.toFixed(2)),
                  },
                });
              }
            }
          },
          { timeout: 10000 }
        );
        console.log('=== Phase 3 completed ===');
      } catch (costError) {
        console.error('=== Phase 3 failed (non-critical) ===', costError);
      }

      // Phase 4: Update PO status and create AP
      console.log('=== Phase 4: Updating PO status and creating AP ===');
      await prisma.$transaction(
        async (tx) => {
          const updatedPOItems = await tx.purchaseOrderItem.findMany({
            where: { poId: rv.po.id },
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
            where: { id: rv.po.id },
            data: {
              receivingStatus,
              status: allItemsFullyReceived ? 'received' : rv.po.status,
              actualDeliveryDate: allItemsFullyReceived ? new Date() : rv.po.actualDeliveryDate,
            },
          });

          if (allItemsFullyReceived) {
            const dueDate = this.calculateDueDate(rv.po.Supplier.paymentTerms, new Date());

            await tx.accountsPayable.create({
              data: {
                id: randomUUID(),
                branchId: rv.po.branchId,
                supplierId: rv.po.supplierId,
                purchaseOrderId: rv.po.id,
                totalAmount: rv.rv.totalReceivedAmount,
                paidAmount: 0,
                balance: rv.rv.totalReceivedAmount,
                dueDate,
                status: 'pending',
              },
            });
          }
        },
        { timeout: 10000 }
      );

      console.log('=== Phase 4 completed ===');

      // Return created RV with details
      const createdRV = await prisma.receivingVoucher.findUnique({
        where: { id: rv.rv.id },
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

      console.log('=== RECEIVING VOUCHER CREATION COMPLETED SUCCESSFULLY ===');
      return createdRV!;
    } catch (error) {
      console.error('=== RECEIVING VOUCHER SERVICE: Creation failed ===');
      console.error('Error:', error);
      console.error('Error message:', error instanceof Error ? error.message : String(error));
      console.error('Error stack:', error instanceof Error ? error.stack : 'No stack');

      // Cleanup: If RV was created but inventory failed, we should clean up
      if (rv && createdInventoryBatches.length === 0) {
        console.log('Cleaning up failed RV creation...');
        try {
          await prisma.receivingVoucher.delete({ where: { id: rv.rv.id } });
          console.log('RV cleanup completed');
        } catch (cleanupError) {
          console.error('Failed to cleanup RV:', cleanupError);
        }
      }

      throw error;
    }
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
