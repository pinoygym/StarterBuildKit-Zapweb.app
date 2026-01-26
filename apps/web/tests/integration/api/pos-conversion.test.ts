import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { prisma } from '@/lib/prisma';
import { posService } from '@/services/pos.service';
import { salesOrderService } from '@/services/sales-order.service';
import { inventoryService } from '@/services/inventory.service';
import { randomUUID } from 'crypto';

describe('POS Conversion Integration', () => {
    let userId: string;
    let branchId: string;
    let warehouseId: string;
    let customerId: string;
    let productId: string;
    let roleId: string;

    beforeAll(async () => {
        // 1. Create a test role
        const role = await prisma.role.create({
            data: {
                id: randomUUID(),
                name: `Test Role ${Date.now()}`,
                description: 'Test Description',
                updatedAt: new Date(),
            }
        });
        roleId = role.id;

        // 2. Create a test user
        const user = await prisma.user.create({
            data: {
                id: randomUUID(),
                email: `test-${Date.now()}@example.com`,
                firstName: 'Test',
                lastName: 'User',
                passwordHash: 'hashed-password',
                roleId: roleId,
                updatedAt: new Date(),
            }
        });
        userId = user.id;

        // 3. Create branch
        const branch = await prisma.branch.create({
            data: {
                id: randomUUID(),
                name: 'Conversion Test Branch',
                code: `CTB-${Date.now()}`,
                location: 'Test Location',
                manager: 'Test Manager',
                phone: '123456789',
                status: 'active',
                updatedAt: new Date(),
            }
        });
        branchId = branch.id;

        // 4. Create warehouse
        const warehouse = await prisma.warehouse.create({
            data: {
                id: randomUUID(),
                name: 'Conversion Test Warehouse',
                location: 'Test Location',
                branchId: branchId,
                manager: 'Test Manager',
                maxCapacity: 1000,
                updatedAt: new Date(),
            }
        });
        warehouseId = warehouse.id;

        // 5. Create customer
        const customer = await prisma.customer.create({
            data: {
                id: randomUUID(),
                customerCode: `CUST-${Date.now()}`,
                companyName: 'Conversion Test Customer',
                contactPerson: 'Test Person',
                email: `customer-${Date.now()}@example.com`,
                phone: '09123456789',
                status: 'active',
                updatedAt: new Date(),
            }
        });
        customerId = customer.id;

        // 6. Create product
        const product = await prisma.product.create({
            data: {
                id: randomUUID(),
                name: 'Conversion Test Product',
                description: 'Test Description',
                category: 'Test Category',
                baseUOM: 'pcs',
                basePrice: 100,
                minStockLevel: 10,
                shelfLifeDays: 365,
                averageCostPrice: 50,
                status: 'active',
                updatedAt: new Date(),
            }
        });
        productId = product.id;

        // 7. Add initial inventory
        await inventoryService.addStock({
            productId,
            warehouseId,
            quantity: 100,
            uom: 'pcs',
            unitCost: 50,
            reason: 'Initial setup for test',
        });
    });

    afterAll(async () => {
        // Clean up in reverse order
        try {
            await prisma.stockMovement.deleteMany({ where: { productId } });
            await prisma.inventory.deleteMany({ where: { productId } });
            await prisma.pOSSaleItem.deleteMany({ where: { productId } });
            await prisma.pOSSale.deleteMany({ where: { branchId } });
            await prisma.salesOrderItem.deleteMany({ where: { productId } });
            await prisma.salesOrder.deleteMany({ where: { branchId } });
            await prisma.customer.deleteMany({ where: { id: customerId } });
            await prisma.inventoryAdjustmentItem.deleteMany({ where: { productId } });
            await prisma.inventoryTransferItem.deleteMany({ where: { productId } });
            await prisma.product.deleteMany({ where: { id: productId } });
            await prisma.warehouse.deleteMany({ where: { id: warehouseId } });
            await prisma.user.deleteMany({ where: { id: userId } });
            await prisma.branch.deleteMany({ where: { id: branchId } });
            await prisma.role.deleteMany({ where: { id: roleId } });
        } catch (error) {
            console.error('Cleanup failed:', error);
        }
    });

    it('should successfully convert multiple sales orders into one POS sale', async () => {
        // 1. Create two pending sales orders
        const commonData = {
            customerId,
            customerName: 'Conversion Test Customer',
            customerPhone: '09123456789',
            deliveryAddress: 'Test Address',
            warehouseId,
            branchId,
            deliveryDate: new Date(),
        };

        const order1 = await salesOrderService.createSalesOrder({
            ...commonData,
            items: [
                { productId, quantity: 5, uom: 'pcs', unitPrice: 100, subtotal: 500 }
            ],
        }, userId);

        const order2 = await salesOrderService.createSalesOrder({
            ...commonData,
            items: [
                { productId, quantity: 10, uom: 'pcs', unitPrice: 100, subtotal: 1000 }
            ],
        }, userId);

        expect(order1.salesOrderStatus).toBe('pending');
        expect(order2.salesOrderStatus).toBe('pending');

        // 2. Process POS sale with bulk conversion
        const totalAmount = Number(order1.totalAmount) + Number(order2.totalAmount);

        const sale = await posService.processSale({
            branchId,
            warehouseId,
            customerId,
            customerName: 'Conversion Test Customer',
            subtotal: totalAmount,
            totalAmount,
            paymentMethod: 'cash',
            amountReceived: totalAmount,
            convertedFromOrderIds: [order1.id, order2.id],
            items: [
                { productId, quantity: 15, uom: 'pcs', unitPrice: 100, subtotal: totalAmount }
            ],
            tax: 0
        });

        expect(sale).toBeDefined();

        // 3. Verify Sales Orders are marked as converted
        const updatedOrder1 = await prisma.salesOrder.findUnique({ where: { id: order1.id } });
        const updatedOrder2 = await prisma.salesOrder.findUnique({ where: { id: order2.id } });

        expect(updatedOrder1?.salesOrderStatus).toBe('converted');
        expect(updatedOrder1?.convertedToSaleId).toBe(sale.id);
        expect(updatedOrder2?.salesOrderStatus).toBe('converted');
        expect(updatedOrder2?.convertedToSaleId).toBe(sale.id);

        // 4. Verify Inventory Deduction
        const inventory = await prisma.inventory.findUnique({
            where: { productId_warehouseId: { productId, warehouseId } }
        });
        // Started with 100, sold 15 => 85
        expect(Number(inventory?.quantity)).toBe(85);
    });

    it('should prevent converting an already converted order', async () => {
        // 1. Create a sales order
        const order = await salesOrderService.createSalesOrder({
            customerId,
            customerName: 'Conversion Test Customer',
            customerPhone: '09123456789',
            deliveryAddress: 'Test Address',
            warehouseId,
            branchId,
            items: [
                { productId, quantity: 5, uom: 'pcs', unitPrice: 100, subtotal: 500 }
            ],
            deliveryDate: new Date(),
        }, userId);

        // 2. Mark it as converted manually first
        await salesOrderService.markAsConverted(order.id, 'some-sale-id');

        // 3. Attempt to convert it again via POS sale
        const totalAmount = Number(order.totalAmount);

        await expect(posService.processSale({
            branchId,
            warehouseId,
            customerId,
            customerName: 'Conversion Test Customer',
            subtotal: totalAmount,
            totalAmount,
            paymentMethod: 'cash',
            amountReceived: totalAmount,
            convertedFromOrderId: order.id,
            items: [
                { productId, quantity: 5, uom: 'pcs', unitPrice: 100, subtotal: totalAmount }
            ],
            tax: 0
        })).rejects.toThrow(/already converted/);
    });
});
