import { prisma } from '../lib/prisma';

async function listDraftAdjustments() {
    const drafts = await prisma.inventoryAdjustment.findMany({
        where: { status: 'DRAFT' },
        include: {
            items: true
        }
    });

    console.log(`Found ${drafts.length} draft adjustments.`);
    drafts.forEach(d => {
        console.log(`- ${d.adjustmentNumber} (ID: ${d.id}) - ${d.items.length} items`);
    });
}

listDraftAdjustments()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
