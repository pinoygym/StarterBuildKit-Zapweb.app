
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Checking for duplicates in InventoryAdjustmentItem (adjustmentId + productId)...');

    // Find duplicates
    const duplicates = await prisma.$queryRaw`
    SELECT "adjustmentId", "productId", COUNT(*)
    FROM "InventoryAdjustmentItem"
    GROUP BY "adjustmentId", "productId"
    HAVING COUNT(*) > 1
  `;

    if (!Array.isArray(duplicates) || duplicates.length === 0) {
        console.log('No duplicates found via GROUP BY.');
        return;
    }

    console.log(`Found ${duplicates.length} duplicate groups.`);

    let deletedCount = 0;
    for (const dup of duplicates) {
        const adjId = dup.adjustmentId;
        const prodId = dup.productId;

        // Get all ids for this group
        const items = await prisma.inventoryAdjustmentItem.findMany({
            where: { adjustmentId: adjId, productId: prodId },
            select: { id: true, createdAt: true },
            orderBy: { createdAt: 'desc' } // Keep newest? Or oldest? Let's keep newest.
        });

        // Keep the first one (newest), delete others
        const toDelete = items.slice(1).map(i => i.id);

        if (toDelete.length > 0) {
            await prisma.inventoryAdjustmentItem.deleteMany({
                where: { id: { in: toDelete } }
            });
            deletedCount += toDelete.length;
        }
    }

    console.log(`Deleted ${deletedCount} redundant duplicate records.`);
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
