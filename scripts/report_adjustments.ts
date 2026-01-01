
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Fetching recent Inventory Adjustments...');

    const adjustments = await prisma.inventoryAdjustment.findMany({
        take: 10,
        orderBy: { adjustmentDate: 'desc' },
        include: {
            items: {
                select: { productId: true, uom: true, quantity: true }
            }
        }
    });

    console.log('Recent Adjustments:');
    for (const adj of adjustments) {
        console.log(`- [${adj.adjustmentNumber}] ${adj.status} (${adj.items.length} items) - Date: ${adj.adjustmentDate.toISOString().split('T')[0]}`);
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
