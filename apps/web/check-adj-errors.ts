
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

    console.log('--- PRODUCTS REQUIRING CORRECTION ---');
    let count = 0;
    for (const item of adj.items) {
        const p = item.Product;
        const uomUsed = item.uom.trim();
        const uomUsedLower = uomUsed.toLowerCase();

        const validUOMs = [p.baseUOM.trim().toLowerCase(), ...p.productUOMs.map(u => u.name.trim().toLowerCase())];

        // Check if UOM is invalid (and not a standard fallback like 'pcs')
        if (!validUOMs.includes(uomUsedLower) && !['pcs', 'pc'].includes(uomUsedLower)) {
            count++;
            const available = [p.baseUOM, ...p.productUOMs.map(u => u.name)].join(', ');
            console.log(`${count}. Product: "${p.name}"`);
            console.log(`   Used UOM: "${uomUsed}" (Not found)`);
            console.log(`   Available UOMs: [${available}]`);
            console.log('-----------------------------------');
        }
    }

    if (count === 0) {
        console.log('No UOM issues found. Check for negative stock instead.');
    }
}

main().catch(console.error).finally(() => prisma.$disconnect());
