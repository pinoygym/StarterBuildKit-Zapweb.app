import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { inventoryAdjustmentService } from '@/services/inventory-adjustment.service';
import { prisma } from '@/lib/prisma';
import { inventoryService } from '@/services/inventory.service';

/**
 * Comprehensive test suite for ABSOLUTE vs RELATIVE inventory adjustment types
 * 
 * RELATIVE: quantity = change amount (e.g., +10, -5)
 * ABSOLUTE: quantity = target inventory level (e.g., set to 100)
 */

// Mock dependencies
vi.mock('@/lib/prisma', () => ({
    prisma: {
        $transaction: vi.fn((callback) => callback(prisma)),
        inventoryAdjustment: {
            create: vi.fn(),
            update: vi.fn(),
            findUnique: vi.fn(),
            count: vi.fn(),
        },
        inventoryAdjustmentItem: {
            update: vi.fn(),
        },
        inventory: {
            findMany: vi.fn(),
            upsert: vi.fn(),
        },
        stockMovement: {
            create: vi.fn(),
        },
        product: {
            findMany: vi.fn(),
        }
    },
}));

vi.mock('@/services/inventory.service', () => ({
    inventoryService: {
        adjustStockBatch: vi.fn(),
    },
}));

vi.mock('@/services/audit.service', () => ({
    auditService: {
        log: vi.fn(),
    },
}));

