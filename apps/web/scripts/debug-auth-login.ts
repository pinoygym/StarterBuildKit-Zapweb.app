import { prisma } from '../lib/prisma';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';

async function debugLogin() {
    const email = `debug-${Date.now()}@example.com`;
    const password = 'Password123!';
    const hashedPassword = await bcrypt.hash(password, 10);

    console.log('--- Debug Login Script ---');

    // 1. Get a role
    const role = await prisma.role.findFirst({ where: { name: 'Super Admin' } }) || await prisma.role.findFirst();
    if (!role) {
        console.error('No roles found in DB!');
        return;
    }
    console.log(`Using role: ${role.name} (${role.id})`);

    // 2. Create a user
    const user = await prisma.user.create({
        data: {
            id: randomUUID(),
            email,
            firstName: 'Debug',
            lastName: 'User',
            passwordHash: hashedPassword,
            roleId: role.id,
            status: 'ACTIVE',
            emailVerified: true,
            updatedAt: new Date(),
        }
    });
    console.log(`Created test user: ${email}`);

    // 3. Attempt login via API
    const loginUrl = 'http://localhost:3000/api/auth/login';
    console.log(`Attempting login at ${loginUrl}...`);

    try {
        const response = await fetch(loginUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        console.log(`Status: ${response.status}`);
        const body = await response.json();
        console.log('Response Body:', JSON.stringify(body, null, 2));

        if (response.status === 200) {
            console.log('SUCCESS: Login worked!');
        } else {
            console.log('FAILURE: Login failed.');
        }
    } catch (error) {
        console.error('Fetch error:', error);
    } finally {
        // 4. Cleanup
        await prisma.session.deleteMany({ where: { userId: user.id } });
        await prisma.user.delete({ where: { id: user.id } });
        console.log('Cleanup completed.');
    }
}

debugLogin();
