import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ProductService } from '@/services/product.service';
import { productRepository } from '@/repositories/product.repository';
import { DatabaseTestBase, TestUtils } from '@/tests/helpers/test-base';
import { ValidationError, NotFoundError } from '@/lib/errors';

// Mock repository
vi.mock('@/repositories/product.repository');

describe('ProductService', () => {
  let productService: ProductService;
  let dbTestBase: DatabaseTestBase;
  let testProductId: string;

  beforeEach(async () => {
    // Reset all mocks
    vi.clearAllMocks();

    // Initialize database test base
    dbTestBase = new DatabaseTestBase();
    await dbTestBase.setup();

    // Create test product ID
    testProductId = TestUtils.generate.id();

    // Initialize service
    productService = new ProductService();
  });

  afterEach(async () => {
    await dbTestBase.teardown();
  });

  describe('getAllProducts', () => {
    it('should return all products with filters', async () => {
      const mockProducts = [
        TestUtils.generate.product(),
        TestUtils.generate.product(),
      ];

      const mockFindAll = vi.mocked(productRepository.findAll);
      mockFindAll.mockResolvedValue(mockProducts);

      const filters = { category: 'Carbonated' as const, status: 'active' as const };
      const result = await productService.getAllProducts(filters);

      expect(mockFindAll).toHaveBeenCalledWith(filters);
      expect(result).toEqual(mockProducts);
    });

    it('should return all products without filters', async () => {
      const mockProducts = [TestUtils.generate.product()];

      const mockFindAll = vi.mocked(productRepository.findAll);
      mockFindAll.mockResolvedValue(mockProducts);

      const result = await productService.getAllProducts();

      expect(mockFindAll).toHaveBeenCalledWith(undefined);
      expect(result).toEqual(mockProducts);
    });
  });

  describe('getProductById', () => {
    it('should return product when found', async () => {
      const mockProduct = TestUtils.generate.product();

      const mockFindById = vi.mocked(productRepository.findById);
      mockFindById.mockResolvedValue(mockProduct);

      const result = await productService.getProductById(testProductId);

      expect(mockFindById).toHaveBeenCalledWith(testProductId);
      expect(result).toEqual(mockProduct);
    });

    it('should throw NotFoundError when product not found', async () => {
      const mockFindById = vi.mocked(productRepository.findById);
      mockFindById.mockResolvedValue(null);

      await expect(
        productService.getProductById('non-existent-id')
      ).rejects.toThrow(NotFoundError);

      expect(mockFindById).toHaveBeenCalledWith('non-existent-id');
    });
  });

  describe('getActiveProducts', () => {
    it('should return only active products', async () => {
      const mockProducts = [
        TestUtils.generate.product({ status: 'active' }),
        TestUtils.generate.product({ status: 'active' }),
      ];

      const mockFindActive = vi.mocked(productRepository.findActive);
      mockFindActive.mockResolvedValue(mockProducts);

      const result = await productService.getActiveProducts();

      expect(mockFindActive).toHaveBeenCalled();
      expect(result).toEqual(mockProducts);
    });
  });

  describe('createProduct', () => {
    const validProductData = {
      name: 'Test Product',
      description: 'A test product',
      category: 'Carbonated' as const,
      basePrice: 99.99,
      baseUOM: 'PCS',
      minStockLevel: 5,
      shelfLifeDays: 365,
      alternateUOMs: [
        {
          name: 'BOX',
          conversionFactor: 10,
          sellingPrice: 899.99,
        },
      ],
    };

    it('should create product successfully', async () => {
      const mockProduct = {
        ...validProductData,
        id: testProductId,
        status: 'active',
        imageUrl: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        alternateUOMs: validProductData.alternateUOMs,
      };

      const mockFindByName = vi.mocked(productRepository.findByName);
      mockFindByName.mockResolvedValue(null);

      const mockCreate = vi.mocked(productRepository.create);
      mockCreate.mockResolvedValue(mockProduct);

      const result = await productService.createProduct(validProductData);

      expect(mockFindByName).toHaveBeenCalledWith(validProductData.name);
      expect(mockCreate).toHaveBeenCalled();
      expect(result).toEqual(mockProduct);
    });

    it('should throw ValidationError for invalid data', async () => {
      const invalidData = {
        name: '', // Invalid: empty name
        basePrice: -10, // Invalid: negative price
        baseUOM: 'INVALID', // Invalid: not in enum
      };

      await expect(
        productService.createProduct(invalidData as any)
      ).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError when product name already exists', async () => {
      const mockFindByName = vi.mocked(productRepository.findByName);
      mockFindByName.mockResolvedValue({} as any);

      await expect(
        productService.createProduct(validProductData)
      ).rejects.toThrow(ValidationError);

      expect(mockFindByName).toHaveBeenCalledWith(validProductData.name);
    });

    it('should throw ValidationError when base UOM conflicts with alternate UOMs', async () => {
      const invalidData = {
        ...validProductData,
        baseUOM: 'BOX',
        alternateUOMs: [
          {
            name: 'BOX', // Same as base UOM
            conversionFactor: 10,
            sellingPrice: 899.99,
          },
        ],
      };

      await expect(
        productService.createProduct(invalidData)
      ).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError when alternate UOMs have duplicates', async () => {
      const invalidData = {
        ...validProductData,
        alternateUOMs: [
          {
            name: 'BOX',
            conversionFactor: 10,
            sellingPrice: 899.99,
          },
          {
            name: 'BOX', // Duplicate name
            conversionFactor: 5,
            sellingPrice: 499.99,
          },
        ],
      };

      await expect(
        productService.createProduct(invalidData)
      ).rejects.toThrow(ValidationError);
    });
  });

  describe('updateProduct', () => {
    const updateData = {
      name: 'Updated Product Name',
      description: 'Updated description',
      basePrice: 149.99,
      minStockLevel: 10,
    };

    it('should update product successfully', async () => {
      const existingProduct = {
        id: testProductId,
        name: 'Original Name',
        baseUOM: 'PCS',
        alternateUOMs: [],
      };

      const updatedProduct = {
        ...existingProduct,
        ...updateData,
        updatedAt: new Date(),
      };

      const mockFindById = vi.mocked(productRepository.findById);
      mockFindById.mockResolvedValue(existingProduct as any);

      const mockFindByName = vi.mocked(productRepository.findByName);
      mockFindByName.mockResolvedValue(null);

      const mockUpdate = vi.mocked(productRepository.update);
      mockUpdate.mockResolvedValue(updatedProduct as any);

      const result = await productService.updateProduct(testProductId, updateData);

      expect(mockFindById).toHaveBeenCalledWith(testProductId);
      expect(mockUpdate).toHaveBeenCalled();
      expect(result).toEqual(updatedProduct);
    });

    it('should throw NotFoundError when product not found', async () => {
      const mockFindById = vi.mocked(productRepository.findById);
      mockFindById.mockResolvedValue(null);

      await expect(
        productService.updateProduct('non-existent-id', updateData)
      ).rejects.toThrow(NotFoundError);
    });

    it('should throw ValidationError for invalid update data', async () => {
      const existingProduct = {
        id: testProductId,
        name: 'Original Name',
        baseUOM: 'PCS',
        alternateUOMs: [],
      };

      const mockFindById = vi.mocked(productRepository.findById);
      mockFindById.mockResolvedValue(existingProduct as any);

      const invalidData = {
        basePrice: -50, // Invalid: negative price
      };

      await expect(
        productService.updateProduct(testProductId, invalidData as any)
      ).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError when updating to existing product name', async () => {
      const existingProduct = {
        id: testProductId,
        name: 'Original Name',
        baseUOM: 'PCS',
        alternateUOMs: [],
      };

      const mockFindById = vi.mocked(productRepository.findById);
      mockFindById.mockResolvedValue(existingProduct as any);

      const mockFindByName = vi.mocked(productRepository.findByName);
      mockFindByName.mockResolvedValue({} as any);

      await expect(
        productService.updateProduct(testProductId, updateData)
      ).rejects.toThrow(ValidationError);
    });

    it('should validate UOM configuration during update', async () => {
      const existingProduct = {
        id: testProductId,
        name: 'Original Name',
        baseUOM: 'PCS',
        alternateUOMs: [],
      };

      const mockFindById = vi.mocked(productRepository.findById);
      mockFindById.mockResolvedValue(existingProduct as any);

      const invalidUOMData = {
        alternateUOMs: [
          {
            name: 'PCS', // Conflicts with base UOM
            conversionFactor: 1,
            sellingPrice: 99.99,
          },
        ],
      };

      await expect(
        productService.updateProduct(testProductId, invalidUOMData)
      ).rejects.toThrow(ValidationError);
    });
  });

  describe('deleteProduct', () => {
    it('should delete inactive product successfully', async () => {
      const inactiveProduct = {
        id: testProductId,
        name: 'Inactive Product',
        status: 'inactive',
      };

      const mockFindById = vi.mocked(productRepository.findById);
      mockFindById.mockResolvedValue(inactiveProduct as any);

      const mockDelete = vi.mocked(productRepository.delete);
      mockDelete.mockResolvedValue(undefined);

      await productService.deleteProduct(testProductId);

      expect(mockFindById).toHaveBeenCalledWith(testProductId);
      expect(mockDelete).toHaveBeenCalledWith(testProductId);
    });

    it('should throw NotFoundError when product not found', async () => {
      const mockFindById = vi.mocked(productRepository.findById);
      mockFindById.mockResolvedValue(null);

      await expect(
        productService.deleteProduct('non-existent-id')
      ).rejects.toThrow(NotFoundError);
    });

    it('should throw ValidationError when trying to delete active product', async () => {
      const activeProduct = {
        id: testProductId,
        name: 'Active Product',
        status: 'active',
      };

      const mockFindById = vi.mocked(productRepository.findById);
      mockFindById.mockResolvedValue(activeProduct as any);

      await expect(
        productService.deleteProduct(testProductId)
      ).rejects.toThrow(ValidationError);
    });
  });

  describe('toggleProductStatus', () => {
    it('should activate inactive product', async () => {
      const inactiveProduct = {
        id: testProductId,
        name: 'Inactive Product',
        status: 'inactive',
      };

      const activatedProduct = {
        ...inactiveProduct,
        status: 'active',
      };

      const mockFindById = vi.mocked(productRepository.findById);
      mockFindById.mockResolvedValue(inactiveProduct as any);

      const mockUpdateStatus = vi.mocked(productRepository.updateStatus);
      mockUpdateStatus.mockResolvedValue(activatedProduct as any);

      const result = await productService.toggleProductStatus(testProductId);

      expect(mockUpdateStatus).toHaveBeenCalledWith(testProductId, 'active');
      expect(result.status).toBe('active');
    });

    it('should deactivate active product', async () => {
      const activeProduct = {
        id: testProductId,
        name: 'Active Product',
        status: 'active',
      };

      const deactivatedProduct = {
        ...activeProduct,
        status: 'inactive',
      };

      const mockFindById = vi.mocked(productRepository.findById);
      mockFindById.mockResolvedValue(activeProduct as any);

      const mockUpdateStatus = vi.mocked(productRepository.updateStatus);
      mockUpdateStatus.mockResolvedValue(deactivatedProduct as any);

      const result = await productService.toggleProductStatus(testProductId);

      expect(mockUpdateStatus).toHaveBeenCalledWith(testProductId, 'inactive');
      expect(result.status).toBe('inactive');
    });
  });

  describe('getProductUOMs', () => {
    it('should return all UOMs for product', async () => {
      const mockProduct = {
        id: testProductId,
        name: 'Test Product',
        baseUOM: 'PCS',
        basePrice: 99.99,
        alternateUOMs: [
          {
            name: 'BOX',
            sellingPrice: 899.99,
          },
          {
            name: 'PACK',
            sellingPrice: 199.99,
          },
        ],
      };

      const mockFindById = vi.mocked(productRepository.findById);
      mockFindById.mockResolvedValue(mockProduct as any);

      const result = await productService.getProductUOMs(testProductId);

      expect(result).toEqual([
        { name: 'PCS', sellingPrice: 99.99 },
        { name: 'BOX', sellingPrice: 899.99 },
        { name: 'PACK', sellingPrice: 199.99 },
      ]);
    });
  });

  describe('getUOMSellingPrice', () => {
    it('should return base UOM selling price', async () => {
      const mockProduct = {
        id: testProductId,
        name: 'Test Product',
        baseUOM: 'PCS',
        basePrice: 99.99,
        alternateUOMs: [],
      };

      const mockFindById = vi.mocked(productRepository.findById);
      mockFindById.mockResolvedValue(mockProduct as any);

      const result = await productService.getUOMSellingPrice(testProductId, 'PCS');

      expect(result).toBe(99.99);
    });

    it('should return alternate UOM selling price', async () => {
      const mockProduct = {
        id: testProductId,
        name: 'Test Product',
        baseUOM: 'PCS',
        basePrice: 99.99,
        alternateUOMs: [
          {
            name: 'BOX',
            sellingPrice: 899.99,
          },
        ],
      };

      const mockFindById = vi.mocked(productRepository.findById);
      mockFindById.mockResolvedValue(mockProduct as any);

      const result = await productService.getUOMSellingPrice(testProductId, 'BOX');

      expect(result).toBe(899.99);
    });

    it('should return alternate UOM selling price case insensitive', async () => {
      const mockProduct = {
        id: testProductId,
        name: 'Test Product',
        baseUOM: 'PCS',
        basePrice: 99.99,
        alternateUOMs: [
          {
            name: 'BOX',
            sellingPrice: 899.99,
          },
        ],
      };

      const mockFindById = vi.mocked(productRepository.findById);
      mockFindById.mockResolvedValue(mockProduct as any);

      const result = await productService.getUOMSellingPrice(testProductId, 'box');

      expect(result).toBe(899.99);
    });

    it('should throw ValidationError for invalid UOM', async () => {
      const mockProduct = {
        id: testProductId,
        name: 'Test Product',
        baseUOM: 'PCS',
        basePrice: 99.99,
        alternateUOMs: [],
      };

      const mockFindById = vi.mocked(productRepository.findById);
      mockFindById.mockResolvedValue(mockProduct as any);

      await expect(
        productService.getUOMSellingPrice(testProductId, 'INVALID')
      ).rejects.toThrow(ValidationError);
    });
  });
});
