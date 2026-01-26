import { describe, it, expect, beforeAll } from 'vitest';
const BASE_URL = 'http://127.0.0.1:3000';
import { prisma } from '@/lib/prisma';

describe('Backup and Restore API Integration', () => {
    let authToken: string;

    beforeAll(async () => {
        console.log('--- INTEGRATION TEST SETUP START ---');

        // 1. Seed the database to ensure admin user exists
        await fetch(`${BASE_URL}/api/dev/seed`, { method: 'POST' });

        // 2. Login as admin
        const loginResponse = await fetch(`${BASE_URL}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'cybergada@gmail.com',
                password: 'Qweasd1234',
            }),
        });

        if (!loginResponse.ok) throw new Error('Login failed');

        const cookies = loginResponse.headers.get('set-cookie');
        if (cookies) {
            const tokenMatch = cookies.match(/auth-token=([^;]+)/);
            if (tokenMatch) authToken = tokenMatch[1];
        }
    });

    it('should create a backup successfully', async () => {
        const response = await fetch(`${BASE_URL}/api/settings/database/backup`, {
            headers: { Cookie: `auth-token=${authToken}` },
        });

        expect(response.status).toBe(200);
        const data = await response.json();
        expect(data.version).toBe('2.0');
    });

    it('should restore from a v1.1 backup (automatic normalization)', async () => {
        const v1Backup = {
            version: '1.1',
            timestamp: new Date().toISOString(),
            data: {
                branches: [
                    {
                        id: 'v1-branch-test-int',
                        name: 'V1 Int Test Branch',
                        code: 'V1ITB',
                        location: 'V1 Location',
                        manager: 'V1 Manager',
                        phone: '123',
                        status: 'active',
                        updatedAt: new Date().toISOString()
                    }
                ],
                companySettings: [
                    {
                        id: 'v1-settings-int',
                        companyName: 'V1 Int Test Company',
                        address: 'V1 Address',
                        updatedAt: new Date().toISOString()
                    }
                ]
            }
        };

        const response = await fetch(`${BASE_URL}/api/settings/database/restore`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Cookie: `auth-token=${authToken}`
            },
            body: JSON.stringify(v1Backup),
        });

        const data = await response.json();
        expect(response.status).toBe(200);
        expect(data.success).toBe(true);

        // Verify restoration via API (to ensure we're checking the same DB as the server)
        const verifyResponse = await fetch(`${BASE_URL}/api/branches`, {
            headers: { Cookie: `auth-token=${authToken}` },
        });
        expect(verifyResponse.status).toBe(200);
        const verifyData = await verifyResponse.json();

        // Next.js API results are often wrapped in { success: true, data: [...] }
        const branches = Array.isArray(verifyData) ? verifyData : (verifyData.data || []);
        const branch = branches.find((b: any) => b.name === 'V1 Int Test Branch');

        expect(branch).toBeDefined();
        expect(branch.name).toBe('V1 Int Test Branch');
    });
});
