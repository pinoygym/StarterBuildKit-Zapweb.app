import { describe, it, expect, beforeEach, vi } from 'vitest';
import { inventoryService } from '@/services/inventory.service';
import { productService } from '@/services/product.service';
import { prisma } from '@/lib/prisma';
import { AddStockInput } from '@/types/inventory.types';
import { randomUUID } from 'crypto';

// Mock dependencies
vi.mock('@/lib/prisma', () => ({
    prisma: {
        $transaction: vi.fn(),
        inventory: {
            findUnique: vi.fn(),
            upsert: vi.fn(),
        },
        product: {
            update: vi.fn(),
        },
        stockMovement: {
            create: vi.fn(),
        },
    },
}));

vi.mock('@/services/product.service', () => ({
    productService: {
        getProductById: vi.fn(),
    },
}));

vi.mock('@/repositories/inventory.repository', () => ({
    inventoryRepository: {
        getTotalStockByProduct: vi.fn(),
    },
}));

describe('Inventory Service - Average Cost Calculation', () => {
    const mockProductId = 'product-123';
    const mockWarehouseId = 'warehouse-123';

    const mockProduct = {
        id: mockProductId,
        name: 'Test Product',
        baseUOM: 'bottle',
        averageCostPrice: 0,
        alternateUOMs: [
            {
                id: 'uom-1',
                name: 'case',
                conversionFactor: 10, // 1 case = 10 bottles
            },
        ],
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should calculate average cost correctly for first stock entry', async () => {
        // Arrange
        const stockInput: AddStockInput = {
            productId: mockProductId,
            warehouseId: mockWarehouseId,
            quantity: 100,
            uom: 'bottle',
            unitCost: 10, // ₱10 per bottle
            reason: 'Initial stock',
            referenceType: 'RV',
        };

        (productService.getProductById as any).mockResolvedValue(mockProduct);

        // Mock total stock = 0 (first entry)
        const { inventoryRepository } = await import('@/repositories/inventory.repository');
        (inventoryRepository.getTotalStockByProduct as any).mockResolvedValue(0);

        let capturedAverageCost: number | undefined;

        (prisma.$transaction as any).mockImplementation(async (callback: any) => {
            const mockTx = {
                inventory: {
                    findUnique: vi.fn().mockResolvedValue(null),
                    upsert: vi.fn().mockResolvedValue({ productId: mockProductId, quantity: 100 }),
                },
                product: {
                    update: vi.fn().mockImplementation(({ data }: any) => {
                        capturedAverageCost = data.averageCostPrice;
                        return Promise.resolve({ id: mockProductId });
                    }),
                },
                stockMovement: {
                    create: vi.fn().mockResolvedValue({}),
                },
            };
            return callback(mockTx);
        });

        // Act
        await inventoryService.addStock(stockInput);

        // Assert
        expect(capturedAverageCost).toBe(10); // First entry should use the purchase cost
    });

    it('should calculate weighted average cost for multiple purchases', async () => {
        // Scenario: 
        // Current: 100 bottles @ ₱10 = ₱1,000 total value
        // New purchase: 50 bottles @ ₱12 = ₱600
        // Expected average: (1,000 + 600) / (100 + 50) = ₱10.67

        const stockInput: AddStockInput = {
            productId: mockProductId,
            warehouseId: mockWarehouseId,
            quantity: 50,
            uom: 'bottle',
            unitCost: 12, // ₱12 per bottle
            reason: 'Second purchase',
            referenceType: 'RV',
        };

        const productWithCost = { ...mockProduct, averageCostPrice: 10 };
        (productService.getProductById as any).mockResolvedValue(productWithCost);

        // Mock total stock = 100 bottles
        const { inventoryRepository } = await import('@/repositories/inventory.repository');
        (inventoryRepository.getTotalStockByProduct as any).mockResolvedValue(100);

        let capturedAverageCost: number | undefined;

        (prisma.$transaction as any).mockImplementation(async (callback: any) => {
            const mockTx = {
                inventory: {
                    findUnique: vi.fn().mockResolvedValue({ quantity: 100 }),
                    upsert: vi.fn().mockResolvedValue({ productId: mockProductId, quantity: 150 }),
                },
                product: {
                    update: vi.fn().mockImplementation(({ data }: any) => {
                        capturedAverageCost = data.averageCostPrice;
                        return Promise.resolve({ id: mockProductId });
                    }),
                },
                stockMovement: {
                    create: vi.fn().mockResolvedValue({}),
                },
            };
            return callback(mockTx);
        });

        // Act
        await inventoryService.addStock(stockInput);

        // Assert
        const expectedAverage = (10 * 100 + 12 * 50) / (100 + 50);
        expect(capturedAverageCost).toBeCloseTo(expectedAverage, 2); // ≈ 10.67
    });

    it('should convert UOM cost correctly when receiving in alternate UOM', async () => {
        // Scenario: Receive 1 case @ ₱100
        // 1 case = 10 bottles, so base cost = ₱100 / 10 = ₱10 per bottle
        // Current: 0 bottles
        // Expected average: ₱10 per bottle

        const stockInput: AddStockInput = {
            productId: mockProductId,
            warehouseId: mockWarehouseId,
            quantity: 1,
            uom: 'case', // Alternate UOM
            unitCost: 100, // ₱100 per case
            reason: 'Purchase in cases',
            referenceType: 'RV',
        };

        (productService.getProductById as any).mockResolvedValue(mockProduct);

        // Mock total stock = 0 (first entry)
        const { inventoryRepository } = await import('@/repositories/inventory.repository');
        (inventoryRepository.getTotalStockByProduct as any).mockResolvedValue(0);

        let capturedAverageCost: number | undefined;

        (prisma.$transaction as any).mockImplementation(async (callback: any) => {
            const mockTx = {
                inventory: {
                    findUnique: vi.fn().mockResolvedValue(null),
                    upsert: vi.fn().mockResolvedValue({ productId: mockProductId, quantity: 10 }), // 1 case = 10 bottles
                },
                product: {
                    update: vi.fn().mockImplementation(({ data }: any) => {
                        capturedAverageCost = data.averageCostPrice;
                        return Promise.resolve({ id: mockProductId });
                    }),
                },
                stockMovement: {
                    create: vi.fn().mockResolvedValue({}),
                },
            };
            return callback(mockTx);
        });

        // Act
        await inventoryService.addStock(stockInput);

        // Assert
        // Base unit cost should be ₱100 / 10 = ₱10 per bottle
        expect(capturedAverageCost).toBe(10);
    });

    it('should calculate weighted average with UOM conversion', async () => {
        // Scenario:
        // Current: 100 bottles @ ₱10 = ₱1,000
        // New: 1 case @ ₱150 (1 case = 10 bottles, so ₱15/bottle)
        // Expected: (1,000 + 150) / (100 + 10) = ₱10.45

        const stockInput: AddStockInput = {
            productId: mockProductId,
            warehouseId: mockWarehouseId,
            quantity: 1,
            uom: 'case',
            unitCost: 150, // ₱150 per case
            reason: 'Purchase in cases',
            referenceType: 'RV',
        };

        const productWithCost = { ...mockProduct, averageCostPrice: 10 };
        (productService.getProductById as any).mockResolvedValue(productWithCost);

        // Mock total stock = 100 bottles
        const { inventoryRepository } = await import('@/repositories/inventory.repository');
        (inventoryRepository.getTotalStockByProduct as any).mockResolvedValue(100);

        let capturedAverageCost: number | undefined;

        (prisma.$transaction as any).mockImplementation(async (callback: any) => {
            const mockTx = {
                inventory: {
                    findUnique: vi.fn().mockResolvedValue({ quantity: 100 }),
                    upsert: vi.fn().mockResolvedValue({ productId: mockProductId, quantity: 110 }),
                },
                product: {
                    update: vi.fn().mockImplementation(({ data }: any) => {
                        capturedAverageCost = data.averageCostPrice;
                        return Promise.resolve({ id: mockProductId });
                    }),
                },
                stockMovement: {
                    create: vi.fn().mockResolvedValue({}),
                },
            };
            return callback(mockTx);
        });

        // Act
        await inventoryService.addStock(stockInput);

        // Assert
        // Base unit cost = ₱150 / 10 = ₱15 per bottle
        // Weighted average = (10 * 100 + 15 * 10) / 110 = 1150 / 110 ≈ 10.45
        const expectedAverage = (10 * 100 + 15 * 10) / 110;
        expect(capturedAverageCost).toBeCloseTo(expectedAverage, 2);
    });

    it('should throw error for invalid unit cost', async () => {
        const stockInput: AddStockInput = {
            productId: mockProductId,
            warehouseId: mockWarehouseId,
            quantity: 50,
            uom: 'bottle',
            unitCost: 0, // Invalid cost
            reason: 'Test',
            referenceType: 'RV',
        };

        (productService.getProductById as any).mockResolvedValue(mockProduct);

        // Act & Assert
        await expect(inventoryService.addStock(stockInput))
            .rejects
            .toThrow('Unit cost must be greater than zero');
    });
});
