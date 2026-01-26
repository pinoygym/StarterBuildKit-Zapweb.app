const { authService } = require('./services/auth.service');
const { prisma } = require('./lib/prisma');

async function debug() {
    const email = `test-${Date.now()}@example.com`;
    const password = 'Password@123';

    console.log('--- Auth Debug ---');

    try {
        // 1. Check if we can reach the DB
        const userCount = await prisma.user.count();
        console.log('User count:', userCount);

        // 2. Try to log in as the seeded admin
        console.log('Attempting login as cybergada@gmail.com...');
        const result = await authService.login({
            email: 'cybergada@gmail.com',
            password: 'Qweasd1234'
        });

        console.log('Login result:', JSON.stringify(result, null, 2));

    } catch (err) {
        console.error('Error:', err);
    } finally {
        await prisma.$disconnect();
    }
}

debug();
