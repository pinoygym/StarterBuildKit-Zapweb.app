
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { inventoryService } from '@/services/inventory.service';
import { productService } from '@/services/product.service';
import { inventoryRepository } from '@/repositories/inventory.repository';

// Mock dependencies
vi.mock('@/services/product.service');
vi.mock('@/repositories/inventory.repository');

describe('InventoryService - UOM Handling', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should handle trailing spaces in UOM names correctly', async () => {
        // Arrange
        const productId = 'test-product-id';
        const warehouseId = 'test-warehouse-id';
        const uomWithSpace = '1/2 case ';
        const uomWithoutSpace = '1/2 case';

        const mockProduct = {
            id: productId,
            name: 'Test Product',
            baseUOM: 'bottle',
            basePrice: 10,
            alternateUOMs: [
                {
                    name: uomWithSpace, // DB has space
                    conversionFactor: 12,
                    sellingPrice: 120
                }
            ]
        };

        const mockBatches = [
            {
                quantity: 10,
                unitCost: 5 // Base cost
            }
        ];

        // Mock product service to return product with spaced UOM
        vi.mocked(productService.getProductById).mockResolvedValue(mockProduct as any);

        // Mock inventory repository to return some batches
        vi.mocked(inventoryRepository.findActiveBatches).mockResolvedValue(mockBatches as any);

        // Act
        // Call with trimmed UOM (simulating URL param)
        const cost = await inventoryService.getAverageCostByUOM(productId, warehouseId, uomWithoutSpace);

        // Assert
        // Base cost = 5
        // Conversion factor = 12
        // Expected cost = 5 * 12 = 60
        expect(cost).toBe(60);
        expect(productService.getProductById).toHaveBeenCalledWith(productId);
    });

    it('should handle trailing spaces in product base UOM correctly', async () => {
        // Arrange
        const productId = 'test-product-id';
        const warehouseId = 'test-warehouse-id';
        const baseUomWithSpace = 'bottle ';
        const inputUom = 'bottle';

        const mockProduct = {
            id: productId,
            name: 'Test Product',
            baseUOM: baseUomWithSpace, // DB has space
            basePrice: 10,
            alternateUOMs: []
        };

        const mockBatches = [
            {
                quantity: 10,
                unitCost: 5
            }
        ];

        vi.mocked(productService.getProductById).mockResolvedValue(mockProduct as any);
        vi.mocked(inventoryRepository.findActiveBatches).mockResolvedValue(mockBatches as any);

        // Act
        const cost = await inventoryService.getAverageCostByUOM(productId, warehouseId, inputUom);

        // Assert
        // Should return base cost directly
        expect(cost).toBe(5);
    });
});