describe('InventoryAdjustmentService - Adjustment Types (ABSOLUTE vs RELATIVE)', () => {
    const mockUserId = 'user-123';
    const mockDate = new Date('2024-01-15');

    beforeEach(() => {
        vi.clearAllMocks();
        vi.useFakeTimers({ now: mockDate });
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    describe('RELATIVE Adjustments', () => {
        it('should correctly calculate actual quantity for positive RELATIVE adjustment', async () => {
            // Scenario: Add 20 units when current stock is 50
            const currentStock = 50;
            const relativeChange = 20;
            const expectedActual = 70; // 50 + 20

            const draftAdjustment = {
                id: 'adj-1',
                status: 'DRAFT',
                warehouseId: 'wh-1',
                adjustmentDate: mockDate,
                adjustmentNumber: 'ADJ-001',
                reason: 'Stock addition',
                items: [
                    {
                        id: 'item-1',
                        productId: 'prod-1',
                        quantity: relativeChange,
                        uom: 'PCS',
                        type: 'RELATIVE'
                    }
                ],
            };

            (prisma.inventoryAdjustment.findUnique as any).mockResolvedValue(draftAdjustment);
            (prisma.inventory.findMany as any).mockResolvedValue([
                { productId: 'prod-1', quantity: currentStock }
            ]);
            (prisma.inventoryAdjustment.update as any).mockResolvedValue({
                ...draftAdjustment,
                status: 'POSTED',
                items: draftAdjustment.items.map(item => ({
                    ...item,
                    Product: { id: item.productId, name: 'Product 1', baseUOM: 'PCS' }
                }))
            });

            await inventoryAdjustmentService.post('adj-1', mockUserId);

            // Verify: systemQuantity should be current stock, actualQuantity should be current + change
            expect(prisma.inventoryAdjustmentItem.update).toHaveBeenCalledWith({
                where: { id: 'item-1' },
                data: {
                    systemQuantity: currentStock,
                    actualQuantity: expectedActual
                }
            });

            // Verify: adjustment sent to inventory service with RELATIVE type
            expect(inventoryService.adjustStockBatch).toHaveBeenCalledWith(
                expect.objectContaining({
                    items: expect.arrayContaining([
                        expect.objectContaining({
                            productId: 'prod-1',
                            quantity: relativeChange,
                            adjustmentType: 'RELATIVE'
                        })
                    ])
                }),
                expect.anything()
            );
        });

        it('should correctly calculate actual quantity for negative RELATIVE adjustment', async () => {
            // Scenario: Remove 15 units when current stock is 50
            const currentStock = 50;
            const relativeChange = -15;
            const expectedActual = 35; // 50 - 15

            const draftAdjustment = {
                id: 'adj-2',
                status: 'DRAFT',
                warehouseId: 'wh-1',
                adjustmentDate: mockDate,
                adjustmentNumber: 'ADJ-002',
                reason: 'Stock reduction',
                items: [
                    {
                        id: 'item-2',
                        productId: 'prod-2',
                        quantity: relativeChange,
                        uom: 'PCS',
                        type: 'RELATIVE'
                    }
                ],
            };

            (prisma.inventoryAdjustment.findUnique as any).mockResolvedValue(draftAdjustment);
            (prisma.inventory.findMany as any).mockResolvedValue([
                { productId: 'prod-2', quantity: currentStock }
            ]);
            (prisma.inventoryAdjustment.update as any).mockResolvedValue({
                ...draftAdjustment,
                status: 'POSTED',
                items: draftAdjustment.items.map(item => ({
                    ...item,
                    Product: { id: item.productId, name: 'Product 2', baseUOM: 'PCS' }
                }))
            });

            await inventoryAdjustmentService.post('adj-2', mockUserId);

            expect(prisma.inventoryAdjustmentItem.update).toHaveBeenCalledWith({
                where: { id: 'item-2' },
                data: {
                    systemQuantity: currentStock,
                    actualQuantity: expectedActual
                }
            });
        });

        it('should handle RELATIVE adjustment when current stock is 0', async () => {
            // Scenario: Add 100 units when there's no existing stock
            const currentStock = 0;
            const relativeChange = 100;
            const expectedActual = 100; // 0 + 100

            const draftAdjustment = {
                id: 'adj-3',
                status: 'DRAFT',
                warehouseId: 'wh-1',
                adjustmentDate: mockDate,
                adjustmentNumber: 'ADJ-003',
                reason: 'Initial stock',
                items: [
                    {
                        id: 'item-3',
                        productId: 'prod-3',
                        quantity: relativeChange,
                        uom: 'PCS',
                        type: 'RELATIVE'
                    }
                ],
            };

            (prisma.inventoryAdjustment.findUnique as any).mockResolvedValue(draftAdjustment);
            (prisma.inventory.findMany as any).mockResolvedValue([]); // No existing inventory
            (prisma.inventoryAdjustment.update as any).mockResolvedValue({
                ...draftAdjustment,
                status: 'POSTED',
                items: draftAdjustment.items.map(item => ({
                    ...item,
                    Product: { id: item.productId, name: 'Product 3', baseUOM: 'PCS' }
                }))
            });

            await inventoryAdjustmentService.post('adj-3', mockUserId);

            expect(prisma.inventoryAdjustmentItem.update).toHaveBeenCalledWith({
                where: { id: 'item-3' },
                data: {
                    systemQuantity: currentStock,
                    actualQuantity: expectedActual
                }
            });
        });
    });

    describe('ABSOLUTE Adjustments', () => {
        it('should correctly set actual quantity for ABSOLUTE adjustment (increase)', async () => {
            // Scenario: Set stock to 200 when current is 80
            const currentStock = 80;
            const targetQuantity = 200;
            const expectedActual = targetQuantity; // ABSOLUTE sets to exact value

            const draftAdjustment = {
                id: 'adj-4',
                status: 'DRAFT',
                warehouseId: 'wh-1',
                adjustmentDate: mockDate,
                adjustmentNumber: 'ADJ-004',
                reason: 'Physical count adjustment',
                items: [
                    {
                        id: 'item-4',
                        productId: 'prod-4',
                        quantity: targetQuantity,
                        uom: 'PCS',
                        type: 'ABSOLUTE'
                    }
                ],
            };

            (prisma.inventoryAdjustment.findUnique as any).mockResolvedValue(draftAdjustment);
            (prisma.inventory.findMany as any).mockResolvedValue([
                { productId: 'prod-4', quantity: currentStock }
            ]);
            (prisma.inventoryAdjustment.update as any).mockResolvedValue({
                ...draftAdjustment,
                status: 'POSTED',
                items: draftAdjustment.items.map(item => ({
                    ...item,
                    Product: { id: item.productId, name: 'Product 4', baseUOM: 'PCS' }
                }))
            });

            await inventoryAdjustmentService.post('adj-4', mockUserId);

            // Verify: systemQuantity is current, actualQuantity is the ABSOLUTE target
            expect(prisma.inventoryAdjustmentItem.update).toHaveBeenCalledWith({
                where: { id: 'item-4' },
                data: {
                    systemQuantity: currentStock,
                    actualQuantity: expectedActual
                }
            });

            // Verify: sent to inventory service with ABSOLUTE type
            expect(inventoryService.adjustStockBatch).toHaveBeenCalledWith(
                expect.objectContaining({
                    items: expect.arrayContaining([
                        expect.objectContaining({
                            productId: 'prod-4',
                            quantity: targetQuantity,
                            adjustmentType: 'ABSOLUTE'
                        })
                    ])
                }),
                expect.anything()
            );
        });

        it('should correctly set actual quantity for ABSOLUTE adjustment (decrease)', async () => {
            // Scenario: Set stock to 30 when current is 150
            const currentStock = 150;
            const targetQuantity = 30;
            const expectedActual = targetQuantity;

            const draftAdjustment = {
                id: 'adj-5',
                status: 'DRAFT',
                warehouseId: 'wh-1',
                adjustmentDate: mockDate,
                adjustmentNumber: 'ADJ-005',
                reason: 'Count discrepancy',
                items: [
                    {
                        id: 'item-5',
                        productId: 'prod-5',
                        quantity: targetQuantity,
                        uom: 'PCS',
                        type: 'ABSOLUTE'
                    }
                ],
            };

            (prisma.inventoryAdjustment.findUnique as any).mockResolvedValue(draftAdjustment);
            (prisma.inventory.findMany as any).mockResolvedValue([
                { productId: 'prod-5', quantity: currentStock }
            ]);
            (prisma.inventoryAdjustment.update as any).mockResolvedValue({
                ...draftAdjustment,
                status: 'POSTED',
                items: draftAdjustment.items.map(item => ({
                    ...item,
                    Product: { id: item.productId, name: 'Product 5', baseUOM: 'PCS' }
                }))
            });

            await inventoryAdjustmentService.post('adj-5', mockUserId);

            expect(prisma.inventoryAdjustmentItem.update).toHaveBeenCalledWith({
                where: { id: 'item-5' },
                data: {
                    systemQuantity: currentStock,
                    actualQuantity: expectedActual
                }
            });
        });

        it('should handle ABSOLUTE adjustment to 0 (clearing stock)', async () => {
            // Scenario: Set stock to 0 when current is 75
            const currentStock = 75;
            const targetQuantity = 0;
            const expectedActual = targetQuantity;

            const draftAdjustment = {
                id: 'adj-6',
                status: 'DRAFT',
                warehouseId: 'wh-1',
                adjustmentDate: mockDate,
                adjustmentNumber: 'ADJ-006',
                reason: 'Clear obsolete stock',
                items: [
                    {
                        id: 'item-6',
                        productId: 'prod-6',
                        quantity: targetQuantity,
                        uom: 'PCS',
                        type: 'ABSOLUTE'
                    }
                ],
            };

            (prisma.inventoryAdjustment.findUnique as any).mockResolvedValue(draftAdjustment);
            (prisma.inventory.findMany as any).mockResolvedValue([
                { productId: 'prod-6', quantity: currentStock }
            ]);
            (prisma.inventoryAdjustment.update as any).mockResolvedValue({
                ...draftAdjustment,
                status: 'POSTED',
                items: draftAdjustment.items.map(item => ({
                    ...item,
                    Product: { id: item.productId, name: 'Product 6', baseUOM: 'PCS' }
                }))
            });

            await inventoryAdjustmentService.post('adj-6', mockUserId);

            expect(prisma.inventoryAdjustmentItem.update).toHaveBeenCalledWith({
                where: { id: 'item-6' },
                data: {
                    systemQuantity: currentStock,
                    actualQuantity: expectedActual
                }
            });
        });

        it('should handle ABSOLUTE adjustment when no existing stock', async () => {
            // Scenario: Set stock to 50 when there's no existing inventory
            const currentStock = 0;
            const targetQuantity = 50;
            const expectedActual = targetQuantity;

            const draftAdjustment = {
                id: 'adj-7',
                status: 'DRAFT',
                warehouseId: 'wh-1',
                adjustmentDate: mockDate,
                adjustmentNumber: 'ADJ-007',
                reason: 'Initial count',
                items: [
                    {
                        id: 'item-7',
                        productId: 'prod-7',
                        quantity: targetQuantity,
                        uom: 'PCS',
                        type: 'ABSOLUTE'
                    }
                ],
            };

            (prisma.inventoryAdjustment.findUnique as any).mockResolvedValue(draftAdjustment);
            (prisma.inventory.findMany as any).mockResolvedValue([]); // No existing stock
            (prisma.inventoryAdjustment.update as any).mockResolvedValue({
                ...draftAdjustment,
                status: 'POSTED',
                items: draftAdjustment.items.map(item => ({
                    ...item,
                    Product: { id: item.productId, name: 'Product 7', baseUOM: 'PCS' }
                }))
            });

            await inventoryAdjustmentService.post('adj-7', mockUserId);

            expect(prisma.inventoryAdjustmentItem.update).toHaveBeenCalledWith({
                where: { id: 'item-7' },
                data: {
                    systemQuantity: currentStock,
                    actualQuantity: expectedActual
                }
            });
        });
    });

    describe('Mixed Adjustments (ABSOLUTE and RELATIVE in same slip)', () => {
        it('should correctly process both ABSOLUTE and RELATIVE adjustments together', async () => {
            const draftAdjustment = {
                id: 'adj-8',
                status: 'DRAFT',
                warehouseId: 'wh-1',
                adjustmentDate: mockDate,
                adjustmentNumber: 'ADJ-008',
                reason: 'Mixed adjustment',
                items: [
                    {
                        id: 'item-8a',
                        productId: 'prod-8a',
                        quantity: 25,  // RELATIVE: add 25
                        uom: 'PCS',
                        type: 'RELATIVE'
                    },
                    {
                        id: 'item-8b',
                        productId: 'prod-8b',
                        quantity: 100, // ABSOLUTE: set to 100
                        uom: 'PCS',
                        type: 'ABSOLUTE'
                    }
                ],
            };

            (prisma.inventoryAdjustment.findUnique as any).mockResolvedValue(draftAdjustment);
            (prisma.inventory.findMany as any).mockResolvedValue([
                { productId: 'prod-8a', quantity: 60 },
                { productId: 'prod-8b', quantity: 75 }
            ]);
            (prisma.inventoryAdjustment.update as any).mockResolvedValue({
                ...draftAdjustment,
                status: 'POSTED',
                items: draftAdjustment.items.map(item => ({
                    ...item,
                    Product: { id: item.productId, name: `Product ${item.productId}`, baseUOM: 'PCS' }
                }))
            });

            await inventoryAdjustmentService.post('adj-8', mockUserId);

            // Verify RELATIVE: 60 + 25 = 85
            expect(prisma.inventoryAdjustmentItem.update).toHaveBeenCalledWith({
                where: { id: 'item-8a' },
                data: {
                    systemQuantity: 60,
                    actualQuantity: 85
                }
            });

            // Verify ABSOLUTE: set to 100
            expect(prisma.inventoryAdjustmentItem.update).toHaveBeenCalledWith({
                where: { id: 'item-8b' },
                data: {
                    systemQuantity: 75,
                    actualQuantity: 100
                }
            });

            // Verify both sent to inventory service
            expect(inventoryService.adjustStockBatch).toHaveBeenCalledWith(
                expect.objectContaining({
                    items: expect.arrayContaining([
                        expect.objectContaining({
                            productId: 'prod-8a',
                            quantity: 25,
                            adjustmentType: 'RELATIVE'
                        }),
                        expect.objectContaining({
                            productId: 'prod-8b',
                            quantity: 100,
                            adjustmentType: 'ABSOLUTE'
                        })
                    ])
                }),
                expect.anything()
            );
        });
    });

    describe('Edge Cases', () => {
        it('should handle ABSOLUTE adjustment with same value as current stock', async () => {
            // Scenario: Set to 50 when current is already 50 (no change)
            const currentStock = 50;
            const targetQuantity = 50;

            const draftAdjustment = {
                id: 'adj-9',
                status: 'DRAFT',
                warehouseId: 'wh-1',
                adjustmentDate: mockDate,
                adjustmentNumber: 'ADJ-009',
                reason: 'Verification',
                items: [
                    {
                        id: 'item-9',
                        productId: 'prod-9',
                        quantity: targetQuantity,
                        uom: 'PCS',
                        type: 'ABSOLUTE'
                    }
                ],
            };

            (prisma.inventoryAdjustment.findUnique as any).mockResolvedValue(draftAdjustment);
            (prisma.inventory.findMany as any).mockResolvedValue([
                { productId: 'prod-9', quantity: currentStock }
            ]);
            (prisma.inventoryAdjustment.update as any).mockResolvedValue({
                ...draftAdjustment,
                status: 'POSTED',
                items: draftAdjustment.items.map(item => ({
                    ...item,
                    Product: { id: item.productId, name: 'Product 9', baseUOM: 'PCS' }
                }))
            });

            await inventoryAdjustmentService.post('adj-9', mockUserId);

            expect(prisma.inventoryAdjustmentItem.update).toHaveBeenCalledWith({
                where: { id: 'item-9' },
                data: {
                    systemQuantity: currentStock,
                    actualQuantity: targetQuantity
                }
            });
        });

        it('should handle RELATIVE adjustment of 0 (no change)', async () => {
            // Scenario: Add 0 units (edge case)
            const currentStock = 100;
            const relativeChange = 0;

            const draftAdjustment = {
                id: 'adj-10',
                status: 'DRAFT',
                warehouseId: 'wh-1',
                adjustmentDate: mockDate,
                adjustmentNumber: 'ADJ-010',
                reason: 'Test',
                items: [
                    {
                        id: 'item-10',
                        productId: 'prod-10',
                        quantity: relativeChange,
                        uom: 'PCS',
                        type: 'RELATIVE'
                    }
                ],
            };

            (prisma.inventoryAdjustment.findUnique as any).mockResolvedValue(draftAdjustment);
            (prisma.inventory.findMany as any).mockResolvedValue([
                { productId: 'prod-10', quantity: currentStock }
            ]);
            (prisma.inventoryAdjustment.update as any).mockResolvedValue({
                ...draftAdjustment,
                status: 'POSTED',
                items: draftAdjustment.items.map(item => ({
                    ...item,
                    Product: { id: item.productId, name: 'Product 10', baseUOM: 'PCS' }
                }))
            });

            await inventoryAdjustmentService.post('adj-10', mockUserId);

            expect(prisma.inventoryAdjustmentItem.update).toHaveBeenCalledWith({
                where: { id: 'item-10' },
                data: {
                    systemQuantity: currentStock,
                    actualQuantity: currentStock // No change
                }
            });
        });
    });
});
