
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { prisma } from '@/lib/prisma';
import { randomUUID } from 'crypto';

const BASE_URL = process.env.BASE_URL || 'http://127.0.0.1:3000';

describe('Inventory Adjustment Negative Post API', () => {
    let authToken: string;
    let testWarehouseId: string;
    let testBranchId: string;
    let testProductId: string;
    let testAdjustmentId: string;

    beforeAll(async () => {
        // Login
        const loginResponse = await fetch(`${BASE_URL}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'cybergada@gmail.com',
                password: 'Qweasd1234',
            }),
        });

        if (loginResponse.ok) {
            const cookies = loginResponse.headers.get('set-cookie');
            if (cookies) {
                const tokenMatch = cookies.match(/auth-token=([^;]+)/);
                if (tokenMatch) authToken = tokenMatch[1];
            }
        }

        // Get or create test branch
        let branch = await prisma.branch.findFirst();
        if (!branch) {
            branch = await prisma.branch.create({
                data: {
                    id: randomUUID(),
                    name: 'Test Branch Neg',
                    code: 'TBNEG',
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
                name: 'Test Warehouse Neg',
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
                name: `Test Product Neg ${randomUUID()}`,
                category: 'Test Category',
                baseUOM: 'PCS',
                basePrice: 100,
                minStockLevel: 10,
                shelfLifeDays: 365,
                productCategoryId: (await prisma.productCategory.findFirst())?.id || null,
                updatedAt: new Date(),
            }
        });
        testProductId = product.id;

        // Initialize stock so we can reduce it
        await prisma.inventory.create({
            data: {
                productId: testProductId,
                warehouseId: testWarehouseId,
                quantity: 50, // Start with 50
            }
        });
    });

    afterAll(async () => {
        if (testAdjustmentId) {
            await prisma.inventoryAdjustment.delete({ where: { id: testAdjustmentId } }).catch(() => { });
        }
        if (testProductId && testWarehouseId) {
            await prisma.inventory.deleteMany({
                where: {
                    OR: [
                        { productId: testProductId },
                        { warehouseId: testWarehouseId }
                    ]
                }
            }).catch(() => { });
        }
        if (testProductId) {
            await prisma.product.delete({ where: { id: testProductId } }).catch(() => { });
        }
        await prisma.warehouse.delete({ where: { id: testWarehouseId } }).catch(() => { });
    });

    it('should allow negative adjustment (stock reduction)', async () => {
        // 1. Create Draft Adjustment with NEGATIVE quantity
        const createRes = await fetch(`${BASE_URL}/api/inventory-adjustments`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Cookie: `auth-token=${authToken}`,
            },
            body: JSON.stringify({
                warehouseId: testWarehouseId,
                branchId: testBranchId,
                reason: 'Test Negative Adjustment',
                adjustmentDate: new Date().toISOString(),
                items: [
                    {
                        productId: testProductId,
                        quantity: -10, // Reducing by 10
                        uom: 'PCS',
                        type: 'RELATIVE',
                        systemQuantity: 50,
                        actualQuantity: 40
                    }
                ]
            })
        });

        const createData = await createRes.json();
        expect([200, 201]).toContain(createRes.status);
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
            console.error('Post Negative Failed:', postData);
        }
        expect(postRes.status).toBe(200);
        expect(postData.success).toBe(true);
        expect(postData.data.status).toBe('POSTED');

        // 3. Verify stock
        const inventory = await prisma.inventory.findUnique({
            where: { productId_warehouseId: { productId: testProductId, warehouseId: testWarehouseId } }
        });
        expect(Number(inventory?.quantity)).toBe(40);
    });
});

