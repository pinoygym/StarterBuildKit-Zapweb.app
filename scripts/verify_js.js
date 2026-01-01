
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
    try {
        console.log('Connecting...');
        const users = await prisma.user.findMany();
        console.log('User count:', users.length);
        if (users.length > 0) {
            console.log('First user:', users[0].email);
        } else {
            console.log('No users found.');
        }

        const roles = await prisma.role.findMany();
        console.log('Role count:', roles.length);

    } catch (e) {
        console.error('Error:', e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
