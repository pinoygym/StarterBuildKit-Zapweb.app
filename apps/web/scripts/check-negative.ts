import { prisma } from '../lib/prisma';

async function checkNegative() {
    const count = await prisma.inventoryAdjustmentItem.count({
        where: { quantity: { lt: 0 } }
    });
    console.log(`Negative quantity items: ${count}`);
}

checkNegative().finally(() => prisma.$disconnect());
