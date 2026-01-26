
import { prisma } from '../lib/prisma';

async function main() {
    const adjs = await prisma.inventoryAdjustment.findMany({
        select: {
            adjustmentNumber: true,
            status: true,
            createdAt: true
        },
        orderBy: {
            createdAt: 'desc'
        },
        take: 20
    });
    console.log(JSON.stringify(adjs, null, 2));
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
