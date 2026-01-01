import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { prisma } from '@/lib/prisma';
import {
    PurchaseOrderSchema,
    ReceivingVoucherSchema,
    InventoryBatchSchema,
    ApiSuccessResponseSchema,
    validatePrismaRelationNames,
} from '../schemas/api-response-schemas';
import {
    createTestSupplier,
    createTestWarehouse,
    createTestBranch,
    createTestProduct,
    cleanupTestData,
    assertCorrectPropertyNames,
} from '../helpers/api-test-utils';
import { randomUUID } from 'crypto';

/**
 * API Regression Test Suite
 * 
 * This test suite validates:
 * 1. All API responses use correct Prisma relation names (capital letters)
 * 2. Response schemas match expected structure
 * 3. No lowercase property names (supplier, warehouse, branch, items, product)
 * 
 * These tests prevent the property name mismatch bugs that were fixed.
 */

describe('API Regression Tests - Property Name Validation', () => {
    const testIds: { [key: string]: string[] } = {
        suppliers: [],
        warehouses: [],
        branches: [],
        products: [],
        purchaseOrders: [],
        purchaseOrderItems: [],
        receivingVouchers: [],
        receivingVoucherItems: [],
        inventoryBatches: [],
    };

    let testSupplier: any;
    let testWarehouse: any;
    let testBranch: any;
    let testProduct: any;

    beforeAll(async () => {
        // Create test data with correct structure
        testSupplier = await prisma.supplier.create({
            data: createTestSupplier(),
        });
        testIds.suppliers.push(testSupplier.id);

        testWarehouse = await prisma.warehouse.create({
            data: createTestWarehouse(),
        });
        testIds.warehouses.push(testWarehouse.id);

        testBranch = await prisma.branch.create({
            data: createTestBranch(),
        });
        testIds.branches.push(testBranch.id);

        testProduct = await prisma.product.create({
            data: createTestProduct(),
        });
        testIds.products.push(testProduct.id);
    });

    afterAll(async () => {
        // Clean up all test data
        await cleanupTestData(prisma, testIds);
    });

    describe('Purchase Orders API', () => {
        it('should return PO with correct Prisma relation names (capital letters)', async () => {
            // Create a test purchase order
            const po = await prisma.purchaseOrder.create({
                data: {
                    id: randomUUID(),
                    poNumber: `PO-TEST-${Date.now()}`,
                    supplierId: testSupplier.id,
                    warehouseId: testWarehouse.id,
                    branchId: testBranch.id,
                    totalAmount: 1000,
                    status: 'draft',
                    expectedDeliveryDate: new Date(),
                    updatedAt: new Date(),
                    PurchaseOrderItem: {
                        create: [
                            {
                                id: randomUUID(),
                                productId: testProduct.id,
                                quantity: 10,
                                unitPrice: 100,
                                subtotal: 1000,
                            },
                        ],
                    },
                },
                include: {
                    Supplier: true,
                    Warehouse: true,
                    Branch: true,
                    PurchaseOrderItem: {
                        include: {
                            Product: true,
                        },
                    },
                },
            });

            testIds.purchaseOrders.push(po.id);

            // Validate property names
            const violations = validatePrismaRelationNames(po);
            expect(violations).toHaveLength(0);

            // Validate schema
            const result = PurchaseOrderSchema.safeParse(po);
            expect(result.success).toBe(true);

            // Assert no lowercase relation names
            assertCorrectPropertyNames(po);

            // Verify specific properties exist with correct casing
            expect(po.Supplier).toBeDefined();
            expect(po.Warehouse).toBeDefined();
            expect(po.Branch).toBeDefined();
            expect(po.PurchaseOrderItem).toBeDefined();
            expect(po.PurchaseOrderItem[0].Product).toBeDefined();

            // Verify lowercase versions DO NOT exist
            expect((po as any).supplier).toBeUndefined();
            expect((po as any).warehouse).toBeUndefined();
            expect((po as any).branch).toBeUndefined();
            expect((po as any).items).toBeUndefined();
        });

        it('should list POs with correct property names', async () => {
            const pos = await prisma.purchaseOrder.findMany({
                where: { branchId: testBranch.id },
                include: {
                    Supplier: true,
                    Warehouse: true,
                    Branch: true,
                    PurchaseOrderItem: {
                        include: {
                            Product: true,
                        },
                    },
                },
            });

            expect(pos.length).toBeGreaterThan(0);

            // Validate each PO
            pos.forEach((po) => {
                const violations = validatePrismaRelationNames(po);
                expect(violations).toHaveLength(0);
                assertCorrectPropertyNames(po);
            });
        });
    });

    describe('Receiving Vouchers API', () => {
        it('should return RV with correct Prisma relation names', async () => {
            // First create a PO
            const po = await prisma.purchaseOrder.create({
                data: {
                    id: randomUUID(),
                    poNumber: `PO-RV-TEST-${Date.now()}`,
                    supplierId: testSupplier.id,
                    warehouseId: testWarehouse.id,
                    branchId: testBranch.id,
                    totalAmount: 500,
                    status: 'ordered',
                    expectedDeliveryDate: new Date(),
                    updatedAt: new Date(),
                    PurchaseOrderItem: {
                        create: [
                            {
                                id: randomUUID(),
                                productId: testProduct.id,
                                quantity: 5,
                                unitPrice: 100,
                                subtotal: 500,
                            },
                        ],
                    },
                },
            });

            testIds.purchaseOrders.push(po.id);

            // Create RV
            const rv = await prisma.receivingVoucher.create({
                data: {
                    id: randomUUID(),
                    rvNumber: `RV-TEST-${Date.now()}`,
                    purchaseOrderId: po.id,
                    warehouseId: testWarehouse.id,
                    branchId: testBranch.id,
                    receivedDate: new Date(),
                    receiverName: 'Test Receiver',
                    status: 'completed',
                    totalOrderedAmount: 500,
                    totalReceivedAmount: 500,
                    varianceAmount: 0,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    ReceivingVoucherItem: {
                        create: [
                            {
                                id: randomUUID(),
                                productId: testProduct.id,
                                orderedQuantity: 5,
                                receivedQuantity: 5,
                                varianceQuantity: 0,
                                variancePercentage: 0,
                                unitPrice: 100,
                                lineTotal: 500,
                            },
                        ],
                    },
                },
                include: {
                    PurchaseOrder: {
                        include: {
                            Supplier: true,
                        },
                    },
                    Warehouse: true,
                    Branch: true,
                    ReceivingVoucherItem: {
                        include: {
                            Product: true,
                        },
                    },
                },
            });

            testIds.receivingVouchers.push(rv.id);

            // Validate property names
            const violations = validatePrismaRelationNames(rv);
            expect(violations).toHaveLength(0);

            // Assert no lowercase relation names
            assertCorrectPropertyNames(rv);

            // Verify specific properties
            expect(rv.PurchaseOrder).toBeDefined();
            expect(rv.PurchaseOrder.Supplier).toBeDefined();
            expect(rv.Warehouse).toBeDefined();
            expect(rv.Branch).toBeDefined();
            expect(rv.ReceivingVoucherItem).toBeDefined();
            expect(rv.ReceivingVoucherItem[0].Product).toBeDefined();

            // Verify lowercase versions DO NOT exist
            expect((rv as any).purchaseOrder).toBeUndefined();
            expect((rv as any).warehouse).toBeUndefined();
            expect((rv as any).items).toBeUndefined();
        });
    });

    describe('Inventory API', () => {
        it('should return inventory batches with correct property names', async () => {
            const batch = await prisma.inventoryBatch.create({
                data: {
                    id: randomUUID(),
                    batchNumber: `BATCH-TEST-${Date.now()}`,
                    productId: testProduct.id,
                    warehouseId: testWarehouse.id,
                    branchId: testBranch.id,
                    quantity: 100,
                    averageCost: 50,
                    expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
                include: {
                    Product: true,
                    Warehouse: true,
                    Branch: true,
                },
            });

            testIds.inventoryBatches.push(batch.id);

            // Validate property names
            const violations = validatePrismaRelationNames(batch);
            expect(violations).toHaveLength(0);

            // Validate schema
            const result = InventoryBatchSchema.safeParse(batch);
            expect(result.success).toBe(true);

            // Assert no lowercase relation names
            assertCorrectPropertyNames(batch);

            // Verify properties
            expect(batch.Product).toBeDefined();
            expect(batch.Warehouse).toBeDefined();
            expect(batch.Branch).toBeDefined();

            // Verify lowercase versions DO NOT exist
            expect((batch as any).product).toBeUndefined();
            expect((batch as any).warehouse).toBeUndefined();
        });
    });

    describe('Products API', () => {
        it('should return products without lowercase relation names', async () => {
            const products = await prisma.product.findMany({
                take: 10,
            });

            products.forEach((product) => {
                const violations = validatePrismaRelationNames(product);
                expect(violations).toHaveLength(0);
                assertCorrectPropertyNames(product);
            });
        });
    });

    describe('Suppliers API', () => {
        it('should return suppliers without lowercase relation names', async () => {
            const suppliers = await prisma.supplier.findMany({
                take: 10,
            });

            suppliers.forEach((supplier) => {
                const violations = validatePrismaRelationNames(supplier);
                expect(violations).toHaveLength(0);
                assertCorrectPropertyNames(supplier);
            });
        });
    });

    describe('Warehouses API', () => {
        it('should return warehouses without lowercase relation names', async () => {
            const warehouses = await prisma.warehouse.findMany({
                take: 10,
            });

            warehouses.forEach((warehouse) => {
                const violations = validatePrismaRelationNames(warehouse);
                expect(violations).toHaveLength(0);
                assertCorrectPropertyNames(warehouse);
            });
        });
    });

    describe('Branches API', () => {
        it('should return branches without lowercase relation names', async () => {
            const branches = await prisma.branch.findMany({
                take: 10,
            });

            branches.forEach((branch) => {
                const violations = validatePrismaRelationNames(branch);
                expect(violations).toHaveLength(0);
                assertCorrectPropertyNames(branch);
            });
        });
    });
});
