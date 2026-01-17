
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

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

    console.log('--- DETECTED ERRORS ---');
    let errors = 0;
    for (const item of adj.items) {
        const p = item.Product;
        const uomUsed = item.uom.trim().toLowerCase();
        const validUOMs = [p.baseUOM.trim().toLowerCase(), ...p.productUOMs.map(u => u.name.trim().toLowerCase())];

        if (!validUOMs.includes(uomUsed) && !['pcs', 'pc'].includes(uomUsed)) {
            errors++;
            console.log(`ERROR: Product "${p.name}" uses invalid UOM "${item.uom}".`);
        }
    }

    if (errors === 0) {
        console.log('No UOM conversion errors found.');
    }
}

main().catch(console.error).finally(() => prisma.$disconnect());
