import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const id = 'f368a2cf-a423-4dc3-9c97-f732bfc653f0';

    try {
        const adjustment = await prisma.inventoryAdjustment.findUnique({
            where: { id },
            include: {
                items: {
                    include: {
                        Product: {
                            select: {
                                name: true,
                                baseUOM: true,
                                productUOMs: true
                            }
                        }
                    }
                }
            }
        });

        if (!adjustment) {
            console.log('Adjustment not found');
            return;
        }

        console.log('Adjustment:', adjustment.adjustmentNumber, 'Status:', adjustment.status);
        console.log('Warehouse ID:', adjustment.warehouseId);

        for (const item of adjustment.items) {
            const inventory = await prisma.inventory.findUnique({
                where: {
                    productId_warehouseId: {
                        productId: item.productId,
                        warehouseId: adjustment.warehouseId
                    }
                }
            });

            console.log(`- Product: ${item.Product.name}`);
            console.log(`  Item: qty=${item.quantity}, uom=${item.uom}, type=${item.type}`);
            console.log(`  Current Inventory: ${inventory ? inventory.quantity : 0} ${item.Product.baseUOM}`);
            console.log(`  Snapshot: system=${item.systemQuantity}, actual=${item.actualQuantity}`);
        }

    } catch (error: any) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
