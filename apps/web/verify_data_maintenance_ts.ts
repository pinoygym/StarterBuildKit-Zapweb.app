
import { prisma } from './lib/prisma';
import { hash } from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

const timestamp = Date.now();
const email = `direct.verify.${timestamp}@example.com`;
const password = 'Password123!';
const BASE_URL = 'http://localhost:3000';

async function verify() {
    console.log('1. Creating verified user via Prisma:', email);

    // Create role if distinct (assuming 'USER' or similar exists, or fetch one)
    // Check typical roles
    let role = await prisma.role.findFirst({ where: { name: 'User' } });
    if (!role) {
        role = await prisma.role.findFirst(); // Fallback to any role
    }
    if (!role) {
        throw new Error('No roles found in DB');
    }

    const passwordHash = await hash(password, 12);

    const user = await prisma.user.create({
        data: {
            id: uuidv4(),
            email,
            passwordHash,
            firstName: 'Direct',
            lastName: 'Verify',
            emailVerified: true,
            status: 'ACTIVE',
            roleId: "a013b7cb-e60b-418f-b0e9-ee72439db2b0",
            updatedAt: new Date()
        }
    });

    console.log('User created:', user.id);

    console.log('2. Logging in...');
    const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
    });
    const loginData = await loginRes.json();
    if (!loginData.success) {
        console.error('Login failed:', loginData);
        process.exit(1);
    }
    const token = loginData.token;
    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };
    console.log('Login success, token acquired');

    console.log('3. GET product-categories...');
    const getRes = await fetch(`${BASE_URL}/api/data-maintenance/product-categories`, { headers });
    const getData = await getRes.json();

    if (getRes.status === 403) {
        console.error('GET Failed: 403 Forbidden. Permissions NOT relaxed.');
        process.exit(1);
    }
    if (!getData.success) {
        console.error('GET Failed:', getData);
        process.exit(1);
    }
    console.log('GET success, count:', getData.data.length);

    console.log('4. POST product-category...');
    const newCat = {
        name: `Direct Verify Cat ${timestamp}`,
        code: `DVC-${timestamp}`,
        status: 'active'
    };
    const postRes = await fetch(`${BASE_URL}/api/data-maintenance/product-categories`, {
        method: 'POST',
        headers,
        body: JSON.stringify(newCat)
    });
    const postData = await postRes.json();
    if (postRes.status === 403) {
        console.error('POST Failed: 403 Forbidden');
        process.exit(1);
    }
    if (!postData.success) {
        console.error('POST Failed:', postData);
        process.exit(1);
    }
    console.log('POST success, id:', postData.data.id);
    const id = postData.data.id;

    console.log('5. DELETE product-category...');
    const delRes = await fetch(`${BASE_URL}/api/data-maintenance/product-categories/${id}`, {
        method: 'DELETE',
        headers
    });
    const delData = await delRes.json();
    if (delRes.status === 403) {
        console.error('DELETE Failed: 403 Forbidden');
        process.exit(1);
    }
    if (!delData.success) {
        console.error('DELETE Failed:', delData);
        process.exit(1);
    }
    console.log('DELETE success');
    console.log('VERIFICATION COMPLETE: Non-admin can access Data Maintenance!');
}

verify()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
