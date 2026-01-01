import { PrismaClient } from '@prisma/client';
import 'dotenv/config';

const prisma = new PrismaClient({
    datasourceUrl: process.env.DATABASE_URL,
});

async function main() {
    try {
        console.log('Connecting to database...');
        await prisma.$connect();
        console.log('Connected!');

        console.log('Fetching users...');
        const users = await prisma.user.findMany({ take: 1 });
        console.log('Users found:', users.length);
        if (users.length > 0) {
            console.log('First user:', users[0]);
        }
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
