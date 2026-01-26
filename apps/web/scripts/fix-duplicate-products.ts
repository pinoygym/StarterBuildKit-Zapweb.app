import { prisma } from '../lib/prisma';

/**
 * Script to fix duplicate products in adjustment slips by merging them
 * This needs to run BEFORE applying the unique constraint
 */
async function fixDuplicateProducts() {
    try {
        console.log('🔧 Fixing duplicate products in adjustment slips...\n');

        // Get all adjustments with their items
        const adjustments = await prisma.inventoryAdjustment.findMany({
            include: {
                items: true,
            },
            orderBy: {
                createdAt: 'desc',
            },
        });

        let fixedCount = 0;
        let adjustmentsFixed = 0;

        for (const adjustment of adjustments) {
            const productGroups = new Map<string, typeof adjustment.items>();
            let hasDuplicates = false;

            // Group items by productId
            for (const item of adjustment.items) {
                if (!productGroups.has(item.productId)) {
                    productGroups.set(item.productId, []);
                }
                productGroups.get(item.productId)?.push(item);
            }

            // Find products with duplicates
            for (const [productId, items] of productGroups.entries()) {
                if (items.length > 1) {
                    hasDuplicates = true;
                    console.log(`⚠️  Adjustment: ${adjustment.adjustmentNumber}`);
                    console.log(`   Product ID: ${productId} appears ${items.length} times`);

                    // Keep the first item, sum the quantities, delete the rest
                    const [firstItem, ...duplicates] = items;
                    const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);

                    console.log(`   Merging ${items.length} items: quantities ${items.map(i => i.quantity).join(' + ')} = ${totalQuantity}`);

                    // Update the first item with the sum
                    await prisma.inventoryAdjustmentItem.update({
                        where: { id: firstItem.id },
                        data: { quantity: totalQuantity },
                    });

                    // Delete the duplicate items
                    for (const duplicate of duplicates) {
                        await prisma.inventoryAdjustmentItem.delete({
                            where: { id: duplicate.id },
                        });
                        fixedCount++;
                    }

                    console.log(`   ✅ Merged into single item with quantity: ${totalQuantity}\n`);
                }
            }

            if (hasDuplicates) {
                adjustmentsFixed++;
            }
        }

        console.log(`\n✅ Fixed ${fixedCount} duplicate items across ${adjustmentsFixed} adjustment slips`);

        if (fixedCount === 0) {
            console.log('✨ No duplicates found! Database is clean.');
        } else {
            console.log('\n💡 You can now safely apply the unique constraint by running:');
            console.log('   bunx prisma db push');
        }
    } catch (error) {
        console.error('❌ Error fixing duplicates:', error);
    } finally {
        await prisma.$disconnect();
    }
}

fixDuplicateProducts();
