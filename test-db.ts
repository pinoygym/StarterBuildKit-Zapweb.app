import { prisma } from './lib/prisma';

async function main() {
    try {
        console.log('Connecting to database using lib/prisma...');
        const result = await prisma.$queryRaw`SELECT 1`;
        console.log('Database connection successful:', result);

        console.log('Querying first 5 adjustments...');
        const adjustments = await prisma.inventoryAdjustment.findMany({ take: 5 });
        console.log('Adjustments found:', adjustments.length);
    } catch (error) {
        console.error('Database error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
