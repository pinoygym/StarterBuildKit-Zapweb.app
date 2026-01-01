import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { prisma } from '@/lib/prisma';
import { randomUUID } from 'crypto';

const BASE_URL = process.env.BASE_URL || 'http://127.0.0.1:3001';

describe('Adjustments API Routes', () => {
    let authToken: string;
    let testWarehouseId: string;
    let testProductId: string;
    let testReferenceId: string;
    let testBranchId: string;

    beforeAll(async () => {
        // Get or create test branch
        let branch = await prisma.branch.findFirst();
        if (!branch) {
            branch = await prisma.branch.create({
                data: {
                    id: randomUUID(),
                    name: 'Test Branch',
                    code: 'TB001',
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
                name: 'Test Warehouse API',
                location: 'Test Location',
                manager: 'Test Manager',
                maxCapacity: 1000,
                branchId: testBranchId,
                updatedAt: new Date(),
            },
        });
        testWarehouseId = warehouse.id;

        // Create test product
        const product = await prisma.product.create({
            data: {
                id: randomUUID(),
                name: 'Test Product API',
                category: 'Test Category',
                basePrice: 100,
                baseUOM: 'PC',
                minStockLevel: 10,
                shelfLifeDays: 30,
                updatedAt: new Date(),
            },
        });
        testProductId = product.id;

        testReferenceId = `TEST-${randomUUID()}`;

        // Create test adjustment
        await prisma.stockMovement.createMany({
            data: [
                {
                    id: randomUUID(),
                    productId: testProductId,
                    warehouseId: testWarehouseId,
                    type: 'ADJUSTMENT',
                    referenceType: 'ADJUSTMENT',
                    referenceId: testReferenceId,
                    quantity: 10,
                    reason: 'Test API adjustment',
                },
                {
                    id: randomUUID(),
                    productId: testProductId,
                    warehouseId: testWarehouseId,
                    type: 'ADJUSTMENT',
                    referenceType: 'ADJUSTMENT',
                    referenceId: testReferenceId,
                    quantity: 5,
                    reason: 'Test API adjustment',
                },
            ],
        });

        // Get auth token (assuming you have a test user)
        // This is a placeholder - adjust based on your auth setup
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
        // Clean up test data
        await prisma.stockMovement.deleteMany({
            where: { referenceId: testReferenceId },
        });
        await prisma.product.delete({ where: { id: testProductId } });
        await prisma.warehouse.delete({ where: { id: testWarehouseId } });
    });

    describe('GET /api/inventory/adjustments', () => {
        it('should return 401 without auth token', async () => {
            const response = await fetch(`${BASE_URL}/api/inventory/adjustments`);
            expect(response.status).toBe(401);
        });

        it('should return list of adjustments with auth', async () => {
            const response = await fetch(`${BASE_URL}/api/inventory/adjustments`, {
                headers: {
                    Cookie: `auth-token=${authToken}`,
                },
            });

            expect(response.status).toBe(200);
            const data = await response.json();
            expect(data.success).toBe(true);
            expect(Array.isArray(data.data)).toBe(true);
        });

        it('should filter by warehouseId', async () => {
            const response = await fetch(
                `${BASE_URL}/api/inventory/adjustments?warehouseId=${testWarehouseId}`,
                {
                    headers: {
                        Cookie: `auth-token=${authToken}`,
                    },
                }
            );

            expect(response.status).toBe(200);
            const data = await response.json();
            expect(data.success).toBe(true);

            if (data.data.length > 0) {
                data.data.forEach((adjustment: any) => {
                    expect(adjustment.warehouseId).toBe(testWarehouseId);
                });
            }
        });

        it('should filter by search query', async () => {
            const response = await fetch(
                `${BASE_URL}/api/inventory/adjustments?search=${testReferenceId}`,
                {
                    headers: {
                        Cookie: `auth-token=${authToken}`,
                    },
                }
            );

            expect(response.status).toBe(200);
            const data = await response.json();
            expect(data.success).toBe(true);

            if (data.data.length > 0) {
                const adjustment = data.data.find((a: any) => a.referenceNumber === testReferenceId);
                expect(adjustment).toBeDefined();
            }
        });
    });

    describe('GET /api/inventory/adjustments/[id]', () => {
        it('should return 401 without auth token', async () => {
            const response = await fetch(
                `${BASE_URL}/api/inventory/adjustments/${testReferenceId}`
            );
            expect(response.status).toBe(401);
        });

        it('should return 404 for non-existent adjustment', async () => {
            const response = await fetch(
                `${BASE_URL}/api/inventory/adjustments/nonexistent`,
                {
                    headers: {
                        Cookie: `auth-token=${authToken}`,
                    },
                }
            );

            expect(response.status).toBe(404);
            const data = await response.json();
            expect(data.success).toBe(false);
        });

        it('should return adjustment details with auth', async () => {
            const response = await fetch(
                `${BASE_URL}/api/inventory/adjustments/${testReferenceId}`,
                {
                    headers: {
                        Cookie: `auth-token=${authToken}`,
                    },
                }
            );

            expect(response.status).toBe(200);
            const data = await response.json();
            expect(data.success).toBe(true);
            expect(data.data.referenceId).toBe(testReferenceId);
            expect(data.data.totalItems).toBe(2);
            expect(data.data.items).toHaveLength(2);
            expect(data.data.warehouseId).toBe(testWarehouseId);
        });

        it('should include product and warehouse details', async () => {
            const response = await fetch(
                `${BASE_URL}/api/inventory/adjustments/${testReferenceId}`,
                {
                    headers: {
                        Cookie: `auth-token=${authToken}`,
                    },
                }
            );

            expect(response.status).toBe(200);
            const data = await response.json();
            expect(data.data.warehouseName).toBe('Test Warehouse API');
            expect(data.data.items[0].productName).toBe('Test Product API');
            expect(data.data.items[0].baseUOM).toBe('PC');
        });
    });
});
