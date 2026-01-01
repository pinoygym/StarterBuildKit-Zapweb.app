
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { prisma } from '../../lib/prisma';
import { inventoryService } from '../../services/inventory.service';
import { randomUUID } from 'crypto';

describe('Inventory Audit Integration', () => {
    let warehouseId: string;
    let productId: string;
    let branchId: string;
    let testId: string;

    beforeAll(async () => {
        testId = `audit-${randomUUID().substring(0, 8)}`;

        // Create Branch (Required for Warehouse)
        const branch = await prisma.branch.create({
            data: {
                id: `branch-${testId}`,
                name: `Branch ${testId}`,
                code: `BR-${testId}`,
                location: 'Test Location',
                manager: 'Test Manager',
                phone: '1234567890',
                updatedAt: new Date()
            }
        });
        branchId = branch.id;

        // Create Warehouse
        const warehouse = await prisma.warehouse.create({
            data: {
                id: `wh-${testId}`,
                name: `Warehouse ${testId}`,
                location: 'Test Address',
                manager: 'Test Manager',
                maxCapacity: 1000,
                branchId: branchId,
                updatedAt: new Date()
            }
        });
        warehouseId = warehouse.id;

        // Create Product
        const product = await prisma.product.create({
            data: {
                id: `prod-${testId}`,
                name: `Product ${testId}`,
                basePrice: 100,
                baseUOM: 'pcs',
                minStockLevel: 10,
                shelfLifeDays: 365,
                category: 'Test',
                status: 'active',
                updatedAt: new Date(),
            }
        });
        productId = product.id;
    });

    afterAll(async () => {
        try {
            // Cleanup in reverse order of dependencies
            await prisma.stockMovement.deleteMany({
                where: { productId }
            });
            await prisma.inventory.deleteMany({
                where: { productId, warehouseId }
            });
            await prisma.product.delete({
                where: { id: productId }
            });
            await prisma.warehouse.delete({
                where: { id: warehouseId }
            });
            await prisma.branch.delete({
                where: { id: branchId }
            });
        } catch (e) {
            console.error('Cleanup failed', e);
        }
    });

    it('should pass audit when inventory matches movements', async () => {
        // 1. Initialize Inventory (0 qty)
        await prisma.inventory.create({
            data: {
                productId,
                warehouseId,
                quantity: 0
            }
        });

        // 2. Add Stock IN
        const qtyIn = 50;
        await inventoryService.addStock({
            productId,
            warehouseId,
            quantity: qtyIn,
            reason: 'Initial Stock',
            referenceId: `ref-${testId}`,
            referenceType: 'ADJUSTMENT', // This will create a stock movement
            uom: 'pcs'
        });

        // Verify current stock
        const currentStock = await inventoryService.getCurrentStockLevel(productId, warehouseId);
        expect(currentStock).toBe(qtyIn);

        // 3. Run Audit
        const result = await inventoryService.auditInventory();

        // Check that THIS product has no discrepancy
        const discrepancy = result.discrepancies.find(
            d => d.productId === productId && d.warehouseId === warehouseId
        );
        expect(discrepancy).toBeUndefined();
    });

    it('should detect discrepancy when inventory is modified directly', async () => {
        // 1. Manually modify inventory (simulate data corruption)
        const corruptedQty = 999;
        await prisma.inventory.update({
            where: {
                productId_warehouseId: {
                    productId,
                    warehouseId
                }
            },
            data: {
                quantity: corruptedQty
            }
        });

        // 2. Run Audit
        const result = await inventoryService.auditInventory();

        // 3. Verify discrepancy found
        const discrepancy = result.discrepancies.find(
            d => d.productId === productId && d.warehouseId === warehouseId
        );

        expect(discrepancy).toBeDefined();
        expect(discrepancy?.systemQuantity).toBe(corruptedQty);
        expect(discrepancy?.calculatedQuantity).toBe(50); // From previous test step
        expect(discrepancy?.variance).toBe(50 - corruptedQty);
    });
});
