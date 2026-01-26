
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log("Searching for adjustment ADJ-20251230-0003...");
    const adjustment = await prisma.inventoryAdjustment.findFirst({
        where: {
            adjustmentNumber: 'ADJ-20251230-0003',
        },
        include: {
            Branch: true,
            Warehouse: true,
            items: {
                include: {
                    Product: true,
                },
            },
        },
    });

    if (!adjustment) {
        console.log('Adjustment ADJ-20251230-0003 not found');
        return;
    }

    console.log('Adjustment Details:');
    console.log('Values:', {
        id: adjustment.id,
        number: adjustment.adjustmentNumber,
        date: adjustment.adjustmentDate,
        reason: adjustment.reason,
        status: adjustment.status,
        warehouse: adjustment.Warehouse.name,
        branch: adjustment.Branch.name,
    });

    console.log('Items:');
    adjustment.items.forEach(item => {
        console.log(`- Product: ${item.Product.name}, Qty: ${item.quantity}, UOM: ${item.uom}, Type: ${item.type}`);
    });
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
