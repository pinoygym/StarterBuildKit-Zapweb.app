import { prisma } from '../lib/prisma';

async function run() {
    try {
        const count = await prisma.inventoryAdjustment.count({
            where: {
                status: 'DRAFT'
            }
        });
        console.log('DRAFT_COUNT:' + count);
    } catch (error) {
        console.error(error);
    } finally {
        await prisma.$disconnect();
    }
}

run();
