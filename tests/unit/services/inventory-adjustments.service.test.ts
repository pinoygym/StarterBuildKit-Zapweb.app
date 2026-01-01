import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { inventoryService } from '@/services/inventory.service';
import { prisma } from '@/lib/prisma';
import { randomUUID } from 'crypto';

describe('InventoryService - Adjustment Slips', () => {
    let testWarehouseId: string;
    let testProductId: string;
    let testReferenceId: string;

    beforeEach(async () => {
        // Create test warehouse
        const warehouse = await prisma.warehouse.create({
            data: {
                id: randomUUID(),
                name: 'Test Warehouse',
                location: 'Test Location',
                manager: 'Test Manager',
                maxCapacity: 1000,
                branchId: (await prisma.branch.findFirst())!.id,
                updatedAt: new Date(),
            },
        });
        testWarehouseId = warehouse.id;

        // Create test product with unique name
        const product = await prisma.product.create({
            data: {
                id: randomUUID(),
                name: `Test Product ${randomUUID().substring(0, 8)}`,
                category: 'Test Category',
                basePrice: 100,
                baseUOM: 'PC',
                minStockLevel: 10,
                shelfLifeDays: 30,
                updatedAt: new Date(),
            },
        });
        testProductId = product.id;

        testReferenceId = randomUUID();
    });

    afterEach(async () => {
        // Clean up test data - delete in correct order to avoid FK constraints
        // First delete stock movements by referenceId
        await prisma.stockMovement.deleteMany({
            where: { referenceId: testReferenceId },
        });

        // Then delete any remaining stock movements for this product
        if (testProductId) {
            await prisma.stockMovement.deleteMany({
                where: { productId: testProductId },
            });
            await prisma.product.delete({ where: { id: testProductId } });
        }

        if (testWarehouseId) {
            await prisma.warehouse.delete({ where: { id: testWarehouseId } });
        }
    });

    describe('getAdjustmentSlips', () => {
        it('should return empty array when no adjustments exist', async () => {
            const result = await inventoryService.getAdjustmentSlips();
            expect(Array.isArray(result)).toBe(true);
        });

        it('should return adjustment slips grouped by referenceId', async () => {
            // Create test adjustment movements
            await prisma.stockMovement.createMany({
                data: [
                    {
                        id: randomUUID(),
                        productId: testProductId,
                        warehouseId: testWarehouseId,
                        type: 'ADJUSTMENT',
                        referenceType: 'ADJUSTMENT',
                        referenceId: testReferenceId,
                        quantity: 10,
                        reason: 'Test adjustment',
                    },
                    {
                        id: randomUUID(),
                        productId: testProductId,
                        warehouseId: testWarehouseId,
                        type: 'ADJUSTMENT',
                        referenceType: 'ADJUSTMENT',
                        referenceId: testReferenceId,
                        quantity: 5,
                        reason: 'Test adjustment',
                    },
                ],
            });

            const result = await inventoryService.getAdjustmentSlips();

            expect(result.length).toBeGreaterThan(0);
            const adjustment = result.find((a) => a.referenceId === testReferenceId);
            expect(adjustment).toBeDefined();
            expect(adjustment?.totalItems).toBe(2);
            expect(adjustment?.reason).toBe('Test adjustment');
            expect(adjustment?.warehouseId).toBe(testWarehouseId);
        });

        it('should filter by warehouseId', async () => {
            // Create adjustment in test warehouse
            await prisma.stockMovement.create({
                data: {
                    id: randomUUID(),
                    productId: testProductId,
                    warehouseId: testWarehouseId,
                    type: 'ADJUSTMENT',
                    referenceType: 'ADJUSTMENT',
                    referenceId: testReferenceId,
                    quantity: 10,
                    reason: 'Test adjustment',
                },
            });

            const result = await inventoryService.getAdjustmentSlips({
                warehouseId: testWarehouseId,
            });

            expect(result.length).toBeGreaterThan(0);
            result.forEach((adjustment) => {
                expect(adjustment.warehouseId).toBe(testWarehouseId);
            });
        });

        it('should filter by searchQuery (reference number)', async () => {
            const uniqueRef = `TEST-${randomUUID().substring(0, 8)}`;

            await prisma.stockMovement.create({
                data: {
                    id: randomUUID(),
                    productId: testProductId,
                    warehouseId: testWarehouseId,
                    type: 'ADJUSTMENT',
                    referenceType: 'ADJUSTMENT',
                    referenceId: uniqueRef,
                    quantity: 10,
                    reason: 'Test adjustment',
                },
            });

            const result = await inventoryService.getAdjustmentSlips({
                searchQuery: uniqueRef,
            });

            expect(result.length).toBe(1);
            expect(result[0].referenceNumber).toBe(uniqueRef);
        });

        it('should filter by searchQuery (reason)', async () => {
            const uniqueReason = `Unique reason ${randomUUID()}`;

            await prisma.stockMovement.create({
                data: {
                    id: randomUUID(),
                    productId: testProductId,
                    warehouseId: testWarehouseId,
                    type: 'ADJUSTMENT',
                    referenceType: 'ADJUSTMENT',
                    referenceId: testReferenceId,
                    quantity: 10,
                    reason: uniqueReason,
                },
            });

            const result = await inventoryService.getAdjustmentSlips({
                searchQuery: 'Unique reason',
            });

            expect(result.length).toBeGreaterThan(0);
            const adjustment = result.find((a) => a.reason === uniqueReason);
            expect(adjustment).toBeDefined();
        });

        it('should return adjustments sorted by date (newest first)', async () => {
            const now = new Date();
            const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

            // Create older adjustment
            await prisma.stockMovement.create({
                data: {
                    id: randomUUID(),
                    productId: testProductId,
                    warehouseId: testWarehouseId,
                    type: 'ADJUSTMENT',
                    referenceType: 'ADJUSTMENT',
                    referenceId: `OLD-${randomUUID()}`,
                    quantity: 10,
                    reason: 'Old adjustment',
                    createdAt: yesterday,
                },
            });

            // Create newer adjustment
            await prisma.stockMovement.create({
                data: {
                    id: randomUUID(),
                    productId: testProductId,
                    warehouseId: testWarehouseId,
                    type: 'ADJUSTMENT',
                    referenceType: 'ADJUSTMENT',
                    referenceId: testReferenceId,
                    quantity: 10,
                    reason: 'New adjustment',
                    createdAt: now,
                },
            });

            const result = await inventoryService.getAdjustmentSlips();

            expect(result.length).toBeGreaterThan(1);
            // Verify newest is first
            expect(new Date(result[0].createdAt).getTime()).toBeGreaterThanOrEqual(
                new Date(result[1].createdAt).getTime()
            );
        });
    });

    describe('getAdjustmentSlipById', () => {
        it('should return null when adjustment not found', async () => {
            const result = await inventoryService.getAdjustmentSlipById('nonexistent');
            expect(result).toBeNull();
        });

        it('should return complete adjustment slip with all items', async () => {
            // Create test adjustment with multiple items
            await prisma.stockMovement.createMany({
                data: [
                    {
                        id: randomUUID(),
                        productId: testProductId,
                        warehouseId: testWarehouseId,
                        type: 'ADJUSTMENT',
                        referenceType: 'ADJUSTMENT',
                        referenceId: testReferenceId,
                        quantity: 10,
                        reason: 'Test adjustment',
                    },
                    {
                        id: randomUUID(),
                        productId: testProductId,
                        warehouseId: testWarehouseId,
                        type: 'ADJUSTMENT',
                        referenceType: 'ADJUSTMENT',
                        referenceId: testReferenceId,
                        quantity: 5,
                        reason: 'Test adjustment',
                    },
                ],
            });

            const result = await inventoryService.getAdjustmentSlipById(testReferenceId);

            expect(result).not.toBeNull();
            expect(result?.referenceId).toBe(testReferenceId);
            expect(result?.totalItems).toBe(2);
            expect(result?.items).toHaveLength(2);
            expect(result?.reason).toBe('Test adjustment');
            expect(result?.warehouseId).toBe(testWarehouseId);
        });

        it('should include product and warehouse details', async () => {
            await prisma.stockMovement.create({
                data: {
                    id: randomUUID(),
                    productId: testProductId,
                    warehouseId: testWarehouseId,
                    type: 'ADJUSTMENT',
                    referenceType: 'ADJUSTMENT',
                    referenceId: testReferenceId,
                    quantity: 10,
                    reason: 'Test adjustment',
                },
            });

            const result = await inventoryService.getAdjustmentSlipById(testReferenceId);

            expect(result).not.toBeNull();
            expect(result?.items[0].productName).toContain('Test Product');
            expect(result?.items[0].baseUOM).toBe('PC');
            expect(result?.warehouseName).toBe('Test Warehouse');
        });
    });
});
