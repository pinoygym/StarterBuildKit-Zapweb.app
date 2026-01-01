
import { prisma } from '../lib/prisma';

async function main() {
    const targetAdjs = [
        'ADJ-20251224-0001',
        'ADJ-20251224-0002',
        'ADJ-20251224-0003',
        'ADJ-20251224-0005',
        'ADJ-20251224-0006'
    ];

    const adjustments = await prisma.inventoryAdjustment.findMany({
        where: {
            adjustmentNumber: { in: targetAdjs }
        },
        include: {
            items: {
                include: {
                    Product: true
                },
                orderBy: {
                    Product: { name: 'asc' }
                }
            },
            Warehouse: true
        },
        orderBy: { adjustmentNumber: 'asc' }
    });

    for (const adj of adjustments) {
        console.log(`\n=== ${adj.adjustmentNumber} (${adj.Warehouse.name}) ===`);
        console.log(`Product | Quantity | UOM | Type`);
        console.log(`--- | --- | --- | ---`);
        for (const item of adj.items) {
            console.log(`${item.Product.name} | ${item.quantity} | ${item.uom} | ${item.type}`);
        }
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
