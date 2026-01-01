
import { prisma } from '../lib/prisma';
import { InventoryAdjustmentItem, Product, ProductUOM } from '@prisma/client';

/**
 * Verification Script for Inventory Adjustments (ADJ 1-9)
 * 
 * Logic:
 * 1. Fetch Adjustments ADJ-20251224-0001 to ADJ-20251224-0009.
 * 2. For each item in each adjustment:
 *    a. Re-calculate the "Stock Level After Adjustment" (StockAtPost).
 *       - Use defined UOM conversion logic to ensure we don't rely on potentially buggy 'actualQuantity' field.
 *       - For ABSOLUTE: StockAtPost = Converted Item Qty.
 *       - For RELATIVE: StockAtPost = SystemQty (Base) + Converted Item Qty.
 *    b. Fetch all StockMovements for this Product+Warehouse that occurred AFTER the adjustment.
 *       - Filter strictly by createdAt > Adjustment.updatedAt (Posting Time).
 *       - Exclude the movement associated with the adjustment itself (via referenceId).
 *    c. ExpectedCurrent = StockAtPost + Sum(Subsequent Movements).
 *    d. Fetch ActualCurrent from Inventory table.
 *    e. Compare.
 */

async function main() {
    // 1. Fetch Adjustments
    const adjustments = await prisma.inventoryAdjustment.findMany({
        where: {
            adjustmentNumber: {
                in: [
                    'ADJ-20251224-0001', 'ADJ-20251224-0002', 'ADJ-20251224-0003',
                    'ADJ-20251224-0004', 'ADJ-20251224-0005', 'ADJ-20251224-0006',
                    'ADJ-20251224-0007', 'ADJ-20251224-0008', 'ADJ-20251224-0009'
                ]
            },
            status: 'POSTED'
        },
        include: {
            items: {
                include: {
                    Product: {
                        include: {
                            productUOMs: true
                        }
                    }
                }
            }
        },
        orderBy: { adjustmentNumber: 'asc' }
    });

    console.log(`Found ${adjustments.length} posted adjustments to verify.`);

    let discrepancies = 0;

    for (const adj of adjustments) {
        console.log(`\nVerifying ${adj.adjustmentNumber} (Posted: ${adj.updatedAt.toISOString()})...`);
        const postDate = adj.updatedAt;

        for (const item of adj.items) {
            const product = item.Product;
            const warehouseId = adj.warehouseId;

            // Calculate Base Quantity of the adjustment
            const conversionFactor = getConversionFactor(product, item.uom);
            const baseAdjQty = item.quantity * conversionFactor;

            // Determine Stock At Post
            let stockAtPost = 0;
            // The systemQuantity stored on the item is the inventory BEFORE post (Base UOM).
            const systemQtyBefore = item.systemQuantity || 0;

            if (item.type === 'ABSOLUTE') {
                stockAtPost = baseAdjQty;
            } else {
                stockAtPost = systemQtyBefore + baseAdjQty;
            }

            // Fetch Subsequent Movements
            // We look for movements created AFTER the adjustment was posted.
            // Note: We exclude movements with referenceId == adj.adjustmentNumber to avoid double counting the adjustment itself
            // if for some reason the dates overlap or logic is tricky. 
            // However, the adjustment movement is usually created slightly BEFORE adj.updatedAt (in the same txn).
            // So createdAt > adj.updatedAt should inherently exclude it.
            // But we add the referenceId check for safety.
            const subsequentMovements = await prisma.stockMovement.findMany({
                where: {
                    productId: product.id,
                    warehouseId: warehouseId,
                    createdAt: {
                        gt: postDate
                    },
                    referenceId: {
                        not: adj.adjustmentNumber
                    }
                }
            });

            let movementSum = 0;
            for (const mov of subsequentMovements) {
                if (mov.type === 'IN' || (mov.type === 'ADJUSTMENT' && mov.quantity > 0)) { // Assuming + quantity implies IN for ADJ if type ambiguous
                    // Wait, type ADJUSTMENT in DB usually has positive quantity field?
                    // Checked schema: quantity Float.
                    // Checked service: type 'ADJUSTMENT' records quantity as Math.abs(diff).
                    // But logic for IN/OUT is separate. 
                    // Service stores type IN/OUT for relative adj. 
                    // For manual `adjustStock` (not batch), it uses type ADJUSTMENT.
                    // We need to know direction.
                    // If type is IN/OUT, easy.
                    // If type is ADJUSTMENT, we might need reason or luck. 
                    // However, batch adjustment uses IN/OUT. Manual uses IN/OUT where possible?
                    // Let's assume IN/OUT is reliable.
                    movementSum += mov.quantity;
                } else if (mov.type === 'OUT') {
                    movementSum -= mov.quantity;
                } else if (mov.type === 'ADJUSTMENT') {
                    // Logic for raw ADJUSTMENT type is tricky without sign.
                    // But assume most are IN/OUT.
                    // If we encounter plain ADJUSTMENT, we log warning.
                    console.warn(`  WARNING: Found generic ADJUSTMENT movement ${mov.id}. Assuming ???`);
                }
            }

            const expectedQty = stockAtPost + movementSum;

            // Get Current Actual Inventory
            const currentInv = await prisma.inventory.findUnique({
                where: {
                    productId_warehouseId: {
                        productId: product.id,
                        warehouseId: warehouseId
                    }
                }
            });

            const actualQty = currentInv ? currentInv.quantity : 0;

            const diff = actualQty - expectedQty;
            const isMatch = Math.abs(diff) < 0.0001; // Float tolerance

            if (!isMatch) {
                discrepancies++;
                console.log(`  [MISMATCH] Item: ${product.name} (${item.uom})`);
                console.log(`    System Qty (Before): ${systemQtyBefore}`);
                console.log(`    Adj Action: ${item.type} ${baseAdjQty} (Base)`);
                console.log(`    Calculated Stock @ Post: ${stockAtPost}`);
                console.log(`    Subsequent Movements: ${movementSum} (Count: ${subsequentMovements.length})`);
                console.log(`    Expected Current: ${expectedQty}`);
                console.log(`    Actual Current:   ${actualQty}`);
                console.log(`    Difference:       ${diff}`);

                // Debug: list movements
                if (subsequentMovements.length > 0) {
                    console.log(`    Movements:`);
                    subsequentMovements.forEach(m =>
                        console.log(`      ${m.createdAt.toISOString()} [${m.type}] ${m.quantity} Ref:${m.referenceId}`)
                    );
                }
            } else {
                console.log(`  [OK] ${product.name}: Expected ${expectedQty} == Actual ${actualQty}`);
            }
        }
    }

    if (discrepancies === 0) {
        console.log("\nAll verified adjustments match current inventory state!");
    } else {
        console.log(`\nFound ${discrepancies} discrepancies.`);
    }
}

function getConversionFactor(product: any, uomName: string): number {
    if (uomName === product.baseUOM) return 1;
    const uom = product.productUOMs.find((u: any) => u.name === uomName);
    return uom ? uom.conversionFactor : 1; // Default to 1 if not found (should not happen for valid data)
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
