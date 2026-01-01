import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const cutoffDate = new Date('2025-11-22T00:00:00.000Z');
    console.log(`Listing products created before ${cutoffDate.toISOString()}...`);

    const products = await prisma.product.findMany({
        where: {
            createdAt: {
                lt: cutoffDate,
            },
        },
        select: {
            id: true,
            name: true,
            createdAt: true,
            category: true,
        },
    });

    console.log(`Found ${products.length} products:`);
    if (products.length > 0) {
        console.table(products);
    } else {
        console.log('No products found matching the criteria.');
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
