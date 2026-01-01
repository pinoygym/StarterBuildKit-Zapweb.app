import { prisma } from '../lib/prisma';

async function run() {
    try {
        const statuses = await prisma.inventoryAdjustment.groupBy({
            by: ['status'],
            _count: {
                _all: true
            }
        });
        console.log('STATUS_COUNTS:', JSON.stringify(statuses, null, 2));
    } catch (error) {
        console.error(error);
    } finally {
        await prisma.$disconnect();
    }
}

run();
