
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

    console.log('--- ALL ITEMS ---');
    for (const item of adj.items) {
        const p = item.Product;
        const available = [p.baseUOM, ...p.productUOMs.map(u => u.name)].join(', ');
        console.log(`Product: "${p.name}"`);
        console.log(`  Used UOM: "${item.uom}"`);
        console.log(`  Valid UOMs: [${available}]`);
        console.log('-----------------------------------');
    }
}

main().catch(console.error).finally(() => prisma.$disconnect());
