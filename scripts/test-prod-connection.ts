
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
    datasources: {
        db: {
            url: process.env.DATABASE_URL
        }
    }
});

async function main() {
    console.log('Testing connection to: ' + process.env.DATABASE_URL?.split('@')[1]);
    try {
        const start = Date.now();
        const count = await prisma.user.count();
        const duration = Date.now() - start;
        console.log(`Successfully connected! User count: ${count}`);
        console.log(`Query took ${duration}ms`);
    } catch (error) {
        console.error('Connection failed:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
