
import { prisma } from './lib/prisma';

async function verifyAdjustment() {
    const adjNumber = 'ADJ-20251224-0009';
    try {
        console.log(`Verifying Adjustment: ${adjNumber}`);

        const adjustment = await prisma.inventoryAdjustment.findFirst({
            where: { adjustmentNumber: adjNumber },
            include: {
                items: {
                    include: {
                        Product: {
                            include: {
                                productUOMs: true
                            }
                        }
                    }
                },
                Warehouse: true
            }
        });

        if (!adjustment) {
            console.error('Adjustment not found!');
            return;
        }

        console.log(`Warehouse: ${adjustment.Warehouse.name}`);
        console.log(`Status: ${adjustment.status}`);
        console.log('--- Verification Table ---');
        console.log('Product'.padEnd(30) + '| Adj Qty (UOM)'.padEnd(20) + '| Type'.padEnd(10) + '| System Qty'.padEnd(12) + '| Actual Qty'.padEnd(12) + '| Current Inv (Base)'.padEnd(20) + '| Status');
        console.log('-'.repeat(120));

        let issues = 0;

        for (const item of adjustment.items) {
            // Get current inventory
            const inventory = await prisma.inventory.findUnique({
                where: {
                    productId_warehouseId: {
                        productId: item.productId,
                        warehouseId: adjustment.warehouseId
                    }
                }
            });

            const currentQty = inventory ? Number(inventory.quantity) : 0;
            const expectedQty = item.actualQuantity || 0;

            // Note: actualQuantity in adjustment item is usually in BASE UOM if it was calculated during post? 
            // Let's check the schema definition or service logic. 
            // In service.ts: 
            // if (item.type === 'ABSOLUTE') actualQuantity = item.quantity;
            // else actualQuantity = currentStock + item.quantity (where item.quantity was converted to base? No, wait)

            // Re-checking service logic:
            // "const stockItems = refreshedAdjustment.items.map..." passed to adjustStockBatch
            // adjustStockBatch converts to base quantity.

            // The `InventoryAdjustmentItem` table has `systemQuantity` and `actualQuantity` which are snapshot at the time of posting.
            // But `currentQty` from `Inventory` table should match `actualQuantity` from the adjustment item IF no other movements happened since then.

            // Since this is the latest adjustment (number 9), assuming no other ops, Current Inv should == Actual Qty.

            const status = Math.abs(currentQty - expectedQty) < 0.001 ? 'MATCH' : 'MISMATCH';
            if (status === 'MISMATCH') issues++;

            console.log(
                item.Product.name.substring(0, 28).padEnd(30) +
                `| ${item.quantity} ${item.uom}`.padEnd(20) +
                `| ${item.type}`.padEnd(10) +
                `| ${item.systemQuantity}`.padEnd(12) +
                `| ${item.actualQuantity}`.padEnd(12) +
                `| ${currentQty}`.padEnd(20) +
                `| ${status}`
            );
        }

        console.log('-'.repeat(120));
        if (issues === 0) {
            console.log('✅ All items match current inventory.');
        } else {
            console.error(`❌ Found ${issues} mismatches.`);
        }

    } catch (error) {
        console.error(error);
    } finally {
        await prisma.$disconnect();
    }
}

verifyAdjustment();
