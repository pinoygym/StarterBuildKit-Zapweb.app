import { prisma } from '../lib/prisma';

async function listTypes() {
    const types = await prisma.stockMovement.findMany({
        distinct: ['type'],
        select: { type: true }
    });
    console.log(types.map(t => t.type));
}

listTypes().finally(() => prisma.$disconnect());
