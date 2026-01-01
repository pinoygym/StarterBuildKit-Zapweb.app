
import { prisma } from './lib/prisma';
import fs from 'fs';

async function verifyAllAdjustments() {
    const reportPath = 'verification-report.txt';
    const log = (msg: string) => {
        console.log(msg);
        fs.appendFileSync(reportPath, msg + '\n');
    };

    // Clear report file
    fs.writeFileSync(reportPath, '');

    try {
        log('Fetching all POSTED adjustments...');
        const adjustments = await prisma.inventoryAdjustment.findMany({
            where: { status: 'POSTED' },
            orderBy: { createdAt: 'desc' },
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

        log(`Found ${adjustments.length} POSTED adjustments.`);
        log('='.repeat(150));

        let totalIssues = 0;

        for (const adj of adjustments) {
            log(`\nVerifying Adjustment: ${adj.adjustmentNumber}`);
            log(`Date: ${adj.createdAt.toISOString()} | Warehouse: ${adj.Warehouse.name}`);
            log('-'.repeat(160));
            log('Product'.padEnd(35) + '| Adj Act'.padEnd(10) + '| Cur Inv'.padEnd(10) + '| Sub Mvmt'.padEnd(10) + '| Calc Exp'.padEnd(10) + '| Status'.padEnd(10) + '| Note');
            log('-'.repeat(160));

            let adjIssues = 0;

            // Map to track duplicates within this adjustment
            const productcounts = new Map<string, number>();
            adj.items.forEach(i => productcounts.set(i.productId, (productcounts.get(i.productId) || 0) + 1));

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
                const adjustmentActualQty = item.actualQuantity || 0;

                // 2. Get Subsequent Stock Movements
                // Find movements created AFTER this adjustment was posted.
                // We exclude movements linked to THIS adjustment (by referenceId).
                const subsequentMovements = await prisma.stockMovement.findMany({
                    where: {
                        productId: item.productId,
                        warehouseId: adj.warehouseId,
                        createdAt: { gt: adj.createdAt }, // approx check
                        NOT: {
                            referenceId: adj.adjustmentNumber
                        }
                    }
                });

                let netSubsequentChange = 0;
                for (const move of subsequentMovements) {
                    if (move.type === 'IN') netSubsequentChange += Number(move.quantity);
                    else if (move.type === 'OUT') netSubsequentChange -= Number(move.quantity);
                    else if (move.type === 'ADJUSTMENT') {
                        // Assuming adjustment movements are recorded with relative quantity changes
                        // For ABSOLUTE adjustments, the StockMovement records the delta.
                        // So simpler: just sum the stored quantity for IN vs OUT?
                        // Wait, StockMovement type is 'ADJUSTMENT'. Quantity is absolute value. 
                        // We need to know if it was IN or OUT? 
                        // The `inventory.service.ts` logic: 
                        // if diff > 0 type='IN', else type='OUT' (for relative)
                        // But specific `adjustStockBatch` records type='IN' or 'OUT'. 
                        // It does NOT record type='ADJUSTMENT' usually, it records IN/OUT with referenceType='ADJUSTMENT'.
                        // Let's re-verify service logic.

                        // In `adjustStockBatch`:
                        // const movementType = quantityDifference > 0 ? 'IN' : 'OUT';
                        // stockMovements.push({ ..., type: movementType, referenceType: 'ADJUSTMENT' ... })

                        // So we should see type IN/OUT.
                        // If type is explicitly 'ADJUSTMENT', it might be from legacy `adjustStock`.
                        // `adjustStock` uses type='ADJUSTMENT' and quantity=Math.abs(diff).
                        // BUT it doesn't store direction in `type`. 
                        // We might need to infer from reasoning or check if we use `adjustStock` anywhere.
                        // But `post` uses `adjustStockBatch`.
                    }
                }

                // UOM Conversion Logic
                const product = item.Product as any; // Cast to access productUOMs if not typed
                const baseUOM = product.baseUOM;
                let conversionFactor = 1;

                if (item.uom.trim().toLowerCase() !== baseUOM.trim().toLowerCase()) {
                    // Try to find conversion
                    // We need to fetch productUOMs in the include!
                    const uomDef = product.productUOMs?.find((u: any) => u.name.trim().toLowerCase() === item.uom.trim().toLowerCase());
                    if (uomDef) {
                        conversionFactor = Number(uomDef.conversionFactor);
                    } else {
                        // Fallback or warning if UOM not found
                        // Maybe it's a legacy UOM or casing issue?
                    }
                }

                const adjustmentActualBase = (item.actualQuantity || 0) * conversionFactor;
                const netSubsequentChangeBase = netSubsequentChange; // StockMovement is already in Base UOM? Yes, usually.

                // Note: StockMovement logic in service converts to Base before recording. 

                const expectedCurrentQty = adjustmentActualBase + netSubsequentChangeBase;

                // For duplicates, we really can't verify easily line-by-line because of the stale read issue in POST.
                // But UOM conversion will at least fix the 12 vs 480 issue.

                const gap = currentQty - expectedCurrentQty;
                const isMatch = Math.abs(gap) < 0.001;

                let note = '';
                if (productcounts.get(item.productId)! > 1) note = 'Duplicate Item';

                const status = isMatch ? '✅ MATCH' : '❌ MISMATCH';

                if (!isMatch) {
                    adjIssues++;
                    totalIssues++;
                }

                log(
                    item.Product.name.substring(0, 33).padEnd(35) +
                    `| ${adjustmentActualQty.toFixed(2)}`.padEnd(10) +
                    `| ${currentQty.toFixed(2)}`.padEnd(10) +
                    `| ${netSubsequentChange.toFixed(2)}`.padEnd(10) +
                    `| ${expectedCurrentQty.toFixed(2)}`.padEnd(10) +
                    `| ${status}`.padEnd(10) +
                    `| ${note}`
                );

                if (!isMatch && totalIssues < 20) { // Limit detailed tracing
                    log(`    >>> TRACE MISMATCH: ${item.Product.name} (${item.productId})`);
                    log(`    >>> Adjustment Time: ${adj.createdAt.toISOString()}`);
                    log(`    >>> Subsequent Movements found: ${subsequentMovements.length}`);
                    subsequentMovements.forEach(m => {
                        log(`        - ${m.createdAt.toISOString()} | ${m.type} | ${m.quantity} | Ref: ${m.referenceId || 'N/A'}`);
                    });
                }
            }
            if (adjIssues === 0) log(`Result: OK`);
            else log(`Result: ${adjIssues} ISSUES FOUND`);
        }

    } catch (error) {
        log(`Error: ${error}`);
    } finally {
        await prisma.$disconnect();
    }
}

verifyAllAdjustments();
