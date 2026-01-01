
import { prisma } from './lib/prisma';
import { InventoryAdjustment, InventoryAdjustmentItem, Inventory, StockMovement, Product } from '@prisma/client';

async function verifyAllAdjustments() {
    try {
        console.log('Fetching all POSTED adjustments...');
        const adjustments = await prisma.inventoryAdjustment.findMany({
            where: { status: 'POSTED' },
            orderBy: { createdAt: 'desc' },
            include: {
                items: {
                    include: {
                        Product: true
                    }
                },
                Warehouse: true
            }
        });

        console.log(`Found ${adjustments.length} POSTED adjustments.`);
        console.log('='.repeat(150));

        for (const adj of adjustments) {
            console.log(`\nVerifying Adjustment: ${adj.adjustmentNumber} (ID: ${adj.id})`);
            console.log(`Date: ${adj.createdAt.toISOString()} | Warehouse: ${adj.Warehouse.name}`);
            console.log('-'.repeat(150));
            console.log('Product'.padEnd(30) + '| Adj Actual'.padEnd(12) + '| Cur Inv'.padEnd(12) + '| Net Subs Mvmt'.padEnd(15) + '| Expected Inv'.padEnd(15) + '| Gap'.padEnd(10) + '| Status');
            console.log('-'.repeat(150));

            let issues = 0;

            for (const item of adj.items) {
                // 1. Get Current Inventory
                const inventory = await prisma.inventory.findUnique({
                    where: {
                        productId_warehouseId: {
                            productId: item.productId,
                            warehouseId: adj.warehouseId
                        }
                    }
                });
                const currentQty = inventory ? Number(inventory.quantity) : 0;
                const adjustmentActualQty = item.actualQuantity || 0; // The quantity set by this adjustment at that time

                // 2. Get Subsequent Stock Movements
                // We want all movements for this product/warehouse that happened AFTER the adjustment
                // Note: The adjustment itself creates stock movements. We need to exclude those?
                // Or rather, we want movements where createdAt > adj.createdAt
                const subsequentMovements = await prisma.stockMovement.findMany({
                    where: {
                        productId: item.productId,
                        warehouseId: adj.warehouseId,
                        createdAt: { gt: adj.updatedAt } // Use updatedAt as posting time is usually updated then or check logic
                    }
                });

                // Check specific "StockMovement" created by this adjustment to ensure we don't double count or miss
                // The adjustment service creates movements with referenceId = adjustmentNumber or similar.
                // Actually, the adjustment service sets updatedAt when posting.

                let netSubsequentChange = 0;
                for (const move of subsequentMovements) {
                    if (move.type === 'IN') netSubsequentChange += Number(move.quantity);
                    else if (move.type === 'OUT') netSubsequentChange -= Number(move.quantity);
                    else if (move.type === 'ADJUSTMENT') {
                        // Need to check reason or just movement type logic
                        // If it's another adjustment, it might reset the stock (ABSOLUTE) or add/sub (RELATIVE).
                        // This simple accumulation might be tricky if there are subsequent ABSOLUTE adjustments.
                        // But let's assume RELATIVE for now for simplicity or check movement quantity direction.
                        // Actually, StockMovement doesn't explicitly store ABSOLUTE reset value, it stores the CHANGE quantity.
                        // So summing them up should work for tracking "updates since then".

                        // Wait, if a subsequent adjustment was ABSOLUTE, the StockMovement recorded the *change* needed to reach that absolute.
                        // So summing it up IS correct.
                    }
                }

                // Expected Current = (Inventory at that time) + (Changes since then)
                // Adjustment 'actualQuantity' IS the 'Inventory at that time' (after adjustment).
                const expectedCurrentQty = adjustmentActualQty + netSubsequentChange;

                const gap = currentQty - expectedCurrentQty;
                const isMatch = Math.abs(gap) < 0.001;
                const status = isMatch ? '✅ MATCH' : '❌ MISMATCH';

                if (!isMatch) issues++;

                console.log(
                    item.Product.name.substring(0, 28).padEnd(30) +
                    `| ${adjustmentActualQty}`.padEnd(12) +
                    `| ${currentQty}`.padEnd(12) +
                    `| ${netSubsequentChange}`.padEnd(15) +
                    `| ${expectedCurrentQty}`.padEnd(15) +
                    `| ${gap.toFixed(4)}`.padEnd(10) +
                    `| ${status}`
                );
            }
            if (issues === 0) console.log(`Result: OK`);
            else console.log(`Result: ${issues} ISSUES FOUND`);
        }

    } catch (error) {
        console.error(error);
    } finally {
        await prisma.$disconnect();
    }
}

verifyAllAdjustments();
