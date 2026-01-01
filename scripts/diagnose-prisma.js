require('dotenv/config');

console.log('Testing Prisma Client without datasourceUrl...');
try {
    const { PrismaClient } = require('@prisma/client');

    // In Prisma 7, the datasource URL should come from prisma.config.ts
    // We don't pass it to the constructor
    const prisma = new PrismaClient();

    console.log('Prisma instance created successfully');
    console.log('Testing connection...');

    prisma.$connect()
        .then(() => {
            console.log('Connected to database!');
            return prisma.user.count();
        })
        .then((count) => {
            console.log('User count:', count);
            return prisma.$disconnect();
        })
        .then(() => {
            console.log('Disconnected successfully');
            process.exit(0);
        })
        .catch((error) => {
            console.error('Error:', error);
            console.error('Error message:', error.message);
            process.exit(1);
        });
} catch (error) {
    console.error('Failed:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
}
