
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Connecting to DB...');
    try {
        const userCount = await prisma.user.count();
        console.log(`User Count: ${userCount}`);

        // Check if Product model exists before counting (handling potential schema mismatch)
        // But since this is checking the same codebase's generated client, we assume Product exists.
        const productCount = await prisma.product.count();
        console.log(`Product Count: ${productCount}`);

    } catch (error) {
        console.error('Error querying database:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
