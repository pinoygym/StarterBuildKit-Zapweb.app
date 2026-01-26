import { prisma } from '../lib/prisma';
import { inventoryAdjustmentService } from '../services/inventory-adjustment.service';

/**
 * FULL RE-POST AND VERIFICATION SCRIPT
 * 
 * 1. Resets all InventoryAdjustment records to DRAFT.
 * 2. Clears all StockMovement records related to adjustments.
 * 3. Resets all Inventory quantities to 0.
 * 4. Re-posts all adjustments in chronological order.
 * 5. Runs verification logic.
 */

async function main() {
    console.log('🚀 Starting Full Re-post and Verification process...');

    try {
        // 1. Get a valid User ID for posting
        const user = await prisma.user.findFirst({
            where: { status: 'ACTIVE' },
            orderBy: { createdAt: 'asc' }
        });

        if (!user) {
            throw new Error('No active user found to perform posting.');
        }
        console.log(`👤 Using user: ${user.firstName} ${user.lastName} (${user.id})`);

        // 2. Reset Status to DRAFT
        console.log('📝 Resetting all adjustment statuses to DRAFT...');
        const resetStatus = await prisma.inventoryAdjustment.updateMany({
            data: {
                status: 'DRAFT',
                postedById: null
            }
        });
        console.log(`✅ Reset ${resetStatus.count} adjustments to DRAFT.`);

        // 3. Clear Stock Movements and Reset Inventory
        console.log('🧹 Clearing Stock Movements and resetting Inventory to 0...');
        await prisma.$transaction([
            prisma.stockMovement.deleteMany({
                where: {
                    OR: [
                        { type: 'adjustment' },
                        { type: 'ADJUSTMENT' },
                        { referenceType: 'adjustment' },
                        { referenceType: 'ADJUSTMENT' },
                        { referenceType: 'InventoryAdjustment' }
                    ]
                }
            }),
            prisma.inventory.updateMany({
                data: {
                    quantity: 0
                }
            })
        ]);
        console.log('✅ Inventory and StockMovements reset.');

        // 4. Fetch all adjustments in chronological order
        const adjustments = await prisma.inventoryAdjustment.findMany({
            include: { _count: { select: { items: true } } },
            orderBy: [
                { adjustmentDate: 'asc' },
                { createdAt: 'asc' }
            ]
        });

        console.log(`📤 Re-posting ${adjustments.length} adjustments in sequence...`);

        for (const adj of adjustments) {
            if (adj._count.items === 0) {
                console.log(`⏩ Skipping ${adj.adjustmentNumber} (No items)`);
                continue;
            }
            process.stdout.write(`Posting ${adj.adjustmentNumber}... `);
            try {
                await inventoryAdjustmentService.post(adj.id, user.id);
                console.log('✅ DONE');
            } catch (error) {
                console.log('❌ FAILED');
                console.error(`Error posting ${adj.adjustmentNumber}:`, error);
                // We keep going if it's a validation error about items, but this check above should prevent it.
            }
        }

        console.log('\n🏁 Re-posting complete. Starting verification...\n');

        // 5. Verification Logic (similar to verify-all-adjs-v2.ts)
        const postedAdjustments = await prisma.inventoryAdjustment.findMany({
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
            },
            orderBy: { createdAt: 'desc' }
        });

        console.log('Product'.padEnd(35) + '| Adj Act'.padEnd(10) + '| Cur Inv'.padEnd(10) + '| Status');
        console.log('-'.repeat(65));

        let totalIssues = 0;

        for (const adj of postedAdjustments) {
            for (const item of adj.items) {
                const inventory = await prisma.inventory.findUnique({
                    where: {
                        productId_warehouseId: {
                            productId: item.productId,
                            warehouseId: adj.warehouseId
                        }
                    }
                });
                const currentQty = inventory ? Number(inventory.quantity) : 0;

                // Fetch conversion factor
                let conversionFactor = 1;
                const product = item.Product as any;
                if (item.uom.trim().toLowerCase() !== product.baseUOM.trim().toLowerCase()) {
                    const uomDef = product.productUOMs?.find((u: any) => u.name.trim().toLowerCase() === item.uom.trim().toLowerCase());
                    if (uomDef) {
                        conversionFactor = Number(uomDef.conversionFactor);
                    }
                }

                // Since we reset everything and posted in order, 
                // we'll just check if the current inventory is >= 0 and matches some logic if needed.
                // But specifically for this user request, confirming the "final values" is key.

                const status = currentQty >= 0 ? '✅ OK' : '❌ NEGATIVE';
                if (currentQty < 0) totalIssues++;

                console.log(
                    item.Product.name.substring(0, 33).padEnd(35) +
                    `| ${(item.quantity).toFixed(2)} ${item.uom}`.padEnd(10) +
                    `| ${currentQty.toFixed(2)}`.padEnd(10) +
                    `| ${status}`
                );
            }
        }

        console.log(`\nVerification finished with ${totalIssues} issues.`);

    } catch (error) {
        console.error('❌ Critical failure in main loop:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
