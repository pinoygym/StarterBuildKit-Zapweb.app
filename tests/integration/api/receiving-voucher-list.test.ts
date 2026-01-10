import { prisma } from '@/lib/prisma';
import { randomUUID } from 'crypto';
import { createTestUser, createTestBranch, createTestWarehouse, createTestSupplier } from '@/tests/helpers/test-db-utils';
import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';

import { BASE_URL } from '../config';

describe('Receiving Voucher List Integrity Tests', () => {
    let testUser: any;
    let testBranch: any;
    let testWarehouse: any;
    let testSupplier: any;
    let testProduct: any;
    let testPurchaseOrder: any;
    let token: string;
    let headers: any;

    beforeAll(async () => {
        // 1. Seed data
        const seedRes = await fetch(`${BASE_URL}/api/dev/seed`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({})
        });

        if (!seedRes.ok) {
            const text = await seedRes.text();
            console.error('Seed failed:', seedRes.status, text);
            throw new Error(`Seed failed: ${seedRes.status} ${text}`);
        }

        const seed = await seedRes.json();

        if (!seed.success) {
            throw new Error('Seed failed');
        }

        // 2. Login
        const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'cybergada@gmail.com',
                password: 'Qweasd1234',
            }),
        });

        if (!loginRes.ok) {
            const text = await loginRes.text();
            console.error('Login failed:', loginRes.status, text);
            throw new Error(`Login failed: ${loginRes.status} ${text}`);
        }

        const loginData = await loginRes.json();

        if (!loginData.success) {
            throw new Error('Login failed');
        }

        token = loginData.token;
        headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
        };

        // Create test data
        testUser = await createTestUser();
        testBranch = await createTestBranch();
        testWarehouse = await createTestWarehouse(testBranch.id);
        testSupplier = await createTestSupplier();
    });

    afterEach(async () => {
        // Clean up after each test
        if (testPurchaseOrder) {
            await prisma.receivingVoucher.deleteMany({
                where: { purchaseOrderId: testPurchaseOrder.id },
            });
            await prisma.accountsPayable.deleteMany({
                where: { purchaseOrderId: testPurchaseOrder.id }
            });
            await prisma.purchaseOrderItem.deleteMany({
                where: { poId: testPurchaseOrder.id },
            });
            await prisma.purchaseOrder.deleteMany({
                where: { id: testPurchaseOrder.id },
            });
        }
        if (testProduct) {
            await prisma.inventory.deleteMany({
                where: { productId: testProduct.id },
            });
            await prisma.stockMovement.deleteMany({
                where: { productId: testProduct.id },
            });
            await prisma.product.deleteMany({
                where: { id: testProduct.id },
            });
        }
    });

    afterAll(async () => {
        if (testSupplier) await prisma.accountsPayable.deleteMany({ where: { supplierId: testSupplier.id } });
        if (testSupplier) await prisma.supplier.delete({ where: { id: testSupplier.id } });
        if (testWarehouse) await prisma.warehouse.delete({ where: { id: testWarehouse.id } });
        if (testBranch) await prisma.branch.delete({ where: { id: testBranch.id } });
        if (testUser) await prisma.user.delete({ where: { id: testUser.id } });
        await prisma.$disconnect();
    });

    it('should show newly created receiving voucher in the list', async () => {
        // 1. Create Product and PO
        testProduct = await prisma.product.create({
            data: {
                id: randomUUID(),
                name: `Test Product ${Date.now()}-${randomUUID()}`,
                category: 'Test',
                basePrice: 100,
                averageCostPrice: 80,
                baseUOM: 'Unit',
                minStockLevel: 10,
                shelfLifeDays: 365,
                status: 'active',
                updatedAt: new Date(),
            },
        });

        testPurchaseOrder = await prisma.purchaseOrder.create({
            data: {
                id: randomUUID(),
                poNumber: `PO-LIST-${Date.now()}-${randomUUID()}`,
                supplierId: testSupplier.id,
                warehouseId: testWarehouse.id,
                branchId: testBranch.id,
                totalAmount: 1000,
                status: 'ordered',
                expectedDeliveryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                updatedAt: new Date(),
            },
        });

        const poItem = await prisma.purchaseOrderItem.create({
            data: {
                id: randomUUID(),
                poId: testPurchaseOrder.id,
                productId: testProduct.id,
                quantity: 10,
                uom: 'Unit',
                unitPrice: 100,
                subtotal: 1000,
                receivedQuantity: 0,
            },
        });

        // 2. Create Receiving Voucher via API
        const rvData = {
            purchaseOrderId: testPurchaseOrder.id,
            receiverName: 'Test Receiver',
            deliveryNotes: 'List test',
            items: [
                {
                    productId: testProduct.id,
                    poItemId: poItem.id,
                    orderedQuantity: 10,
                    receivedQuantity: 10,
                    unitPrice: 100,
                    uom: 'Unit',
                },
            ],
        };

        const createResponse = await fetch(`${BASE_URL}/api/receiving-vouchers`, {
            method: 'POST',
            headers,
            body: JSON.stringify(rvData),
        });

        if (createResponse.status !== 200) {
            const errorData = await createResponse.json();
            throw new Error(`Create RV Failed: ${JSON.stringify(errorData, null, 2)}`);
        }

        expect(createResponse.status).toBe(200);
        const createData = await createResponse.json();
        const createdRVId = createData.data.id;

        // 3. Fetch List with Branch Filter
        const listResponse = await fetch(`${BASE_URL}/api/receiving-vouchers?branchId=${testBranch.id}`, {
            method: 'GET',
            headers,
        });

        expect(listResponse.status).toBe(200);
        const listData = await listResponse.json();

        // 4. Verify RV is in the list
        const foundRV = listData.data.find((rv: any) => rv.id === createdRVId);
        expect(foundRV).toBeDefined();
        expect(foundRV.rvNumber).toBeDefined();
        expect(foundRV.branchId).toBe(testBranch.id);
    });
});

