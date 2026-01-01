import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { prisma } from '@/lib/prisma';
import { createAndLoginUser, createTestWarehouse, createTestBranch, createTestProduct } from '../../helpers/test-db-utils';

const BASE_URL = 'http://localhost:3000';

describe('Large Scale Inventory Adjustment API', () => {
    let testUser: any;
    let testWarehouse: any;
    let testBranch: any;
    let testProducts: any[] = [];
    let testAdjustmentId: string;
    let headers: HeadersInit;
    let userCleanup: () => Promise<void>;

    beforeAll(async () => {
        // 1. Setup Auth & Basic Entities
        const authData = await createAndLoginUser(BASE_URL);
        testUser = authData.testUser;
        headers = {
            ...authData.headers,
            'Cookie': `auth-token=${authData.token}`, // Middleware prefers cookie
        };
        userCleanup = authData.cleanup;

        testBranch = await createTestBranch();
        testWarehouse = await createTestWarehouse(testBranch.id);

        // 2. Create 100 Products using a transaction or parallel promises for speed
        const productPromises = [];
        for (let i = 0; i < 100; i++) {
            productPromises.push(createTestProduct({
                name: `Load Test Product ${i} - ${Date.now()}`,
                baseUOM: 'PCS'
            }));
        }
        testProducts = await Promise.all(productPromises);
        console.log(`Created ${testProducts.length} test products.`);
    }, 120000); // Increased timeout for setup

    afterAll(async () => {
        console.log('Cleaning up...');
        if (testAdjustmentId) {
            await prisma.inventoryAdjustment.delete({ where: { id: testAdjustmentId } }).catch(() => { });
        }

        await prisma.product.deleteMany({
            where: {
                id: { in: testProducts.map(p => p.id) }
            }
        });

        if (testWarehouse) await prisma.warehouse.delete({ where: { id: testWarehouse.id } });
        if (testBranch) await prisma.branch.delete({ where: { id: testBranch.id } });
        // userCleanup handles user deletion
        if (userCleanup) await userCleanup();
    });

    it('should successfully create and retrieve an adjustment with 100 items', async () => {
        // Prepare 100 items
        const adjustmentItems = testProducts.map((p, index) => ({
            productId: p.id,
            quantity: index + 1, // varied quantity
            uom: 'PCS',
            type: 'RELATIVE',
            systemQuantity: 0,
            actualQuantity: index + 1
        }));

        const payload = {
            warehouseId: testWarehouse.id,
            branchId: testBranch.id,
            reason: 'Load Testing 100 Items',
            adjustmentDate: new Date(),
            items: adjustmentItems
        };

        // 1. Create Adjustment
        const startTime = Date.now();
        const createRes = await fetch(`${BASE_URL}/api/inventory-adjustments`, {
            method: 'POST',
            headers,
            body: JSON.stringify(payload),
        });
        const duration = Date.now() - startTime;
        console.log(`Creation took ${duration}ms`);

        const createData = await createRes.json();

        if (!createRes.ok) {
            console.error('Create failed:', createData);
        }

        expect(createRes.status).toBe(201);
        expect(createData.success).toBe(true);
        testAdjustmentId = createData.data.id;

        // 2. Verify Response Item Count
        expect(createData.data.items).toHaveLength(100);

        // 3. Fetch Detail and Verify
        const getRes = await fetch(`${BASE_URL}/api/inventory-adjustments/${testAdjustmentId}`, {
            headers
        });
        const getData = await getRes.json();

        expect(getRes.status).toBe(200);
        expect(getData.data.items).toHaveLength(100);

        // Check first and last item
        const firstItem = getData.data.items.find((i: any) => i.productId === testProducts[0].id);
        const lastItem = getData.data.items.find((i: any) => i.productId === testProducts[99].id);

        expect(firstItem.quantity).toBe(1);
        expect(lastItem.quantity).toBe(100);

        console.log('Successfully verified 100 items.');
    }, 60000);
});
