import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const cutoffDate = new Date('2025-11-22T00:00:00.000Z');
    console.log(`Deleting products created before ${cutoffDate.toISOString()}...`);

    const result = await prisma.product.deleteMany({
        where: {
            createdAt: {
                lt: cutoffDate,
            },
        },
    });

    console.log(`Deleted ${result.count} products.`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
