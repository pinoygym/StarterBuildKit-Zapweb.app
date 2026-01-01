import { prisma } from '../lib/prisma';

async function checkDuplicateProductsInAdjustments() {
    try {
        console.log('🔍 Checking for duplicate products in adjustment slips...\n');

        // Get all adjustment slips with their items
        const adjustments = await prisma.inventoryAdjustment.findMany({
            include: {
                items: {
                    include: {
                        Product: {
                            select: {
                                name: true,
                            },
                        },
                    },
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
        });

        let foundDuplicates = false;

        // Check each adjustment for duplicate products
        for (const adjustment of adjustments) {
            const productCounts = new Map<string, number>();
            const productDetails = new Map<string, any[]>();

            // Count occurrences of each product
            for (const item of adjustment.items) {
                const count = productCounts.get(item.productId) || 0;
                productCounts.set(item.productId, count + 1);

                if (!productDetails.has(item.productId)) {
                    productDetails.set(item.productId, []);
                }
                productDetails.get(item.productId)?.push(item);
            }

            // Find products that appear more than once
            const duplicates = Array.from(productCounts.entries()).filter(
                ([_, count]) => count > 1
            );

            if (duplicates.length > 0) {
                foundDuplicates = true;
                console.log(`⚠️  Adjustment: ${adjustment.adjustmentNumber}`);
                console.log(`   Status: ${adjustment.status}`);
                console.log(`   Created: ${adjustment.createdAt.toISOString()}`);
                console.log(`   Duplicates found:\n`);

                for (const [productId, count] of duplicates) {
                    const items = productDetails.get(productId) || [];
                    const productName = items[0]?.Product?.name || 'Unknown';

                    console.log(`   📦 Product: ${productName}`);
                    console.log(`   🔢 Appears ${count} times in this adjustment`);
                    console.log(`   Details:`);

                    items.forEach((item, index) => {
                        console.log(
                            `      ${index + 1}. Actual: ${item.actualQuantity} ${item.actualUOM}, ` +
                            `Expected: ${item.expectedQuantity} ${item.expectedUOM}, ` +
                            `Variance: ${item.varianceQuantity} ${item.varianceUOM}`
                        );
                    });
                    console.log('');
                }
                console.log('---\n');
            }
        }

        if (!foundDuplicates) {
            console.log('✅ No duplicate products found in any adjustment slips.');
        } else {
            console.log('\n📊 Summary: Found adjustment slips with duplicate products.');
        }

        // Summary statistics
        const totalAdjustments = adjustments.length;
        const adjustmentsWithDuplicates = adjustments.filter((adj) => {
            const productCounts = new Map<string, number>();
            adj.items.forEach((item) => {
                const count = productCounts.get(item.productId) || 0;
                productCounts.set(item.productId, count + 1);
            });
            return Array.from(productCounts.values()).some((count) => count > 1);
        }).length;

        console.log(`\n📈 Statistics:`);
        console.log(`   Total adjustments: ${totalAdjustments}`);
        console.log(`   Adjustments with duplicates: ${adjustmentsWithDuplicates}`);
        console.log(
            `   Percentage: ${totalAdjustments > 0 ? ((adjustmentsWithDuplicates / totalAdjustments) * 100).toFixed(2) : 0}%`
        );
    } catch (error) {
        console.error('❌ Error checking for duplicates:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkDuplicateProductsInAdjustments();
