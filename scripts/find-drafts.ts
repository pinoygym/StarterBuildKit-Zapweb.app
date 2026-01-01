
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    const drafts = await prisma.inventoryAdjustment.findMany({
        where: { status: 'DRAFT' },
        select: { id: true, adjustmentNumber: true, reason: true }
    });

    const recentlyPosted = await prisma.inventoryAdjustment.findMany({
        where: { status: 'POSTED' },
        orderBy: { updatedAt: 'desc' },
        take: 5,
        include: {
            items: {
                include: {
                    Product: {
                        select: { name: true, baseUOM: true }
                    }
                }
            }
        }
    });

    console.log('--- DRAFTS ---');
    console.log(JSON.stringify(drafts, null, 2));
    console.log('--- RECENTLY POSTED ---');
    console.log(JSON.stringify(recentlyPosted, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
