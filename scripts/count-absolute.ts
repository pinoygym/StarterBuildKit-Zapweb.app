import { prisma } from '../lib/prisma';

async function countAbsolute() {
    const count = await prisma.inventoryAdjustmentItem.count({
        where: { type: 'ABSOLUTE' }
    });
    console.log(`ABSOLUTE items: ${count}`);
}

countAbsolute().finally(() => prisma.$disconnect());
