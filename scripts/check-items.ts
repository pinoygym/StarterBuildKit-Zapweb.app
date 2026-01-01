import { prisma } from '../lib/prisma';

async function checkItems() {
    const items = await prisma.inventoryAdjustmentItem.findMany({
        where: { adjustmentId: '52505cea-fad1-4196-8f39-317f853681ec' }
    });
    items.forEach(i => console.log(`${i.productId} | Qty: ${i.quantity} | Type: ${i.type}`));
}

checkItems().finally(() => prisma.$disconnect());
