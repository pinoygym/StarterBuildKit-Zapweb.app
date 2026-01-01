import { prisma } from '@/lib/prisma';
import { receivingVoucherRepository } from '@/repositories/receiving-voucher.repository';
import { randomUUID } from 'crypto';
import {
  CreateReceivingVoucherInput,
  ReceivingVoucherWithDetails,
  ReceivingVoucherFilters,
  VarianceReport,
  CancelReceivingVoucherInput,
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
              poItemId: item.poItemId,
              uom: item.uom,
              orderedQuantity: orderedQty,
              receivedQuantity: receivedQty,
              varianceQuantity: varianceQty,
              variancePercentage: Number(variancePercentage.toFixed(2)),
              varianceReason: item.varianceReason || null,
              unitPrice: unitPrice,
              lineTotal: Number(lineTotal.toFixed(2)),
              adjustedUnitPrice: unitPrice, // Will be updated if recompute is enabled
            };
          });

          const varianceAmount = totalReceivedAmount - totalOrderedAmount;

          // 6. Calculate supplier discount
          let discountAmount = 0;
          const supplierDiscount = data.supplierDiscount || 0;
          const supplierDiscountType = data.supplierDiscountType || null;

          if (supplierDiscount > 0) {
            if (supplierDiscountType === 'percentage') {
              discountAmount = (totalReceivedAmount * supplierDiscount) / 100;
            } else if (supplierDiscountType === 'fixed') {
              discountAmount = supplierDiscount;
            }
          }

          // 7. Calculate net amount
          const additionalFees = data.additionalFees || 0;
          const netAmount = totalReceivedAmount - discountAmount + additionalFees;

          console.log('=== Discount and Fee Calculations ===');
          console.log('Total Received Amount:', totalReceivedAmount);
          console.log('Supplier Discount:', discountAmount);
          console.log('Additional Fees:', additionalFees);
          console.log('Net Amount:', netAmount);

          // 8. If recompute average cost is enabled, adjust unit prices
          const recomputeAverageCost = data.recomputeAverageCost || false;
          if (recomputeAverageCost && totalReceivedAmount > 0) {
            console.log('=== Recomputing Unit Average Costs ===');

            for (const item of processedItems) {
              // Calculate proportional discount for this item
              const itemProportion = item.lineTotal / totalReceivedAmount;
              const itemDiscount = discountAmount * itemProportion;
              const itemFees = additionalFees * itemProportion;

              // Adjusted line total
              const adjustedLineTotal = item.lineTotal - itemDiscount + itemFees;

              // Adjusted unit price
              const adjustedUnitPrice = item.receivedQuantity > 0
                ? adjustedLineTotal / item.receivedQuantity
                : item.unitPrice;

              item.adjustedUnitPrice = Number(adjustedUnitPrice.toFixed(4));

              console.log(`Item ${item.productId}:`);
              console.log(`  Original Unit Price: ₱${item.unitPrice.toFixed(2)}`);
              console.log(`  Proportional Discount: ₱${itemDiscount.toFixed(2)}`);
              console.log(`  Proportional Fees: ₱${itemFees.toFixed(2)}`);
              console.log(`  Adjusted Unit Price: ₱${item.adjustedUnitPrice.toFixed(2)}`);
            }
          }

          // 9. Create ReceivingVoucher
          const now = new Date();
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
              supplierDiscount: Number(discountAmount.toFixed(2)),
              supplierDiscountType: supplierDiscountType,
              additionalFees: Number(additionalFees.toFixed(2)),
              additionalFeesDescription: data.additionalFeesDescription || null,
              recomputeAverageCost: recomputeAverageCost,
              netAmount: Number(netAmount.toFixed(2)),
              createdAt: now,
              updatedAt: now,
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

      // Phase 2: Update inventory and calculate average cost
      console.log('=== Phase 2: Updating inventory and costs ===');
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
              if (!product.baseUOM) {
                throw new ValidationError(`Product ${product.name} is missing base UOM`);
              }

              // Find the specific PO item
              let poItem;
              if (item.poItemId) {
                poItem = rv.po.PurchaseOrderItem.find((p) => p.id === item.poItemId);
              }

              // Fallback to product ID matching if poItemId is not provided or not found
              if (!poItem) {
                poItem = rv.po.PurchaseOrderItem.find((p) => p.productId === item.productId);
              }

              if (!poItem) {
                console.error('PO Item not found for item:', item.productId, 'poItemId:', item.poItemId);
                continue;
              }

              // Convert unit price to base UOM if necessary
              // Use adjusted unit price if recompute is enabled, otherwise use original
              const unitPriceToUse = item.adjustedUnitPrice || item.unitPrice;

              const costConversion = calculateUnitCostInBaseUOM(
                unitPriceToUse,
                item.uom, // Use the UOM from the receiving voucher item, not PO item
                product.baseUOM,
                (await tx.product.findUnique({
                  where: { id: item.productId },
                  include: { productUOMs: true },
                }))?.productUOMs || []
              );

              if (!costConversion.success) {
                throw new ValidationError(costConversion.error || `Failed to calculate unit cost for ${item.uom}`);
              }

              const unitCostInBaseUOM = costConversion.unitCostInBaseUOM;

              // Determine quantity in base UOM
              const quantityConversion = convertUOMQuantity(
                item.receivedQuantity,
                item.uom, // Use the UOM from the receiving voucher item, not PO item
                product.baseUOM,
                (await tx.product.findUnique({
                  where: { id: item.productId },
                  include: { productUOMs: true },
                }))?.productUOMs || []
              );

              if (!quantityConversion.success) {
                throw new ValidationError(quantityConversion.error || `Failed to convert quantity for ${item.uom}`);
              }

              const quantityInBaseUOM = quantityConversion.convertedQuantity;
              console.log(`✅ UOM Conversion successful: ${item.receivedQuantity} ${item.uom} = ${quantityInBaseUOM} ${product.baseUOM}`);

              // Update Inventory
              // Get current inventory to calculate new average cost
              const currentInventory = await tx.inventory.findUnique({
                where: {
                  productId_warehouseId: {
                    productId: item.productId,
                    warehouseId: rv.po.warehouseId,
                  },
                },
              });

              const currentQuantity = currentInventory ? Number(currentInventory.quantity) : 0;

              // Calculate new global average cost for the product
              // Formula: ((Current Total Stock * Current Avg Cost) + (New Qty * New Cost)) / (Current Total Stock + New Qty)
              // Note: We use global stock for average cost to keep it consistent across warehouses, 
              // or we could track per warehouse. The requirement implies a single average cost per product usually.
              // Let's check if we should use global or per-warehouse cost. 
              // The Product model has 'averageCostPrice', which is global.

              const allInventory = await tx.inventory.findMany({
                where: { productId: item.productId }
              });
              const globalCurrentStock = allInventory.reduce((sum, inv) => sum + Number(inv.quantity), 0);
              const currentAvgCost = Number(product.averageCostPrice) || 0;

              const totalValue = (globalCurrentStock * currentAvgCost) + (quantityInBaseUOM * unitCostInBaseUOM);
              const totalQuantity = globalCurrentStock + quantityInBaseUOM;

              const newAvgCost = totalQuantity > 0 ? totalValue / totalQuantity : unitCostInBaseUOM;

              // Update Product Average Cost
              await tx.product.update({
                where: { id: item.productId },
                data: {
                  averageCostPrice: Number(newAvgCost.toFixed(4)),
                },
              });

              // Upsert Inventory
              await tx.inventory.upsert({
                where: {
                  productId_warehouseId: {
                    productId: item.productId,
                    warehouseId: rv.po.warehouseId,
                  },
                },
                update: {
                  quantity: { increment: quantityInBaseUOM },
                },
                create: {
                  productId: item.productId,
                  warehouseId: rv.po.warehouseId,
                  quantity: quantityInBaseUOM,
                },
              });

              // Record stock movement
              const isAdjusted = item.adjustedUnitPrice && item.adjustedUnitPrice !== item.unitPrice;
              const reasonSuffix = isAdjusted
                ? ` (Cost adjusted for discount/fees: ₱${item.unitPrice.toFixed(2)} → ₱${item.adjustedUnitPrice.toFixed(2)})`
                : '';

              await tx.stockMovement.create({
                data: {
                  id: randomUUID(),
                  productId: item.productId,
                  warehouseId: rv.po.warehouseId,
                  type: 'IN',
                  quantity: quantityInBaseUOM, // Use base UOM quantity for stock movements
                  reason: `Received from RV ${rv.rv.rvNumber} (PO ${rv.po.poNumber}) - ${item.receivedQuantity} ${poItem.uom} = ${quantityInBaseUOM} ${product.baseUOM}${reasonSuffix}`,
                  referenceId: rv.rv.id,
                  referenceType: 'RV',
                },
              });

              console.log(`Stock movement recorded: ${quantityInBaseUOM} ${product.baseUOM}`);

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

      // Phase 3: Update PO status and create AP
      console.log('=== Phase 3: Updating PO status and creating AP ===');
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

            const now = new Date();
            await tx.accountsPayable.create({
              data: {
                id: randomUUID(),
                branchId: rv.po.branchId,
                supplierId: rv.po.supplierId,
                purchaseOrderId: rv.po.id,
                totalAmount: rv.rv.netAmount, // Use net amount after discount and fees
                paidAmount: 0,
                balance: rv.rv.netAmount,
                dueDate,
                status: 'pending',
                createdAt: now,
                updatedAt: now,
              },
            });
          }
        },
        { timeout: 10000 }
      );

      console.log('=== Phase 3 completed ===');

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
      if (rv) {
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

  /**
   * Cancel receiving voucher
   */
  async cancelReceivingVoucher(id: string, data: CancelReceivingVoucherInput): Promise<ReceivingVoucherWithDetails> {
    console.log('=== RECEIVING VOUCHER SERVICE: cancelReceivingVoucher START ===');
    console.log('RV ID:', id, 'Reason:', data.reason);

    // Get RV with full details including PO items
    const rv = await prisma.receivingVoucher.findUnique({
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

    // Check if already cancelled
    if (rv.status === 'cancelled') {
      throw new ValidationError('Receiving voucher is already cancelled', {
        status: 'Cannot cancel an already cancelled receiving voucher',
      });
    }

    // Check if RV is in cancellable state (only complete RVs can be cancelled)
    if (rv.status !== 'complete') {
      throw new ValidationError('Invalid receiving voucher status', {
        status: 'Only completed receiving vouchers can be cancelled',
      });
    }

    // Check if any received inventory has been used in sales
    // This prevents cancellation if products have been sold
    for (const item of rv.ReceivingVoucherItem) {
      if (item.receivedQuantity > 0) {
        // Check for OUT stock movements after RV creation that reference this RV
        const outMovements = await prisma.stockMovement.findMany({
          where: {
            productId: item.productId,
            warehouseId: rv.warehouseId,
            type: 'OUT',
            createdAt: { gte: rv.createdAt },
          },
        });

        if (outMovements.length > 0) {
          // Check if any OUT movements are sales (not adjustments or other RV reversals)
          const salesMovements = outMovements.filter(m =>
            m.referenceType === 'SALE' ||
            (m.referenceType === null && m.reason?.includes('Sale'))
          );

          if (salesMovements.length > 0) {
            throw new ValidationError('Cannot cancel receiving voucher', {
              inventory: `Product ${item.Product.name} has been sold and cannot be reversed`,
            });
          }
        }
      }
    }

    // Perform cancellation in transaction
    await prisma.$transaction(
      async (tx) => {
        console.log('=== Phase 1: Reversing inventory and stock movements ===');

        // Reverse inventory changes and stock movements
        for (const item of rv.ReceivingVoucherItem) {
          if (item.receivedQuantity > 0) {
            const product = item.Product;

            // Convert received quantity back to base UOM for reversal
            const quantityConversion = convertUOMQuantity(
              item.receivedQuantity,
              item.uom,
              product.baseUOM,
              (await tx.product.findUnique({
                where: { id: item.productId },
                include: { productUOMs: true },
              }))?.productUOMs || []
            );

            if (!quantityConversion.success) {
              throw new ValidationError(quantityConversion.error || `Failed to convert quantity for ${item.uom}`);
            }

            const quantityInBaseUOM = quantityConversion.convertedQuantity;

            // Decrease inventory (reverse the increase)
            await tx.inventory.upsert({
              where: {
                productId_warehouseId: {
                  productId: item.productId,
                  warehouseId: rv.warehouseId,
                },
              },
              update: {
                quantity: { decrement: quantityInBaseUOM },
              },
              create: {
                productId: item.productId,
                warehouseId: rv.warehouseId,
                quantity: -quantityInBaseUOM, // Shouldn't happen, but handle edge case
              },
            });

            // Record reversal stock movement
            await tx.stockMovement.create({
              data: {
                id: randomUUID(),
                productId: item.productId,
                warehouseId: rv.warehouseId,
                type: 'OUT',
                quantity: quantityInBaseUOM,
                reason: `Cancelled RV ${rv.rvNumber} (PO ${rv.PurchaseOrder.poNumber}) - ${item.receivedQuantity} ${item.uom} = ${quantityInBaseUOM} ${product.baseUOM}`,
                referenceId: rv.id,
                referenceType: 'RV_CANCEL',
              },
            });

            // Reverse PO item received quantity
            const poItem = rv.PurchaseOrder.PurchaseOrderItem.find((poItem: any) => poItem.productId === item.productId);
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

        console.log('=== Phase 2: Updating PO status ===');

        // Update PO status after reversing quantities
        const updatedPOItems = await tx.purchaseOrderItem.findMany({
          where: { poId: rv.purchaseOrderId },
        });

        const someItemsReceived = updatedPOItems.some(item => Number(item.receivedQuantity) > 0);

        let receivingStatus = 'pending';
        if (someItemsReceived) {
          receivingStatus = 'partially_received';
        }

        await tx.purchaseOrder.update({
          where: { id: rv.purchaseOrderId },
          data: {
            receivingStatus,
            status: someItemsReceived ? rv.PurchaseOrder.status : 'ordered', // Revert to ordered if no items received
          },
        });

        console.log('=== Phase 3: Reversing accounts payable ===');

        // Check if AP was created for this PO and RV
        const apRecord = await tx.accountsPayable.findFirst({
          where: {
            purchaseOrderId: rv.purchaseOrderId,
            branchId: rv.branchId,
          },
        });

        if (apRecord) {
          // Reverse the AP by setting balance to 0 and status to cancelled
          await tx.accountsPayable.update({
            where: { id: apRecord.id },
            data: {
              balance: 0,
              status: 'cancelled',
              updatedAt: new Date(),
            },
          });
        }

        console.log('=== Phase 4: Updating RV status ===');

        // Update RV status to cancelled and add reason to notes
        const cancelNote = `CANCELLED: ${data.reason}${rv.deliveryNotes ? `\n\nOriginal Notes: ${rv.deliveryNotes}` : ''}`;

        await tx.receivingVoucher.update({
          where: { id },
          data: {
            status: 'cancelled',
            deliveryNotes: cancelNote,
            updatedAt: new Date(),
          },
        });
      },
      { timeout: 15000 }
    );

    console.log('=== RECEIVING VOUCHER CANCELLATION COMPLETED SUCCESSFULLY ===');

    // Return updated RV
    return await this.getReceivingVoucherById(id);
  }
}

export const receivingVoucherService = new ReceivingVoucherService();
