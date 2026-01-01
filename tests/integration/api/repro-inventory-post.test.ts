
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { prisma } from '@/lib/prisma';
import { randomUUID } from 'crypto';
import { createTestUser, createTestBranch, createTestWarehouse, createTestProduct } from '@/tests/helpers/test-db-utils';

const BASE_URL = process.env.BASE_URL || 'http://127.0.0.1:3000';

describe('Inventory Post 500 Error Reproduction', () => {
    let testUser: any;
    let testBranch: any;
    let testWarehouse: any;
    let testProduct: any;
    let token: string;
    let headers: any;

    beforeAll(async () => {
        try {
            console.log('Setup: Creating test user...');
            // Create test data first
            testUser = await createTestUser();
            testBranch = await createTestBranch();
            testWarehouse = await createTestWarehouse(testBranch.id);
            testProduct = await createTestProduct();
            console.log('Test data created. User:', testUser.email);

            console.log('Attempting to login to', BASE_URL);
            // Login with the created user
            const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: testUser.email,
                    password: testUser.password, // This is attached by createTestUser helper
                }),
            });

            console.log('Login response status:', loginRes.status);
            if (!loginRes.ok) {
                const text = await loginRes.text();
                console.error('Login failed response:', text);
                throw new Error('Failed to login for test setup');
            }

            const loginData = await loginRes.json();
            token = loginData.token;

            // Get cookie from response headers
            const cookie = loginRes.headers.get('set-cookie');
            console.log('Login cookie received:', cookie ? 'Yes' : 'No');

            headers = {
                'Content-Type': 'application/json',
                'Cookie': cookie || `auth-token=${token}`, // Fallback if set-cookie missing, try manual construction
            };
            console.log('Login successful');
        } catch (error) {
            console.error('Setup failed:', error);
            throw error;
        }
    });

    afterAll(async () => {
        // Cleanup
        // Delete adjustments first (foreign key dependency)
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

        if (testProduct) {
            await prisma.stockMovement.deleteMany({ where: { productId: testProduct.id } });
            await prisma.inventory.deleteMany({ where: { productId: testProduct.id } });
            await prisma.product.delete({ where: { id: testProduct.id } });
        }
        if (testWarehouse) await prisma.warehouse.delete({ where: { id: testWarehouse.id } });
        if (testBranch) await prisma.branch.delete({ where: { id: testBranch.id } });
        if (testUser) {
            await prisma.session.deleteMany({ where: { userId: testUser.id } });
            await prisma.user.delete({ where: { id: testUser.id } });
        }
    });

    it('should successfully post an inventory adjustment', async () => {
        // 1. Create Draft Adjustment
        const createRes = await fetch(`${BASE_URL}/api/inventory-adjustments`, {
            method: 'POST',
            headers,
            body: JSON.stringify({
                warehouseId: testWarehouse.id,
                branchId: testBranch.id,
                reason: 'Test Adjustment',
                items: [
                    {
                        productId: testProduct.id,
                        quantity: 10,
                        uom: testProduct.baseUOM,
                        type: 'RELATIVE',
                        systemQuantity: 0,
                        actualQuantity: 10
                    }
                ]
            })
        });

        const createData = await createRes.json();
        if (createRes.status !== 200 && createRes.status !== 201) {
            console.error('Create failed:', createRes.status, createData);
        }
        expect([200, 201]).toContain(createRes.status);
        expect(createData.success).toBe(true);
        const adjustmentId = createData.data.id;

        // 2. Post the Adjustment
        const postRes = await fetch(`${BASE_URL}/api/inventory-adjustments/${adjustmentId}/post`, {
            method: 'POST',
            headers
        });

        const postData = await postRes.json();

        if (postRes.status !== 200) {
            console.error('Post failed:', postData);
        }

        expect(postRes.status).toBe(200);
        expect(postData.success).toBe(true);
        expect(postData.data.status).toBe('POSTED');
    });

    it('should handle potential error triggers (e.g., missing alternate UOM)', async () => {
        // Trying to reproduce by using a UOM that doesn't exist
        const createRes = await fetch(`${BASE_URL}/api/inventory-adjustments`, {
            method: 'POST',
            headers,
            body: JSON.stringify({
                warehouseId: testWarehouse.id,
                branchId: testBranch.id,
                reason: 'Test Bad UOM',
                items: [
                    {
                        productId: testProduct.id,
                        quantity: 10,
                        uom: 'NON_EXISTENT_UOM', // This might trigger it if validation fails late
                        type: 'RELATIVE',
                        systemQuantity: 0,
                        actualQuantity: 10
                    }
                ]
            })
        });

        // If creation succeeds (it shouldn't if validation is good, but if it does...), try to post
        if (createRes.ok) {
            const createData = await createRes.json();
            const adjustmentId = createData.data.id;

            const postRes = await fetch(`${BASE_URL}/api/inventory-adjustments/${adjustmentId}/post`, {
                method: 'POST',
                headers
            });

            // We expect this to fail gracefully (400), not crash (500)
            if (postRes.status === 500) {
                console.log('REPRODUCED 500 ERROR');
            }
            expect(postRes.status).not.toBe(500);
        } else {
            // If creation failed, check that it wasn't a 500
            expect(createRes.status).not.toBe(500);
        }
    });

    it('should handle negative stock scenario if valid', async () => {
        // Trying to deduct more than available
        const createRes = await fetch(`${BASE_URL}/api/inventory-adjustments`, {
            method: 'POST',
            headers,
            body: JSON.stringify({
                warehouseId: testWarehouse.id,
                branchId: testBranch.id,
                reason: 'Test Negative Stock',
                items: [
                    {
                        productId: testProduct.id,
                        quantity: -1000,
                        uom: testProduct.baseUOM,
                        type: 'RELATIVE',
                        systemQuantity: 0,
                        actualQuantity: -1000
                    }
                ]
            })
        });

        if (createRes.ok) {
            const createData = await createRes.json();
            const adjustmentId = createData.data.id;

            const postRes = await fetch(`${BASE_URL}/api/inventory-adjustments/${adjustmentId}/post`, {
                method: 'POST',
                headers
            });

            // Expect 400 validation error, not 500
            if (postRes.status === 500) {
                console.log('REPRODUCED 500 ERROR with Negative Stock');
            }
            expect(postRes.status).not.toBe(500);
        }
    });
});

