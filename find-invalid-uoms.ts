
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

    console.log('--- CHECKING FOR INVALID UOMS ---');
    let errors = 0;
    for (const item of adj.items) {
        const p = item.Product;
        const uomUsed = item.uom.trim();
        const uomUsedLower = uomUsed.toLowerCase();

        const validUOMs = [
            p.baseUOM.trim().toLowerCase(),
            ...p.productUOMs.map(u => u.name.trim().toLowerCase())
        ];

        // Allowed fallbacks
        const fallbacks = ['pcs', 'pc'];

        if (!validUOMs.includes(uomUsedLower) && !fallbacks.includes(uomUsedLower)) {
            errors++;
            const available = [p.baseUOM, ...p.productUOMs.map(u => u.name)].join(', ');
            console.log(`ERROR ${errors}:`);
            console.log(`  Product Name: "${p.name}"`);
            console.log(`  Product ID: ${p.id}`);
            console.log(`  Invalid UOM: "${uomUsed}"`);
            console.log(`  Valid UOMs: [${available}]`);
            console.log('-----------------------------------');
        }
    }

    if (errors === 0) {
        console.log('No UOM invalid errors found.');
    }
}

main().catch(console.error).finally(() => prisma.$disconnect());
