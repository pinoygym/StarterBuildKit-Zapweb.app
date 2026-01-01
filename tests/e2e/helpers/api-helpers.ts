import { prisma } from '../../../lib/prisma';
import * as crypto from 'crypto';

/**
 * Creates a test user directly in the database.
 * Useful for setting up preconditions without using the UI.
 */
export async function createTestUserInDb(user: {
    email: string;
    firstName: string;
    lastName: string;
    passwordHash?: string;
    roleName?: 'Cashier' | 'Super Admin' | 'Sales Agent';
}) {
    let role = await prisma.role.findFirst({ where: { name: user.roleName || 'Cashier' } });
    if (!role) {
        // Fallback to whatever is available if specified role missing
        role = await prisma.role.findFirst();
    }
    if (!role) throw new Error('No roles found in database');

    const defaultPasswordHash = '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYIeWEHaSVK'; // TestPassword123!

    return await prisma.user.create({
        data: {
            id: crypto.randomUUID(),
            email: user.email,
            passwordHash: user.passwordHash || defaultPasswordHash,
            firstName: user.firstName,
            lastName: user.lastName,
            roleId: role.id,
            status: 'ACTIVE',
            emailVerified: false,
            updatedAt: new Date()
        }
    });
}

/**
 * Clean up test users created during E2E tests.
 */
export async function cleanupTestUsers(emailPrefix: string = 'e2e_test_') {
    const users = await prisma.user.findMany({
        where: {
            email: {
                startsWith: emailPrefix
            }
        },
        select: { id: true }
    });

    if (users.length > 0) {
        const userIds = users.map(u => u.id);
        // Delete sessions first to avoid foreign key constraints
        await prisma.session.deleteMany({
            where: { userId: { in: userIds } }
        });

        await prisma.user.deleteMany({
            where: { id: { in: userIds } }
        });
    }
}
