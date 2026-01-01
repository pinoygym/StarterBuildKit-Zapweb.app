import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ProductService } from '@/services/product.service';
import { productRepository } from '@/repositories/product.repository';
import { NotFoundError, ValidationError } from '@/lib/errors';
import { Decimal } from '@prisma/client/runtime/library';

// Mock the repository
vi.mock('@/repositories/product.repository', () => ({
  productRepository: {
    findById: vi.fn(),
    findAll: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    findByName: vi.fn(),
    findActive: vi.fn(),
    updateStatus: vi.fn(),
  }
}));

describe('ProductService', () => {
  let productService: ProductService;
  let mockProductRepository: any;

  beforeEach(() => {
    // Clear all mocks before each test
    vi.clearAllMocks();
    
    productService = new ProductService();
  });

  describe('getProductById', () => {
    it('should return a product when found', async () => {
      const mockProduct = {
        id: '1',
        name: 'Test Product',
        description: null,
        category: 'Beverages',
        imageUrl: null,
        basePrice: new Decimal(100),
        baseUOM: 'pcs',
        minStockLevel: 10,
        shelfLifeDays: 30,
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date(),
        alternateUOMs: [],
      } as any;

      vi.mocked(productRepository.findById).mockResolvedValue(mockProduct);

      const result = await productService.getProductById('1');

      expect(result).toEqual(mockProduct);
      expect(productRepository.findById).toHaveBeenCalledWith('1');
      expect(productRepository.findById).toHaveBeenCalledTimes(1);
    });

    it('should throw NotFoundError when product not found', async () => {
      vi.mocked(productRepository.findById).mockResolvedValue(null);

      await expect(productService.getProductById('999')).rejects.toThrow('Product not found');
      expect(productRepository.findById).toHaveBeenCalledWith('999');
    });
  });

  describe('getAllProducts', () => {
    it('should return all products with filters', async () => {
      const mockProducts = [
        {
          id: '1',
          name: 'Product 1',
          description: null,
          category: 'Beverages',
          imageUrl: null,
          basePrice: new Decimal(50),
          baseUOM: 'pcs',
          minStockLevel: 10,
          shelfLifeDays: 30,
          status: 'active',
          createdAt: new Date(),
          updatedAt: new Date(),
          alternateUOMs: [],
        },
        {
          id: '2',
          name: 'Product 2',
          description: null,
          category: 'Beverages',
          imageUrl: null,
          basePrice: new Decimal(75),
          baseUOM: 'pcs',
          minStockLevel: 10,
          shelfLifeDays: 30,
          status: 'active',
          createdAt: new Date(),
          updatedAt: new Date(),
          alternateUOMs: [],
        },
      ] as any[];

      vi.mocked(productRepository.findAll).mockResolvedValue(mockProducts);

      const result = await productService.getAllProducts({ category: 'Beverages' } as any);

      expect(result).toEqual(mockProducts);
      expect(productRepository.findAll).toHaveBeenCalledWith({ category: 'Beverages' } as any);
    });

    it('should return empty array when no products found', async () => {
      vi.mocked(productRepository.findAll).mockResolvedValue([]);

      const result = await productService.getAllProducts();

      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });
  });

  describe('createProduct', () => {
    it('should create a product successfully', async () => {
      const newProductData = {
        name: 'New Product',
        category: 'Water', // Valid category from enum
        basePrice: 50,
        baseUOM: 'pcs',
        minStockLevel: 10,
        shelfLifeDays: 30,
      };

      const createdProduct = {
        id: '1',
        ...newProductData,
        description: null,
        imageUrl: null,
        basePrice: new Decimal(50),
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date(),
        alternateUOMs: [],
      } as any;

      vi.mocked(productRepository.findByName).mockResolvedValue(null);
      vi.mocked(productRepository.create).mockResolvedValue(createdProduct);

      const result = await productService.createProduct(newProductData as any);

      expect(result).toEqual(createdProduct);
      expect(productRepository.findByName).toHaveBeenCalledWith('New Product');
      expect(productRepository.create).toHaveBeenCalled();
    });

    it('should throw ValidationError when name already exists', async () => {
      const newProductData = {
        name: 'Duplicate Product',
        category: 'Water', // Valid category from enum
        basePrice: 50,
        baseUOM: 'pcs',
        minStockLevel: 10,
        shelfLifeDays: 30,
      };

      vi.mocked(productRepository.findByName).mockResolvedValue({ id: '1', name: 'Duplicate Product' } as any);

      await expect(productService.createProduct(newProductData as any)).rejects.toThrow('Product name already exists');
      expect(productRepository.create).not.toHaveBeenCalled();
    });
  });

  describe('updateProduct', () => {
    it('should update a product successfully', async () => {
      const updateData = {
        name: 'Updated Product',
        basePrice: 150,
      };

      const existingProduct = {
        id: '1',
        name: 'Old Product',
        baseUOM: 'pcs',
        basePrice: new Decimal(100),
        alternateUOMs: [],
      } as any;

      const updatedProduct = {
        ...existingProduct,
        ...updateData,
        basePrice: new Decimal(150),
      };

      vi.mocked(productRepository.findById).mockResolvedValue(existingProduct);
      vi.mocked(productRepository.findByName).mockResolvedValue(null);
      vi.mocked(productRepository.update).mockResolvedValue(updatedProduct);

      const result = await productService.updateProduct('1', updateData);

      expect(result).toEqual(updatedProduct);
      expect(productRepository.findById).toHaveBeenCalledWith('1');
      expect(productRepository.update).toHaveBeenCalled();
    });

    it('should throw NotFoundError when updating non-existent product', async () => {
      vi.mocked(productRepository.findById).mockResolvedValue(null);

      await expect(productService.updateProduct('999', { name: 'Updated' })).rejects.toThrow(
        'Product not found'
      );
      expect(productRepository.update).not.toHaveBeenCalled();
    });
  });

  describe('deleteProduct', () => {
    it('should delete a product successfully', async () => {
      const product = {
        id: '1',
        name: 'Product to Delete',
        status: 'inactive',
      } as any;

      vi.mocked(productRepository.findById).mockResolvedValue(product);
      vi.mocked(productRepository.delete).mockResolvedValue(undefined as any);

      await productService.deleteProduct('1');

      expect(productRepository.findById).toHaveBeenCalledWith('1');
      expect(productRepository.delete).toHaveBeenCalledWith('1');
    });

    it('should throw NotFoundError when deleting non-existent product', async () => {
      vi.mocked(productRepository.findById).mockResolvedValue(null);

      await expect(productService.deleteProduct('999')).rejects.toThrow('Product not found');
      expect(productRepository.delete).not.toHaveBeenCalled();
    });
  });
});
