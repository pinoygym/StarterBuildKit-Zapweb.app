import { describe, it, expect, vi, beforeEach } from 'vitest';
import { InventoryService } from '@/services/inventory.service';
import { inventoryRepository } from '@/repositories/inventory.repository';
import { productService } from '@/services/product.service';
import { prisma } from '@/lib/prisma';

// Mock dependencies
vi.mock('@/repositories/inventory.repository', () => ({
    inventoryRepository: {
        findInventory: vi.fn(),
        findAllMovements: vi.fn(),
        getTotalStockByProduct: vi.fn(),
    },
}));

vi.mock('@/services/product.service', () => ({
    productService: {
        getProductById: vi.fn(),
    },
}));

vi.mock('@/lib/prisma', () => ({
    prisma: {
        $transaction: vi.fn((callback) => callback(prisma)),
        inventory: {
            findMany: vi.fn(),
            findUnique: vi.fn(),
            upsert: vi.fn(),
            update: vi.fn(),
        },
        stockMovement: {
            create: vi.fn(),
        },
        warehouse: {
            findUnique: vi.fn(),
        },
        product: {
            update: vi.fn(),
        },
    },
}));

describe('InventoryService', () => {
    let service: InventoryService;

    beforeEach(() => {
        vi.clearAllMocks();
        service = new InventoryService();
    });

    describe('convertToBaseUOM', () => {
        it('should return quantity as is if UOM matches base UOM', async () => {
            const productId = 'product-1';
            const quantity = 10;
            const uom = 'Piece';
            const product = { id: productId, baseUOM: 'Piece', alternateUOMs: [] };

            vi.mocked(productService.getProductById).mockResolvedValue(product as any);

            const result = await service.convertToBaseUOM(productId, quantity, uom);

            expect(result).toBe(quantity);
        });

        it('should convert quantity if UOM is alternate UOM', async () => {
            const productId = 'product-1';
            const quantity = 2;
            const uom = 'Box';
            const product = {
                id: productId,
                baseUOM: 'Piece',
                alternateUOMs: [{ name: 'Box', conversionFactor: 10 }],
            };

            vi.mocked(productService.getProductById).mockResolvedValue(product as any);

            const result = await service.convertToBaseUOM(productId, quantity, uom);

            expect(result).toBe(20);
        });

        it('should throw error if UOM not found', async () => {
            const productId = 'product-1';
            const product = { id: productId, baseUOM: 'Piece', alternateUOMs: [] };

            vi.mocked(productService.getProductById).mockResolvedValue(product as any);

            await expect(service.convertToBaseUOM(productId, 1, 'Unknown')).rejects.toThrow('UOM \'Unknown\' not found');
        });
    });

    describe('addStock', () => {
        it('should add stock successfully', async () => {
            const input = {
                productId: 'product-1',
                warehouseId: 'warehouse-1',
                quantity: 10,
                uom: 'Piece',
                referenceId: 'ref-1',
                referenceType: 'PO',
            };
            const product = { id: 'product-1', baseUOM: 'Piece', alternateUOMs: [] };

            vi.mocked(productService.getProductById).mockResolvedValue(product as any);
            vi.mocked(prisma.inventory.findUnique).mockResolvedValue({ quantity: 50 } as any);
            vi.mocked(prisma.inventory.upsert).mockResolvedValue({ quantity: 60 } as any);
            vi.mocked(inventoryRepository.getTotalStockByProduct).mockResolvedValue(50);

            await service.addStock(input as any);

            expect(prisma.inventory.upsert).toHaveBeenCalledWith(expect.objectContaining({
                where: { productId_warehouseId: { productId: 'product-1', warehouseId: 'warehouse-1' } },
                update: { quantity: 60 },
            }));
            expect(prisma.stockMovement.create).toHaveBeenCalledWith(expect.objectContaining({
                data: expect.objectContaining({
                    type: 'IN',
                    quantity: 10,
                })
            }));
        });
    });

    describe('deductStock', () => {
        it('should deduct stock successfully', async () => {
            const input = {
                productId: 'product-1',
                warehouseId: 'warehouse-1',
                quantity: 5,
                uom: 'Piece',
            };
            const product = { id: 'product-1', baseUOM: 'Piece', alternateUOMs: [] };

            vi.mocked(productService.getProductById).mockResolvedValue(product as any);
            vi.mocked(inventoryRepository.findInventory).mockResolvedValue({ quantity: 10 } as any);
            vi.mocked(prisma.inventory.update).mockResolvedValue({ quantity: 5 } as any);

            await service.deductStock(input as any);

            expect(prisma.inventory.update).toHaveBeenCalled();
            expect(prisma.stockMovement.create).toHaveBeenCalledWith(expect.objectContaining({
                data: expect.objectContaining({
                    type: 'OUT',
                    quantity: 5,
                })
            }));
        });

        it('should throw error if insufficient stock', async () => {
            const input = {
                productId: 'product-1',
                warehouseId: 'warehouse-1',
                quantity: 20,
                uom: 'Piece',
            };
            const product = { id: 'product-1', baseUOM: 'Piece', alternateUOMs: [], name: 'Product 1' };

            vi.mocked(productService.getProductById).mockResolvedValue(product as any);
            vi.mocked(inventoryRepository.findInventory).mockResolvedValue({ quantity: 10 } as any);

            await expect(service.deductStock(input as any)).rejects.toThrow();
        });
    });

    describe('transferStock', () => {
        it('should transfer stock successfully', async () => {
            const input = {
                productId: 'product-1',
                sourceWarehouseId: 'warehouse-1',
                destinationWarehouseId: 'warehouse-2',
                quantity: 5,
                uom: 'Piece',
            };
            const product = { id: 'product-1', baseUOM: 'Piece', alternateUOMs: [] };

            vi.mocked(productService.getProductById).mockResolvedValue(product as any);
            vi.mocked(inventoryRepository.findInventory).mockResolvedValue({ quantity: 10 } as any);

            await service.transferStock(input as any);

            expect(prisma.inventory.update).toHaveBeenCalled(); // Deduct from source
            expect(prisma.inventory.upsert).toHaveBeenCalled(); // Add to destination
            expect(prisma.stockMovement.create).toHaveBeenCalledTimes(2); // OUT and IN
        });
    });
});
