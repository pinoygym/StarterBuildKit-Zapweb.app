
import { prisma } from './lib/prisma';

async function main() {
    const adjId = '2d206960-5128-4059-aa61-27a4f601043a';
    const adj = await prisma.inventoryAdjustment.findUnique({
        where: { id: adjId },
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
        }
    });

    if (!adj) {
        console.log('Adjustment not found');
        return;
    }

    console.log('--- SELECTA PRODUCTS ---');
    for (const item of adj.items) {
        if (item.Product.name.toLowerCase().includes('selecta') || item.Product.name.toLowerCase().includes('chocolate')) {
            console.log(`Product Name: "${item.Product.name}"`);
            console.log(`Product ID: ${item.Product.productId}`); // Typo check: Product model has id, not productId? In prisma schema it is id. Wait, let's check schema.
            console.log(`Product ID (real): ${item.Product.id}`);
            console.log(`Used UOM: "${item.uom}"`);
            console.log(`Base UOM: "${item.Product.baseUOM}"`);
            console.log(`Alternate UOMs: ${JSON.stringify(item.Product.productUOMs)}`);
        }
    }
}

main().catch(console.error).finally(() => prisma.$disconnect());
