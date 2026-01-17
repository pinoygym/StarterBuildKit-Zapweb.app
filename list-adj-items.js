
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const adjId = '2d206960-5128-4059-aa61-27a4f601043a';
    const adj = await prisma.inventoryAdjustment.findUnique({
        where: { id: adjId },
        include: {
            items: {
                include: {
                    Product: true
                }
            }
        }
    });

    if (!adj) {
        console.log('Adjustment not found');
        return;
    }

    console.log(`Adjustment: ${adj.adjustmentNumber}`);
    console.log('Items in this adjustment:');
    adj.items.forEach((item, index) => {
        console.log(`${index + 1}. Product: "${item.Product.name}" (ID: ${item.Product.id}) | Qty: ${item.quantity} ${item.uom}`);
    });
}

main().catch(console.error).finally(() => prisma.$disconnect());
