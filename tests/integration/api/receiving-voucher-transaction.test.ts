import { prisma } from '@/lib/prisma';
import { randomUUID } from 'crypto';
import { createTestUser, createTestBranch, createTestWarehouse, createTestSupplier } from '@/tests/helpers/test-db-utils';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

describe('Receiving Voucher Transaction Integrity Tests', () => {
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
                password: 'Qweasd145698@',
            }),
        });
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

        testProduct = await prisma.product.create({
            data: {
                id: randomUUID(),
                name: `Test Product ${Date.now()}`,
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
                poNumber: `PO-TX-${Date.now()}`,
                supplierId: testSupplier.id,
                warehouseId: testWarehouse.id,
                branchId: testBranch.id,
                totalAmount: 1000,
                status: 'ordered',
                expectedDeliveryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                updatedAt: new Date(),
            },
        });

        await prisma.purchaseOrderItem.create({
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
    });

    afterEach(async () => {
        // Clean up after each test
        await prisma.receivingVoucher.deleteMany({
            where: { purchaseOrderId: testPurchaseOrder.id },
        });
        await prisma.inventory.deleteMany({
            where: { productId: testProduct.id },
        });
        await prisma.stockMovement.deleteMany({
            where: { productId: testProduct.id },
        });
        await prisma.purchaseOrderItem.updateMany({
            where: { poId: testPurchaseOrder.id },
            data: { receivedQuantity: 0 },
        });
        await prisma.purchaseOrder.update({
            where: { id: testPurchaseOrder.id },
            data: { status: 'ordered', receivingStatus: 'pending' },
        });
    });

    afterAll(async () => {
        await prisma.purchaseOrderItem.deleteMany({ where: { poId: testPurchaseOrder.id } });
        await prisma.purchaseOrder.delete({ where: { id: testPurchaseOrder.id } });
        await prisma.product.delete({ where: { id: testProduct.id } });
        await prisma.supplier.delete({ where: { id: testSupplier.id } });
        await prisma.warehouse.delete({ where: { id: testWarehouse.id } });
        await prisma.branch.delete({ where: { id: testBranch.id } });
        await prisma.user.delete({ where: { id: testUser.id } });
        await prisma.$disconnect();
    });

    describe('Transaction Atomicity', () => {
        it('should create RV, update inventory, and record stock movement in single transaction', async () => {
            const rvData = {
                purchaseOrderId: testPurchaseOrder.id,
                receiverName: 'Test Receiver',
                deliveryNotes: 'Transaction test',
                items: [
                    {
                        productId: testProduct.id,
                        orderedQuantity: 10,
                        receivedQuantity: 10,
                        unitPrice: 100,
                    },
                ],
            };

            const response = await fetch(`${BASE_URL}/api/receiving-vouchers`, {
                method: 'POST',
                headers,
                body: JSON.stringify(rvData),
            });

            const responseData = await response.json();

            // Should succeed without 500 error
            expect(response.status).toBe(200);
            expect(responseData.success).toBe(true);

            // Verify RV was created
            const rv = await prisma.receivingVoucher.findFirst({
                where: { purchaseOrderId: testPurchaseOrder.id },
                include: { ReceivingVoucherItem: true },
            });
            expect(rv).toBeDefined();
            expect(rv?.ReceivingVoucherItem).toHaveLength(1);

            // Verify inventory was updated atomically
            const inventory = await prisma.inventory.findFirst({
                where: {
                    productId: testProduct.id,
                    warehouseId: testWarehouse.id,
                },
            });
            expect(inventory).toBeDefined();
            expect(inventory?.quantity).toBe(10);

            // Verify stock movement was recorded
            const movements = await prisma.stockMovement.findMany({
                where: {
                    productId: testProduct.id,
                    referenceType: 'RV',
                },
            });
            expect(movements).toHaveLength(1);
            expect(movements[0].quantity).toBe(10);
            expect(movements[0].type).toBe('IN');

            // Verify PO was updated
            const po = await prisma.purchaseOrder.findUnique({
                where: { id: testPurchaseOrder.id },
            });
            expect(po?.receivingStatus).toBe('fully_received');
            expect(po?.status).toBe('received');
        });

        it('should rollback all changes if any operation fails', async () => {
            // Create RV with invalid product ID to force failure
            const rvData = {
                purchaseOrderId: testPurchaseOrder.id,
                receiverName: 'Test Receiver',
                items: [
                    {
                        productId: 'invalid-product-id',
                        orderedQuantity: 10,
                        receivedQuantity: 10,
                        unitPrice: 100,
                    },
                ],
            };

            const response = await fetch(`${BASE_URL}/api/receiving-vouchers`, {
                method: 'POST',
                headers,
                body: JSON.stringify(rvData),
            });

            // Should fail
            expect(response.status).toBeGreaterThanOrEqual(400);

            // Verify no RV was created
            const rv = await prisma.receivingVoucher.findFirst({
                where: { purchaseOrderId: testPurchaseOrder.id },
            });
            expect(rv).toBeNull();

            // Verify no inventory was created
            const inventory = await prisma.inventory.findFirst({
                where: { warehouseId: testWarehouse.id },
            });
            expect(inventory).toBeNull();

            // Verify no stock movements
            const movements = await prisma.stockMovement.findMany({
                where: { referenceType: 'RV' },
            });
            expect(movements).toHaveLength(0);
        });

        it('should handle multiple items in single transaction', async () => {
            // Create second product
            const product2 = await prisma.product.create({
                data: {
                    id: randomUUID(),
                    name: `Test Product 2 ${Date.now()}`,
                    category: 'Test',
                    basePrice: 50,
                    averageCostPrice: 40,
                    baseUOM: 'Unit',
                    minStockLevel: 5,
                    shelfLifeDays: 365,
                    status: 'active',
                    updatedAt: new Date(),
                },
            });

            await prisma.purchaseOrderItem.create({
                data: {
                    id: randomUUID(),
                    poId: testPurchaseOrder.id,
                    productId: product2.id,
                    quantity: 5,
                    uom: 'Unit',
                    unitPrice: 50,
                    subtotal: 250,
                    receivedQuantity: 0,
                },
            });

            const rvData = {
                purchaseOrderId: testPurchaseOrder.id,
                receiverName: 'Test Receiver',
                items: [
                    {
                        productId: testProduct.id,
                        orderedQuantity: 10,
                        receivedQuantity: 10,
                        unitPrice: 100,
                    },
                    {
                        productId: product2.id,
                        orderedQuantity: 5,
                        receivedQuantity: 5,
                        unitPrice: 50,
                    },
                ],
            };

            const response = await fetch(`${BASE_URL}/api/receiving-vouchers`, {
                method: 'POST',
                headers,
                body: JSON.stringify(rvData),
            });

            const responseData = await response.json();
            expect(response.status).toBe(200);

            // Verify both products have inventory
            const inventory1 = await prisma.inventory.findFirst({
                where: { productId: testProduct.id },
            });
            const inventory2 = await prisma.inventory.findFirst({
                where: { productId: product2.id },
            });

            expect(inventory1?.quantity).toBe(10);
            expect(inventory2?.quantity).toBe(5);

            // Verify both have stock movements
            const movements = await prisma.stockMovement.findMany({
                where: { referenceType: 'RV' },
            });
            expect(movements).toHaveLength(2);

            // Cleanup
            await prisma.product.delete({ where: { id: product2.id } });
        });
    });

    describe('Regression: Nested Transaction Bug', () => {
        it('should not throw 500 error due to nested transactions', async () => {
            // This test specifically catches the bug we just fixed
            // where inventoryService.addStock was creating a nested transaction

            const rvData = {
                purchaseOrderId: testPurchaseOrder.id,
                receiverName: 'Nested Transaction Test',
                items: [
                    {
                        productId: testProduct.id,
                        orderedQuantity: 10,
                        receivedQuantity: 10,
                        unitPrice: 100,
                    },
                ],
            };

            const response = await fetch(`${BASE_URL}/api/receiving-vouchers`, {
                method: 'POST',
                headers,
                body: JSON.stringify(rvData),
            });

            const responseData = await response.json();

            // The key assertion: should NOT return 500
            expect(response.status).not.toBe(500);
            expect(response.status).toBe(200);
            expect(responseData.success).toBe(true);

            // Verify the operation actually completed
            const rv = await prisma.receivingVoucher.findFirst({
                where: { purchaseOrderId: testPurchaseOrder.id },
            });
            expect(rv).toBeDefined();
        });
    });
});
