const { PrismaClient } = require('@prisma/client');
require('dotenv/config');

const prisma = new PrismaClient({
    datasourceUrl: process.env.DATABASE_URL,
});

async function main() {
    try {
        console.log('Connecting to database...');
        console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'DEFINED' : 'UNDEFINED');
        await prisma.$connect();
        console.log('Connected!');

        console.log('Fetching users...');
        const users = await prisma.user.findMany({ take: 1 });
        console.log('Users found:', users.length);
        if (users.length > 0) {
            console.log('First user email:', users[0].email);
        }
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
