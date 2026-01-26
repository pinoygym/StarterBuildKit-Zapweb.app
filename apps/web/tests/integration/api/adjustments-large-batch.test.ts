import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { prisma } from '@/lib/prisma';
import { createAndLoginUser, createTestWarehouse, createTestBranch, createTestProduct } from '../../helpers/test-db-utils';

import { BASE_URL } from '../config';

describe('Fifty Items Inventory Adjustment Verification', () => {
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
            'Cookie': `auth-token=${authData.token}`,
        };
        userCleanup = authData.cleanup;

        testBranch = await createTestBranch();
        testWarehouse = await createTestWarehouse(testBranch.id);

        // 2. Create 50 Products
        // Using Promise.all for faster setup
        const productPromises = [];
        for (let i = 0; i < 50; i++) {
            productPromises.push(createTestProduct({
                name: `50-Adjust Product ${i} - ${Date.now()}`,
                baseUOM: 'PCS'
            }));
        }
        testProducts = await Promise.all(productPromises);
        console.log(`Created ${testProducts.length} test products.`);
    }, 120000); // 2 minute timeout for setup

    afterAll(async () => {
        console.log('Cleaning up...');
        if (testAdjustmentId) {
            await prisma.inventoryAdjustment.delete({ where: { id: testAdjustmentId } }).catch(() => { });
        }

        // Batch delete products
        if (testProducts.length > 0) {
            await prisma.product.deleteMany({
                where: {
                    id: { in: testProducts.map(p => p.id) }
                }
            });
        }

        if (testWarehouse) await prisma.warehouse.delete({ where: { id: testWarehouse.id } });
        if (testBranch) await prisma.branch.delete({ where: { id: testBranch.id } });
        if (userCleanup) await userCleanup();
    });

    it('should successfully create and retrieve an adjustment with exactly 50 items', async () => {
        // Prepare 50 items with incremental quantities
        const adjustmentItems = testProducts.map((p, index) => ({
            productId: p.id,
            quantity: index + 1,
            uom: 'PCS',
            type: 'RELATIVE',
            systemQuantity: 0,
            actualQuantity: index + 1
        }));

        const payload = {
            warehouseId: testWarehouse.id,
            branchId: testBranch.id,
            reason: 'User Request: 50 Items Adjustment Verification',
            adjustmentDate: new Date(),
            items: adjustmentItems
        };

        // 1. Create Adjustment
        console.log('Sending creating request...');
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

        // 2. Verify Response Item Count (Immediate check)
        expect(createData.data.items).toHaveLength(50);
        console.log(`Response confirmed ${createData.data.items.length} items returned immediately.`);

        // 3. Fetch Detail and Verify (The "Edited Adjustment Slip" Check)
        // This simulates opening the adjustment again to verify everything persisted to DB
        const getRes = await fetch(`${BASE_URL}/api/inventory-adjustments/${testAdjustmentId}`, {
            headers
        });
        const getData = await getRes.json();

        expect(getRes.status).toBe(200);
        expect(getData.data.items).toHaveLength(50);
        console.log(`Fetched details confirmed ${getData.data.items.length} items persisted.`);

        // Check specific items to ensure order/content integrity
        const firstItem = getData.data.items.find((i: any) => i.productId === testProducts[0].id);
        const middleItem = getData.data.items.find((i: any) => i.productId === testProducts[24].id);
        const lastItem = getData.data.items.find((i: any) => i.productId === testProducts[49].id);

        expect(firstItem.quantity).toBe(1);
        expect(middleItem.quantity).toBe(25);
        expect(lastItem.quantity).toBe(50);

        console.log('Successfully verified all 50 items appeared in the adjustment details.');
    }, 60000);
});

