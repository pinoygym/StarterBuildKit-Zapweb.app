import dotenv from 'dotenv';
dotenv.config();
import { prisma } from './lib/prisma';
import { randomUUID } from 'crypto';

async function main() {
    try {
        await prisma.user.create({
            data: {
                id: randomUUID(),
                email: `test-${randomUUID()}@example.com`,
                passwordHash: 'hash',
                firstName: 'Test',
                lastName: 'User',
                updatedAt: new Date(),
                Role: { connect: { id: 'invalid-role-id' } },
                status: 'ACTIVE',
                emailVerified: false,
            },
        });
    } catch (error: any) {
        console.log('Error Code:', error.code);
        console.log('Error Message:', error.message);
        console.log('Full Error:', JSON.stringify(error, null, 2));
    } finally {
        await prisma.$disconnect();
    }
}

main();
