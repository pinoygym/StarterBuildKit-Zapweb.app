import { describe, it, expect, vi, beforeEach } from 'vitest';
import { InventoryService } from '@/services/inventory.service';
import { inventoryRepository } from '@/repositories/inventory.repository';
import { productService } from '@/services/product.service';
import { prisma } from '@/lib/prisma';

// Make a generic mock transaction client accessible globally in this test file
const mockTransactionClient = {
    inventory: {
        findUnique: vi.fn(),
        upsert: vi.fn(),
        update: vi.fn(),
    },
    product: {
        update: vi.fn(),
    },
    stockMovement: {
        create: vi.fn(),
    },
    purchaseOrderItem: {
        update: vi.fn(),
        findMany: vi.fn(),
    },
    accountsPayable: {
        create: vi.fn(),
    },
    receivingVoucher: {
        update: vi.fn(),
        findUnique: vi.fn(),
    },
    purchaseOrder: {
        findUnique: vi.fn(),
        update: vi.fn(),
    }
};

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
        // Mock all top-level prisma methods and $transaction
        $transaction: vi.fn((callback) => callback(mockTransactionClient)), // Use the generic client
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
        purchaseOrder: {
            findUnique: vi.fn(),
            update: vi.fn(),
        },
        purchaseOrderItem: {
            findMany: vi.fn(),
            update: vi.fn(),
        },
        accountsPayable: {
            create: vi.fn(),
        },
        receivingVoucher: {
            update: vi.fn(),
            findUnique: vi.fn(),
        }
    },
}));

describe('InventoryService', () => {
    let service: InventoryService;

    beforeEach(() => {
        vi.clearAllMocks();
        // Clear mocks for the mockTransactionClient as well
        Object.values(mockTransactionClient).forEach((model: any) => {
            Object.values(model).forEach((method: any) => {
                if (typeof method.mockClear === 'function') {
                    method.mockClear();
                }
            });
        });
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
        it('should calculate and update weighted average cost correctly', async () => {
            const initialProductId = 'coca-cola-ltr';
            const initialWarehouseId = 'warehouse-main';
            const initialQuantity = 12;
            const initialAverageCost = 33;
            const newQuantity = 12;
            const newUnitCost = 66; // This is the new cost for the incoming stock

            // Mock initial product state
            vi.mocked(productService.getProductById).mockResolvedValue({
                id: initialProductId,
                name: 'Coca Cola LTR',
                baseUOM: 'LTR',
                averageCostPrice: initialAverageCost,
                alternateUOMs: [],
            } as any);

            // Mock initial inventory state in the specific warehouse for the transaction client
            mockTransactionClient.inventory.findUnique.mockResolvedValueOnce({
                productId: initialProductId,
                warehouseId: initialWarehouseId,
                quantity: initialQuantity,
            } as any);

            // Mock total stock across all warehouses for inventoryRepository
            vi.mocked(inventoryRepository.getTotalStockByProduct).mockResolvedValue(initialQuantity);

            // Mock the product update call within the transaction client
            mockTransactionClient.product.update.mockResolvedValueOnce({});
            mockTransactionClient.inventory.upsert.mockResolvedValueOnce({});
            mockTransactionClient.stockMovement.create.mockResolvedValueOnce({});


            const input = {
                productId: initialProductId,
                warehouseId: initialWarehouseId,
                quantity: newQuantity,
                uom: 'LTR',
                unitCost: newUnitCost,
                referenceId: 'rv-ref-2',
                referenceType: 'RV' as const,
            };

            await service.addStock(input);

            // Expected new average cost: (12 * 33 + 12 * 66) / (12 + 12) = (396 + 792) / 24 = 1188 / 24 = 49.5
            const expectedNewAverageCost = 49.5;

            // Assert that product.update was called with the correct averageCostPrice using the mockTransactionClient
            expect(mockTransactionClient.product.update).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: { id: initialProductId },
                    data: {
                        averageCostPrice: expectedNewAverageCost,
                    },
                })
            );
        });

        it('should add stock successfully', async () => {
            const input = {
                productId: 'product-1',
                warehouseId: 'warehouse-1',
                quantity: 10,
                uom: 'Piece',
                unitCost: 10, // Added unitCost for completeness
                referenceId: 'ref-1',
                referenceType: 'PO' as const,
            };
            const product = { id: 'product-1', baseUOM: 'Piece', alternateUOMs: [], averageCostPrice: 0 };

            vi.mocked(productService.getProductById).mockResolvedValue(product as any);
            // Mock inventory findUnique for the transaction client
            mockTransactionClient.inventory.findUnique.mockResolvedValueOnce({ quantity: 50 } as any);
            // Mock inventoryRepository.getTotalStockByProduct for the service call
            vi.mocked(inventoryRepository.getTotalStockByProduct).mockResolvedValue(50);
            // Mock other prisma calls within the transaction client
            mockTransactionClient.inventory.upsert.mockResolvedValueOnce({ quantity: 60 } as any);
            mockTransactionClient.stockMovement.create.mockResolvedValueOnce({});
            mockTransactionClient.product.update.mockResolvedValueOnce({}); // Needed for average cost update

            await service.addStock(input as any);

            expect(mockTransactionClient.inventory.upsert).toHaveBeenCalledWith(expect.objectContaining({
                where: { productId_warehouseId: { productId: 'product-1', warehouseId: 'warehouse-1' } },
                update: { quantity: 60 },
            }));
            expect(mockTransactionClient.stockMovement.create).toHaveBeenCalledWith(expect.objectContaining({
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
            vi.mocked(inventoryRepository.findInventory).mockResolvedValue({ quantity: 10 } as any); // Used by getCurrentStockLevel
            mockTransactionClient.inventory.update.mockResolvedValueOnce({ quantity: 5 } as any);
            mockTransactionClient.stockMovement.create.mockResolvedValueOnce({});


            await service.deductStock(input as any);

            expect(mockTransactionClient.inventory.update).toHaveBeenCalled();
            expect(mockTransactionClient.stockMovement.create).toHaveBeenCalledWith(expect.objectContaining({
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
            vi.mocked(inventoryRepository.findInventory).mockResolvedValue({ quantity: 10 } as any); // For source stock check

            // Mock prisma calls within the transaction client for transferStock
            mockTransactionClient.inventory.update.mockResolvedValueOnce({}); // Deduct from source
            mockTransactionClient.stockMovement.create.mockResolvedValueOnce({}); // OUT from source
            mockTransactionClient.inventory.upsert.mockResolvedValueOnce({}); // Add to destination
            mockTransactionClient.stockMovement.create.mockResolvedValueOnce({}); // IN to destination


            await service.transferStock(input as any);

            expect(mockTransactionClient.inventory.update).toHaveBeenCalled(); // Deduct from source
            expect(mockTransactionClient.inventory.upsert).toHaveBeenCalled(); // Add to destination
            expect(mockTransactionClient.stockMovement.create).toHaveBeenCalledTimes(2); // OUT and IN
        });
    });
});

