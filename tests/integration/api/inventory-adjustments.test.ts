
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { prisma } from '@/lib/prisma';
import { randomUUID } from 'crypto';

const BASE_URL = process.env.BASE_URL || 'http://127.0.0.1:3000';

describe('Inventory Adjustments API Routes', () => {
    let authToken: string;
    let testWarehouseId: string;
    let testBranchId: string;
    let testAdjustmentId: string;

    beforeAll(async () => {
        // Get or create test branch
        let branch = await prisma.branch.findFirst();
        if (!branch) {
            branch = await prisma.branch.create({
                data: {
                    id: randomUUID(),
                    name: 'Test Branch Adj API',
                    code: 'TBADJ01',
                    location: 'Test Location',
                    manager: 'Test Manager',
                    phone: '123-456-7890',
                    updatedAt: new Date(),
                },
            });
        }
        testBranchId = branch.id;

        // Create test warehouse
        const warehouse = await prisma.warehouse.create({
            data: {
                id: randomUUID(),
                name: 'Test Warehouse Adj API',
                location: 'Test Location',
                manager: 'Test Manager',
                maxCapacity: 1000,
                branchId: testBranchId,
                updatedAt: new Date(),
            },
        });
        testWarehouseId = warehouse.id;

        // Login
        const loginResponse = await fetch(`${BASE_URL}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'cybergada@gmail.com',
                password: 'Qweasd145698@',
            }),
        });

        if (loginResponse.ok) {
            const cookies = loginResponse.headers.get('set-cookie');
            if (cookies) {
                const tokenMatch = cookies.match(/auth-token=([^;]+)/);
                if (tokenMatch) {
                    authToken = tokenMatch[1];
                }
            }
        }
    });

    afterAll(async () => {
        if (testAdjustmentId) {
            await prisma.inventoryAdjustment.delete({ where: { id: testAdjustmentId } }).catch(() => { });
        }
        await prisma.warehouse.delete({ where: { id: testWarehouseId } }).catch(() => { });
    });

    describe('GET /api/inventory-adjustments', () => {
        it('should return 401 without auth token', async () => {
            const response = await fetch(`${BASE_URL}/api/inventory-adjustments`);
            expect(response.status).toBe(401);
        });

        it('should return list of adjustments with auth', async () => {
            const response = await fetch(`${BASE_URL}/api/inventory-adjustments`, {
                headers: {
                    Cookie: `auth-token=${authToken}`,
                },
            });

            const data = await response.json();
            if (response.status !== 200) {
                console.log('FULL_API_ERROR:', JSON.stringify(data, null, 2));
                throw new Error(`API Failed: ${data.error}`);
            }
            expect(response.status).toBe(200);
            expect(data.success).toBe(true);
            expect(Array.isArray(data.data)).toBe(true);
        });
    });
});

