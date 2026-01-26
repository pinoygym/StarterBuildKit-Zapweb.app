
import { prisma } from './lib/prisma';

async function main() {
    const adjId = '2d206960-5128-4059-aa61-27a4f601043a';
    console.log(`Checking adjustment: ${adjId}`);

    const adj = await prisma.inventoryAdjustment.findUnique({
        where: { id: adjId },
        include: {
            items: {
                include: {
                    Product: true
                }
            }
        }
    });

    if (!adj) {
        console.log('Adjustment not found!');
        return;
    }

    console.log(`Adjustment Number: ${adj.adjustmentNumber}`);
    console.log(`Total Items: ${adj.items.length}`);
    console.log('--------------------------------------------------');

    for (const item of adj.items) {
        console.log(`Product ID: ${item.productId}`);
        console.log(`Product Name: "${item.Product.name}"`);
        console.log(`Item UOM: "${item.uom}"`);
        console.log(`Product Base UOM: "${item.Product.baseUOM}"`);
        console.log('--------------------------------------------------');
    }
}

main().catch(console.error);
