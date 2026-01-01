import { prisma } from '../lib/prisma';

async function checkOut() {
    const count = await prisma.stockMovement.count({
        where: { type: 'OUT' }
    });
    console.log(`OUT movements: ${count}`);
}

checkOut().finally(() => prisma.$disconnect());
