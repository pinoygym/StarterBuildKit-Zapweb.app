
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { prisma } from '@/lib/prisma';
import { randomUUID } from 'crypto';
import { createTestUser, createTestBranch, createTestWarehouse, createTestProduct } from '@/tests/helpers/test-db-utils';

const BASE_URL = process.env.BASE_URL || 'http://127.0.0.1:3000';

describe('Batch Inventory Adjustment Verification (50 Items)', () => {
    // Increase timeout for this suite
    const TIMEOUT = 30000;

    let testUser: any;
    let testBranch: any;
    let testWarehouse: any;
    let testProducts: any[] = [];
    let token: string;
    let headers: any;

    beforeAll(async () => {
        try {
            console.log('Setup: Creating test user and environment...');
            testUser = await createTestUser();
            testBranch = await createTestBranch();
            testWarehouse = await createTestWarehouse(testBranch.id);

            // Create 50 products
            console.log('Creating 50 test products...');
            const productPromises = [];
            for (let i = 0; i < 50; i++) {
                productPromises.push(createTestProduct({
                    name: `Batch Product ${i} ${randomUUID().substring(0, 8)}`,
                    basePrice: 10 + i,
                }));
            }
            testProducts = await Promise.all(productPromises);
            console.log(`Created ${testProducts.length} products.`);

            // Login
            const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: testUser.email,
                    password: testUser.password,
                }),
            });

            if (!loginRes.ok) throw new Error('Login failed');

            const loginData = await loginRes.json();
            token = loginData.token;
            const cookie = loginRes.headers.get('set-cookie');

            headers = {
                'Content-Type': 'application/json',
                'Cookie': cookie || `auth-token=${token}`,
            };

        } catch (error) {
            console.error('Setup failed:', error);
            throw error;
        }
    });

    afterAll(async () => {
        console.log('Cleaning up...');
        // Clean up in order
        if (testWarehouse) {
            const adjustments = await prisma.inventoryAdjustment.findMany({
                where: { warehouseId: testWarehouse.id }
            });
            const adjIds = adjustments.map(a => a.id);
            if (adjIds.length > 0) {
                await prisma.inventoryAdjustmentItem.deleteMany({ where: { adjustmentId: { in: adjIds } } });
                await prisma.inventoryAdjustment.deleteMany({ where: { id: { in: adjIds } } });
            }
        }

        if (testProducts.length > 0) {
            const productIds = testProducts.map(p => p.id);
            await prisma.stockMovement.deleteMany({ where: { productId: { in: productIds } } });
            await prisma.inventory.deleteMany({ where: { productId: { in: productIds } } });
            await prisma.product.deleteMany({ where: { id: { in: productIds } } });
        }

        if (testWarehouse) await prisma.warehouse.delete({ where: { id: testWarehouse.id } });
        if (testBranch) await prisma.branch.delete({ where: { id: testBranch.id } });
        if (testUser) {
            await prisma.session.deleteMany({ where: { userId: testUser.id } });
            await prisma.user.delete({ where: { id: testUser.id } });
        }
        console.log('Cleanup complete.');
    });

    it('should create, save, and post an adjustment with 50 items', async () => {
        // 1. Prepare items

        const adjustmentItems = testProducts.map(product => ({
            productId: product.id,
            quantity: 10, // Add 10 of each
            uom: product.baseUOM,
            type: 'RELATIVE',
            systemQuantity: 0,
            actualQuantity: 10
        }));

        // 2. Create Draft Adjustment
        console.log('Creating draft adjustment with 50 items...');
        const createRes = await fetch(`${BASE_URL}/api/inventory-adjustments`, {
            method: 'POST',
            headers,
            body: JSON.stringify({
                warehouseId: testWarehouse.id,
                branchId: testBranch.id,
                reason: 'Batch Verification Local 50',
                items: adjustmentItems
            })
        });

        const createData = await createRes.json();
        if (!createRes.ok) console.error('Create failed:', createRes.status, createData);
        expect([200, 201]).toContain(createRes.status);
        expect(createData.success).toBe(true);
        expect(createData.data.items).toHaveLength(50);

        const adjustmentId = createData.data.id;
        console.log('Adjustment created:', adjustmentId);

        // 3. Post (Save & Post)
        console.log('Posting adjustment...');
        const postRes = await fetch(`${BASE_URL}/api/inventory-adjustments/${adjustmentId}/post`, {
            method: 'POST',
            headers
        });

        const postData = await postRes.json();
        console.log('Post Status:', postRes.status);
        console.log('Post Data Success:', postData.success);

        if (!postRes.ok || !postData.success) {
            console.error('Post Operation Failed:', JSON.stringify(postData, null, 2));
            const fs = require('fs');
            fs.writeFileSync('error.log', JSON.stringify({ status: postRes.status, body: postData }, null, 2));
        }

        expect([200, 201]).toContain(postRes.status);
        expect(postData.success).toBe(true);
        expect(postData.data.status).toBe('POSTED');

        // 4. Verify Stock Movements
        const movements = await prisma.stockMovement.findMany({
            where: {
                referenceId: adjustmentId,
                warehouseId: testWarehouse.id,
                type: 'ADJUSTMENT'
            }
        });

        // Easier: Check inventory for one or all
        const inventory = await prisma.inventory.count({
            where: {
                warehouseId: testWarehouse.id,
                quantity: 10
            }
        });
        expect(inventory).toBe(50);
        console.log(`Verified ${inventory} inventory records updated correctly.`);
    }, TIMEOUT);
});


