import { describe, it, expect, vi, beforeEach } from 'vitest';
import { productService } from '@/services/product.service';
import { productRepository } from '@/repositories/product.repository';
import { ValidationError, NotFoundError } from '@/lib/errors';

// Mock dependencies
vi.mock('@/repositories/product.repository', () => ({
  productRepository: {
    findAll: vi.fn(),
    findById: vi.fn(),
    findActive: vi.fn(),
    findByName: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    updateStatus: vi.fn(),
  },
}));

describe('ProductService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createProduct', () => {
    it('should create a product successfully', async () => {
      const input = {
        name: 'Test Product',
        category: 'Water' as const,
        basePrice: 100,
        baseUOM: 'pcs',
        minStockLevel: 10,
        shelfLifeDays: 365,
      };

      vi.mocked(productRepository.findByName).mockResolvedValue(null);
      vi.mocked(productRepository.create).mockResolvedValue({
        id: 'product-1',
        ...input,
        alternateUOMs: [],
      } as any);

      const result = await productService.createProduct(input);

      expect(productRepository.findByName).toHaveBeenCalledWith(input.name);
      expect(productRepository.create).toHaveBeenCalledWith(expect.objectContaining(input));
      expect(result.id).toBe('product-1');
    });

    it('should throw error if product name exists', async () => {
      const input = {
        name: 'Existing Product',
        category: 'Water' as const,
        basePrice: 100,
        baseUOM: 'pcs',
        minStockLevel: 10,
        shelfLifeDays: 365,
      };

      vi.mocked(productRepository.findByName).mockResolvedValue({ id: 'existing' } as any);

      await expect(productService.createProduct(input)).rejects.toThrow(ValidationError);
    });

    it('should throw error if alternate UOM matches base UOM', async () => {
      const input = {
        name: 'Test Product',
        category: 'Water' as const,
        basePrice: 100,
        baseUOM: 'pcs',
        minStockLevel: 10,
        shelfLifeDays: 365,
        alternateUOMs: [{ name: 'pcs', conversionFactor: 1, sellingPrice: 100 }],
      };

      vi.mocked(productRepository.findByName).mockResolvedValue(null);

      await expect(productService.createProduct(input)).rejects.toThrow(ValidationError);
    });
  });

  describe('updateProduct', () => {
    it('should update a product successfully', async () => {
      const id = 'product-1';
      const input = {
        name: 'Updated Product Name',
        basePrice: 150,
      };

      const existingProduct = {
        id,
        name: 'Old Name',
        baseUOM: 'pcs',
        status: 'active',
        alternateUOMs: [],
      };

      vi.mocked(productRepository.findById).mockResolvedValue(existingProduct as any);
      vi.mocked(productRepository.findByName).mockResolvedValue(null);
      vi.mocked(productRepository.update).mockResolvedValue({
        ...existingProduct,
        ...input,
      } as any);

      const result = await productService.updateProduct(id, input);

      expect(productRepository.update).toHaveBeenCalledWith(id, expect.objectContaining(input));
      expect(result.name).toBe(input.name);
    });

    it('should throw error if product not found', async () => {
      vi.mocked(productRepository.findById).mockResolvedValue(null);

      await expect(productService.updateProduct('non-existent', {})).rejects.toThrow(NotFoundError);
    });
  });

  describe('deleteProduct', () => {
    it('should delete inactive product', async () => {
      const id = 'product-1';
      const product = { id, status: 'inactive' };

      vi.mocked(productRepository.findById).mockResolvedValue(product as any);

      await productService.deleteProduct(id);

      expect(productRepository.delete).toHaveBeenCalledWith(id);
    });

    it('should throw error when deleting active product without role', async () => {
      const id = 'product-1';
      const product = { id, status: 'active' };

      vi.mocked(productRepository.findById).mockResolvedValue(product as any);

      await expect(productService.deleteProduct(id)).rejects.toThrow(ValidationError);
    });

    it('should allow deleting active product if Super Admin', async () => {
        const id = 'product-1';
        const product = { id, status: 'active' };
  
        vi.mocked(productRepository.findById).mockResolvedValue(product as any);
  
        await productService.deleteProduct(id, 'Super Admin');
  
        expect(productRepository.delete).toHaveBeenCalledWith(id);
      });
  });

  describe('getProductUOMs', () => {
    it('should return base and alternate UOMs', async () => {
      const product = {
        id: 'product-1',
        baseUOM: 'pcs',
        basePrice: 100,
        alternateUOMs: [
          { name: 'box', sellingPrice: 1000 },
        ],
      };

      vi.mocked(productRepository.findById).mockResolvedValue(product as any);

      const result = await productService.getProductUOMs('product-1');

      expect(result).toHaveLength(2);
      expect(result).toContainEqual({ name: 'pcs', sellingPrice: 100 });
      expect(result).toContainEqual({ name: 'box', sellingPrice: 1000 });
    });
  });
});
