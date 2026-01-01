import 'dotenv/config';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { prisma } from '@/lib/prisma';
import { receivingVoucherService } from '@/services/receiving-voucher.service';
import { randomUUID } from 'crypto';
import { createTestBranch, createTestWarehouse, createTestSupplier, createTestProduct } from '../helpers/test-db-utils';

describe('Receiving Voucher Average Cost Anomaly Reproduction', () => {

    it('should calculate weighted average cost correctly across multiple receipts', async () => {
        console.log('🔍 Starting Reproduction Test for RV Average Cost Anomaly...\n');

        const testId = randomUUID().substring(0, 8);

        // 1. Setup Data
        console.log('1️⃣ Setting up test data...');

        // Declare variables outside try block for cleanup
        let branch: any;
        let warehouse: any;
        let supplier: any;
        let product: any;

        try {
            // Create Branch
            branch = await createTestBranch();

            // Create Warehouse
            warehouse = await createTestWarehouse(branch.id);

            // Create Supplier
            supplier = await createTestSupplier();

            // Create Product with UOMs
            // Base: pcs
            // Alternate: box = 10 pcs
            product = await createTestProduct({
                baseUOM: 'pcs',
                averageCostPrice: 0, // Initial cost
                productUOMs: {
                    create: [
                        {
                            id: randomUUID(),
                            name: 'box',
                            conversionFactor: 10,
                            sellingPrice: 200
                        }
                    ]
                }
            });

            console.log(`   Created Product: ${product.name} (Base: pcs, Alt: box=10pcs)`);

            // 2. Scenario 1: First Receipt
            // Receive 1 box @ 100 (Cost per box)
            // Expected Base Cost: 100 / 10 = 10 per pc
            console.log('\n2️⃣ Scenario 1: First Receipt (1 box @ 100)');

            const po1: any = await prisma.purchaseOrder.create({
                data: {
                    id: randomUUID(),
                    poNumber: `PO-${testId}-1`,
                    branchId: branch.id,
                    warehouseId: warehouse.id,
                    supplierId: supplier.id,
                    status: 'ordered',
                    expectedDeliveryDate: new Date(),
                    totalAmount: 100,
                    updatedAt: new Date(),
                    PurchaseOrderItem: {
                        create: {
                            id: randomUUID(),
                            productId: product.id,
                            quantity: 1,
                            uom: 'box',
                            unitPrice: 100,
                            subtotal: 100,
                            receivedQuantity: 0
                        }
                    }
                } as any,
                include: { PurchaseOrderItem: true }
            });

            const rv1 = await receivingVoucherService.createReceivingVoucher({
                purchaseOrderId: po1.id,
                receiverName: 'Tester',
                items: [{
                    productId: product.id,
                    poItemId: po1.PurchaseOrderItem[0].id,
                    orderedQuantity: 1,
                    receivedQuantity: 1,
                    unitPrice: 100,
                    uom: 'box'
                }]
            });

            // Check Average Cost
            const productAfter1 = await prisma.product.findUnique({ where: { id: product.id } });
            console.log(`   RV Created: ${rv1.rvNumber}`);
            console.log(`   Average Cost: ${productAfter1?.averageCostPrice}`);
            console.log(`   Expected: 10`);

            expect(Number(productAfter1?.averageCostPrice)).toBe(10);

            // 3. Scenario 2: Second Receipt (Weighted Average)
            // Current Stock: 10 pcs @ 10 = 100 value
            // Receive 1 box @ 200 (Cost per box)
            // New Stock: 10 pcs @ (200/10=20) = 200 value
            // Total Stock: 20 pcs
            // Total Value: 300
            // Expected Avg: 300 / 20 = 15
            console.log('\n3️⃣ Scenario 2: Second Receipt (1 box @ 200)');

            const po2: any = await prisma.purchaseOrder.create({
                data: {
                    id: randomUUID(),
                    poNumber: `PO-${testId}-2`,
                    branchId: branch.id,
                    warehouseId: warehouse.id,
                    supplierId: supplier.id,
                    status: 'ordered',
                    expectedDeliveryDate: new Date(),
                    totalAmount: 200,
                    updatedAt: new Date(),
                    PurchaseOrderItem: {
                        create: {
                            id: randomUUID(),
                            productId: product.id,
                            quantity: 1,
                            uom: 'box',
                            unitPrice: 200,
                            subtotal: 200,
                            receivedQuantity: 0
                        }
                    }
                } as any,
                include: { PurchaseOrderItem: true }
            });

            const rv2 = await receivingVoucherService.createReceivingVoucher({
                purchaseOrderId: po2.id,
                receiverName: 'Tester',
                items: [{
                    productId: product.id,
                    poItemId: po2.PurchaseOrderItem[0].id,
                    orderedQuantity: 1,
                    receivedQuantity: 1,
                    unitPrice: 200,
                    uom: 'box'
                }]
            });

            // Check Average Cost
            const productAfter2 = await prisma.product.findUnique({ where: { id: product.id } });
            console.log(`   RV Created: ${rv2.rvNumber}`);
            console.log(`   Average Cost: ${productAfter2?.averageCostPrice}`);
            console.log(`   Expected: 15`);

            expect(Number(productAfter2?.averageCostPrice)).toBe(15);

            // 4. Scenario 3: Third Receipt with Discount and Recompute
            // Current Stock: 20 pcs @ 15 = 300 value
            // Receive 1 box @ 100
            // Discount: 20 (Fixed)
            // Net Amount: 80
            // Effective Cost: 80 / 10 = 8 per pc
            // New Stock: 10 pcs @ 8 = 80 value
            // Total Stock: 30 pcs
            // Total Value: 300 + 80 = 380
            // Expected Avg: 380 / 30 = 12.67
            console.log('\n4️⃣ Scenario 3: Third Receipt (1 box @ 100 with 20 discount)');

            const po3: any = await prisma.purchaseOrder.create({
                data: {
                    id: randomUUID(),
                    poNumber: `PO-${testId}-3`,
                    branchId: branch.id,
                    warehouseId: warehouse.id,
                    supplierId: supplier.id,
                    status: 'ordered',
                    expectedDeliveryDate: new Date(),
                    totalAmount: 100,
                    updatedAt: new Date(),
                    PurchaseOrderItem: {
                        create: {
                            id: randomUUID(),
                            productId: product.id,
                            quantity: 1,
                            uom: 'box',
                            unitPrice: 100,
                            subtotal: 100,
                            receivedQuantity: 0
                        }
                    }
                } as any,
                include: { PurchaseOrderItem: true }
            });

            const rv3 = await receivingVoucherService.createReceivingVoucher({
                purchaseOrderId: po3.id,
                receiverName: 'Tester',
                supplierDiscount: 20,
                supplierDiscountType: 'fixed',
                recomputeAverageCost: true,
                items: [{
                    productId: product.id,
                    poItemId: po3.PurchaseOrderItem[0].id,
                    orderedQuantity: 1,
                    receivedQuantity: 1,
                    unitPrice: 100,
                    uom: 'box'
                }]
            });

            // Check Average Cost
            const productAfter3 = await prisma.product.findUnique({ where: { id: product.id } });
            console.log(`   RV Created: ${rv3.rvNumber}`);
            console.log(`   Average Cost: ${productAfter3?.averageCostPrice}`);
            console.log(`   Expected: 12.67`);

            expect(Number(productAfter3?.averageCostPrice)).toBeCloseTo(12.666, 2);

        } finally {
            // Cleanup
            console.log('\n🧹 Cleaning up...');
            try {
                if (product) {
                    await prisma.stockMovement.deleteMany({ where: { productId: product.id } });
                    await prisma.inventory.deleteMany({ where: { productId: product.id } });
                    await prisma.receivingVoucherItem.deleteMany({ where: { productId: product.id } });
                    await prisma.purchaseOrderItem.deleteMany({ where: { productId: product.id } });
                    await prisma.productUOM.deleteMany({ where: { productId: product.id } });
                    await prisma.product.delete({ where: { id: product.id } });
                }
                if (supplier) await prisma.supplier.delete({ where: { id: supplier.id } });
                if (warehouse) await prisma.warehouse.delete({ where: { id: warehouse.id } });
                if (branch) await prisma.branch.delete({ where: { id: branch.id } });
            } catch (e) {
                console.error('Cleanup failed', e);
            }
        }
    }, 30000); // Increase timeout
});
