
import { prisma } from './lib/prisma';

async function listAdjustments() {
    try {
        const adjustments = await prisma.inventoryAdjustment.findMany({
            take: 10,
            orderBy: { createdAt: 'desc' },
            include: {
                items: true
            }
        });

        console.log('Recent Adjustments:');
        adjustments.forEach(adj => {
            console.log(`ID: ${adj.id}`);
            console.log(`Number: ${adj.adjustmentNumber}`);
            console.log(`Status: ${adj.status}`);
            console.log(`Items count: ${adj.items.length}`);
            console.log('---');
        });
    } catch (error) {
        console.error(error);
    } finally {
        await prisma.$disconnect();
    }
}

listAdjustments();
