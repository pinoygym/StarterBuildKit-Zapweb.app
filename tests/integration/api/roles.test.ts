import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { prisma } from '@/lib/prisma';

const BASE_URL = process.env.BASE_URL || 'http://127.0.0.1:3001';

describe('Roles API', () => {
    let authToken: string;
    let testRoleId: string;
    const testRoleName = `Integration Test Role ${Date.now()}`;

    beforeAll(async () => {
        // Login to get auth token
        const response = await fetch(`${BASE_URL}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'cybergada@gmail.com',
                password: 'Qweasd145698@',
            }),
        });
        const data = await response.json();
        console.log('Login response:', data);
        if (!data.success || !data.token) {
            console.error('Login failed in beforeAll');
        }
        // Capture the cookie from the response headers
        const setCookie = response.headers.get('set-cookie');
        if (setCookie) {
            // Extract the auth-token part or use the whole string if fetch handles it
            // fetch requires "Cookie: name=value"
            // set-cookie might be "auth-token=...; Path=/; HttpOnly"
            // We can just use the whole set-cookie string as the Cookie header value often works in node-fetch/vitest
            // Or better, extract it.
            authToken = setCookie;
        } else {
            // Fallback to manual construction if header is missing (unlikely if login succeeded)
            authToken = `auth-token=${data.token}`;
        }
    });

    afterAll(async () => {
        // Cleanup
        if (testRoleId) {
            try {
                await prisma.rolePermission.deleteMany({ where: { roleId: testRoleId } });
                await prisma.role.delete({ where: { id: testRoleId } });
            } catch (e) {
                console.log('Cleanup failed (might already be deleted):', e);
            }
        }
        await prisma.$disconnect();
    });

    it('GET /api/roles - should return list of roles', async () => {
        const response = await fetch(`${BASE_URL}/api/roles`, {
            headers: { Cookie: authToken },
        });

        if (response.status !== 200) {
            const text = await response.text();
            console.log('GET /api/roles failed:', response.status, text);
        }
        expect(response.status).toBe(200);
        const data = await response.json();
        expect(data.success).toBe(true);
        expect(Array.isArray(data.roles)).toBe(true);
        expect(data.roles.length).toBeGreaterThan(0);
    });

    it('POST /api/roles - should create a new role', async () => {
        const newRole = {
            name: testRoleName,
            description: 'Test role created by integration test',
        };

        const response = await fetch(`${BASE_URL}/api/roles`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Cookie: authToken,
            },
            body: JSON.stringify(newRole),
        });

        if (response.status !== 201) {
            const text = await response.text();
            console.log('POST /api/roles failed:', response.status, text);
        }
        expect(response.status).toBe(201);
        const data = await response.json();
        expect(data.success).toBe(true);
        expect(data.role.name).toBe(testRoleName);
        testRoleId = data.role.id;
    });

    it('POST /api/roles - should fail with duplicate name', async () => {
        const duplicateRole = {
            name: testRoleName,
            description: 'Duplicate role',
        };

        const response = await fetch(`${BASE_URL}/api/roles`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Cookie: authToken,
            },
            body: JSON.stringify(duplicateRole),
        });

        expect(response.status).toBe(400);
        const data = await response.json();
        expect(data.success).toBe(false);
    });

    it('PUT /api/roles/[id] - should update role', async () => {
        const updateData = {
            description: 'Updated description',
        };

        const response = await fetch(`${BASE_URL}/api/roles/${testRoleId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                Cookie: authToken,
            },
            body: JSON.stringify(updateData),
        });

        if (response.status !== 200) {
            const text = await response.text();
            console.log('PUT /api/roles failed:', response.status, text);
        }
        expect(response.status).toBe(200);
        const data = await response.json();
        expect(data.success).toBe(true);
        expect(data.role.description).toBe('Updated description');
    });

    it('DELETE /api/roles/[id] - should delete role', async () => {
        console.log('Deleting role:', testRoleId);
        const response = await fetch(`${BASE_URL}/api/roles/${testRoleId}`, {
            method: 'DELETE',
            headers: { Cookie: authToken },
        });

        if (response.status !== 200) {
            const text = await response.text();
            console.log('DELETE /api/roles failed:', response.status, text);
        }
        expect(response.status).toBe(200);
        const data = await response.json();
        expect(data.success).toBe(true);

        // Verify deletion
        const verifyResponse = await fetch(`${BASE_URL}/api/roles/${testRoleId}`, {
            headers: { Cookie: authToken },
        });
        if (verifyResponse.status === 200) {
            console.log('Verify deletion failed - role still exists');
        }
        // Depending on implementation, might return 404 or success: false
        expect([404, 400]).toContain(verifyResponse.status);
    });
});
