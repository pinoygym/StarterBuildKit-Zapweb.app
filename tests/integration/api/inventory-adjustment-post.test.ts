
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { prisma } from '@/lib/prisma';
import { randomUUID } from 'crypto';

const BASE_URL = process.env.BASE_URL || 'http://127.0.0.1:3000';

describe('Inventory Adjustment Post API', () => {
    let authToken: string;
    let testWarehouseId: string;
    let testBranchId: string;
    let testProductId: string;
    let testAdjustmentId: string;
    let testUserId: string;

    beforeAll(async () => {
        // Login to get token and user ID
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
            // Get user ID from me endpoint or DB?
            // For now, let's query the user from DB based on email
            const user = await prisma.user.findUnique({ where: { email: 'cybergada@gmail.com' } });
            if (user) testUserId = user.id;
        }

        // Get or create test branch
        let branch = await prisma.branch.findFirst();
        if (!branch) {
            branch = await prisma.branch.create({
                data: {
                    id: randomUUID(),
                    name: 'Test Branch Post',
                    code: 'TBPOST',
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
                name: 'Test Warehouse Post',
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
                name: `Test Product Post ${randomUUID()}`,

                baseUOM: 'PCS',
                category: 'Test Category',
                basePrice: 100,
                minStockLevel: 10,
                shelfLifeDays: 365,
                productCategoryId: (await prisma.productCategory.findFirst())?.id || null, // Attempt to find a category
                updatedAt: new Date(),
            }
        });
        testProductId = product.id;
    });

    afterAll(async () => {
        if (testAdjustmentId) {
            // Clean up items first usually? cascade delete might handle it
            await prisma.inventoryAdjustment.delete({ where: { id: testAdjustmentId } }).catch(() => { });
        }
        if (testProductId) {
            await prisma.product.delete({ where: { id: testProductId } }).catch(() => { });
        }
        await prisma.warehouse.delete({ where: { id: testWarehouseId } }).catch(() => { });
    });

    it('should create and then successfully POST an adjustment', async () => {
        // 1. Create Draft Adjustment
        const createRes = await fetch(`${BASE_URL}/api/inventory-adjustments`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Cookie: `auth-token=${authToken}`,
            },
            body: JSON.stringify({
                warehouseId: testWarehouseId,
                branchId: testBranchId,
                reason: 'Test Post Adjustment',
                adjustmentDate: new Date().toISOString(),
                items: [
                    {
                        productId: testProductId,
                        quantity: 10,
                        uom: 'PCS',
                        type: 'RELATIVE', // Adding 10 PCS
                        systemQuantity: 0,
                        actualQuantity: 10
                    }
                ]
            })
        });

        const createData = await createRes.json();
        if (!createRes.ok) {
            console.error('Create Adjustment Failed:', createData);
        }
        expect([200, 201]).toContain(createRes.status);
        expect(createData.success).toBe(true);
        testAdjustmentId = createData.data.id;

        // 2. Post the Adjustment
        const postRes = await fetch(`${BASE_URL}/api/inventory-adjustments/${testAdjustmentId}/post`, {
            method: 'POST',
            headers: {
                Cookie: `auth-token=${authToken}`,
            }
        });

        const postData = await postRes.json();
        if (!postRes.ok) {
            console.error('Post Adjustment Failed:', postData);
        }
        expect(postRes.status).toBe(200);
        expect(postData.success).toBe(true);
        expect(postData.data.status).toBe('POSTED');
    });
});

