import { ProductService } from '../productService';
import { setupTestEnvironment, TestDataFactory } from '../../test-utils';
import { ProductCreateInput, ProductUpdateInput } from '../../types';

// Mock the optimizedAPI module
jest.mock('../optimizedAPI', () => ({
  optimizedAPI: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
    invalidateCache: jest.fn(),
  },
}));

// Mock the database service
jest.mock('../database/databaseService', () => ({
  databaseService: {
    initialize: jest.fn().mockResolvedValue(undefined),
    findAll: jest.fn(),
    findById: jest.fn(),
    insert: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    execute: jest.fn(),
    addSyncOperation: jest.fn(),
  },
}));

describe('ProductService', () => {
  let productService: ProductService;
  let env: any;

  beforeEach(async () => {
    env = setupTestEnvironment();
    await env.dbHelper.setup();
    productService = new ProductService();
  });

  describe('getProducts', () => {
    it('should return products from API when online', async () => {
      // Arrange
      const mockProducts = [
        TestDataFactory.createProduct({ id: '1', name: 'Test Product 1' }),
        TestDataFactory.createProduct({ id: '2', name: 'Test Product 2' }),
      ];
      
      env.apiHelper.setupSuccessResponse('/products?limit=50&offset=0', mockProducts);

      // Act
      const result = await productService.getProducts();

      // Assert
      expect(result).toEqual(mockProducts);
      expect(env.apiHelper.getCallHistory()).toHaveLength(1);
      expect(env.dbHelper.getCallHistory('findAll')).toHaveLength(1); // Sync to local DB
    });

    it('should return products from local database when offline', async () => {
      // Arrange
      const mockProducts = [
        TestDataFactory.createProduct({ id: '1', name: 'Local Product 1' }),
      ];
      
      env.apiHelper.setupNetworkError();
      await env.dbHelper.seedProducts(mockProducts);

      // Act
      const result = await productService.getProducts();

      // Assert
      expect(result).toEqual(mockProducts);
      expect(env.apiHelper.getCallHistory()).toHaveLength(1); // API attempt
      expect(env.dbHelper.getCallHistory('findAll')).toHaveLength(1); // Fallback to DB
    });

    it('should filter products by category', async () => {
      // Arrange
      const mockProducts = [
        TestDataFactory.createProduct({ id: '1', category: 'Electronics' }),
        TestDataFactory.createProduct({ id: '2', category: 'Food' }),
      ];
      
      env.apiHelper.setupSuccessResponse('/products?limit=50&offset=0&category=Electronics', [mockProducts[0]]);

      // Act
      const result = await productService.getProducts({ category: 'Electronics' });

      // Assert
      expect(result).toEqual([mockProducts[0]]);
      expect(env.apiHelper.getCallHistory()).toHaveLength(1);
    });

    it('should search products by name', async () => {
      // Arrange
      const mockProducts = [
        TestDataFactory.createProduct({ id: '1', name: 'Apple iPhone' }),
        TestDataFactory.createProduct({ id: '2', name: 'Samsung Galaxy' }),
      ];
      
      env.apiHelper.setupSuccessResponse('/products?limit=50&offset=0&search=iPhone', [mockProducts[0]]);

      // Act
      const result = await productService.getProducts({ search: 'iPhone' });

      // Assert
      expect(result).toEqual([mockProducts[0]]);
      expect(env.apiHelper.getCallHistory()).toHaveLength(1);
    });
  });

  describe('getProductById', () => {
    it('should return product from API when online', async () => {
      // Arrange
      const mockProduct = TestDataFactory.createProduct({ id: '1', name: 'Test Product' });
      env.apiHelper.setupSuccessResponse('/products/1', mockProduct);

      // Act
      const result = await productService.getProductById('1');

      // Assert
      expect(result).toEqual(mockProduct);
      expect(env.apiHelper.getCallHistory()).toHaveLength(1);
    });

    it('should return product from local database when offline', async () => {
      // Arrange
      const mockProduct = TestDataFactory.createProduct({ id: '1', name: 'Local Product' });
      env.apiHelper.setupNetworkError();
      await env.dbHelper.seedProducts([mockProduct]);

      // Act
      const result = await productService.getProductById('1');

      // Assert
      expect(result).toEqual(mockProduct);
      expect(env.apiHelper.getCallHistory()).toHaveLength(1);
      expect(env.dbHelper.getCallHistory('findById')).toHaveLength(1);
    });

    it('should return null when product not found', async () => {
      // Arrange
      env.apiHelper.setupErrorResponse('/products/999', { status: 404, message: 'Not found' });

      // Act
      const result = await productService.getProductById('999');

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('createProduct', () => {
    it('should create product via API when online', async () => {
      // Arrange
      const productData: ProductCreateInput = {
        name: 'New Product',
        category: 'Electronics',
        basePrice: 99.99,
        baseUOM: 'pcs',
      };
      
      const expectedProduct = TestDataFactory.createProduct({
        ...productData,
        id: 'new-id',
      });
      
      env.apiHelper.setupPostSuccess('/products', expectedProduct);

      // Act
      const result = await productService.createProduct(productData);

      // Assert
      expect(result).toEqual(expectedProduct);
      expect(env.apiHelper.getCallHistory()).toHaveLength(1);
      expect(env.dbHelper.getCallHistory('insert')).toHaveLength(1); // Add to local DB
    });

    it('should create product locally when offline', async () => {
      // Arrange
      const productData: ProductCreateInput = {
        name: 'Local Product',
        category: 'Food',
        basePrice: 5.99,
        baseUOM: 'kg',
      };
      
      env.apiHelper.setupNetworkError();

      // Act
      const result = await productService.createProduct(productData);

      // Assert
      expect(result.name).toBe(productData.name);
      expect(result.category).toBe(productData.category);
      expect((result as any).syncStatus).toBe('pending_create');
      expect(env.apiHelper.getCallHistory()).toHaveLength(1);
      expect(env.dbHelper.getCallHistory('insert')).toHaveLength(1);
    });

    it('should validate required fields', async () => {
      // Arrange
      const invalidData = {} as ProductCreateInput;

      // Act & Assert
      await expect(productService.createProduct(invalidData)).rejects.toThrow('Product name is required');
    });

    it('should validate negative price', async () => {
      // Arrange
      const invalidData: ProductCreateInput = {
        name: 'Test Product',
        category: 'Electronics',
        basePrice: -10,
        baseUOM: 'pcs',
      };

      // Act & Assert
      await expect(productService.createProduct(invalidData)).rejects.toThrow('Base price cannot be negative');
    });
  });

  describe('updateProduct', () => {
    it('should update product via API when online', async () => {
      // Arrange
      const existingProduct = TestDataFactory.createProduct({ id: '1', name: 'Old Name' });
      const updateData: ProductUpdateInput = { name: 'New Name' };
      const updatedProduct = { ...existingProduct, ...updateData };
      
      env.dbHelper.seedProducts([existingProduct]);
      env.apiHelper.setupPostSuccess('/products/1', updatedProduct);

      // Act
      const result = await productService.updateProduct('1', updateData);

      // Assert
      expect(result.name).toBe('New Name');
      expect(env.apiHelper.getCallHistory()).toHaveLength(1);
      expect(env.dbHelper.getCallHistory('update')).toHaveLength(1);
    });

    it('should update product locally when offline', async () => {
      // Arrange
      const existingProduct = TestDataFactory.createProduct({ id: '1', name: 'Old Name' });
      const updateData: ProductUpdateInput = { name: 'New Name' };
      
      env.dbHelper.seedProducts([existingProduct]);
      env.apiHelper.setOnlineStatus(false);

      // Act
      const result = await productService.updateProduct('1', updateData);

      // Assert
      expect(result.name).toBe('New Name');
      expect((result as any).syncStatus).toBe('pending_update');
      expect(env.apiHelper.getCallHistory()).toHaveLength(1);
      expect(env.dbHelper.getCallHistory('update')).toHaveLength(1);
    });

    it('should throw error when product not found', async () => {
      // Arrange
      const updateData: ProductUpdateInput = { name: 'New Name' };

      // Act & Assert
      await expect(productService.updateProduct('999', updateData)).rejects.toThrow('Product not found');
    });
  });

  describe('deleteProduct', () => {
    it('should delete product via API when online', async () => {
      // Arrange
      const existingProduct = TestDataFactory.createProduct({ id: '1' });
      env.dbHelper.seedProducts([existingProduct]);
      env.apiHelper.setupPostSuccess('/products/1', null);

      // Act
      await productService.deleteProduct('1');

      // Assert
      expect(env.apiHelper.getCallHistory()).toHaveLength(1);
      expect(env.dbHelper.getCallHistory('delete')).toHaveLength(1);
    });

    it('should mark product as deleted locally when offline', async () => {
      // Arrange
      const existingProduct = TestDataFactory.createProduct({ id: '1' });
      env.dbHelper.seedProducts([existingProduct]);
      env.apiHelper.setupNetworkError();

      // Act
      await productService.deleteProduct('1');

      // Assert
      expect(env.apiHelper.getCallHistory()).toHaveLength(1);
      expect(env.dbHelper.getCallHistory('update')).toHaveLength(1); // Mark as deleted
    });
  });

  describe('searchProducts', () => {
    it('should search products via API', async () => {
      // Arrange
      const mockProducts = [
        TestDataFactory.createProduct({ id: '1', name: 'Apple iPhone' }),
      ];
      
      env.apiHelper.setupSuccessResponse('/products/search?q=iPhone&limit=20', mockProducts);

      // Act
      const result = await productService.searchProducts('iPhone');

      // Assert
      expect(result).toEqual(mockProducts);
      expect(env.apiHelper.getCallHistory()).toHaveLength(1);
    });

    it('should search products locally when offline', async () => {
      // Arrange
      const mockProducts = [
        TestDataFactory.createProduct({ id: '1', name: 'Apple iPhone' }),
        TestDataFactory.createProduct({ id: '2', name: 'Samsung Galaxy' }),
      ];
      
      env.apiHelper.setupNetworkError();
      await env.dbHelper.seedProducts(mockProducts);

      // Act
      const result = await productService.searchProducts('iPhone');

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0].name).toContain('iPhone');
    });
  });

  describe('getProductsByCategory', () => {
    it('should return products by category', async () => {
      // Arrange
      const mockProducts = [
        TestDataFactory.createProduct({ id: '1', category: 'Electronics' }),
      ];
      
      env.apiHelper.setupSuccessResponse('/products?limit=50&offset=0&category=Electronics&status=active', mockProducts);

      // Act
      const result = await productService.getProductsByCategory('Electronics');

      // Assert
      expect(result).toEqual(mockProducts);
      expect(env.apiHelper.getCallHistory()).toHaveLength(1);
    });
  });

  describe('getLowStockProducts', () => {
    it('should return low stock products', async () => {
      // Arrange
      const mockProducts = [
        TestDataFactory.createProduct({ id: '1', name: 'Low Stock Item' }),
      ];
      
      env.apiHelper.setupSuccessResponse('/products/low-stock?threshold=10', mockProducts);

      // Act
      const result = await productService.getLowStockProducts(10);

      // Assert
      expect(result).toEqual(mockProducts);
      expect(env.apiHelper.getCallHistory()).toHaveLength(1);
    });
  });

  describe('validation', () => {
    it('should validate product creation data', async () => {
      // Test missing name
      await expect(productService.createProduct({
        name: '',
        category: 'Test',
        basePrice: 10,
        baseUOM: 'pcs',
      })).rejects.toThrow('Product name is required');

      // Test missing category
      await expect(productService.createProduct({
        name: 'Test',
        category: '',
        basePrice: 10,
        baseUOM: 'pcs',
      })).rejects.toThrow('Product category is required');

      // Test missing UOM
      await expect(productService.createProduct({
        name: 'Test',
        category: 'Test',
        basePrice: 10,
        baseUOM: '',
      })).rejects.toThrow('Base unit of measure is required');
    });

    it('should validate product update data', async () => {
      const existingProduct = TestDataFactory.createProduct({ id: '1' });
      env.dbHelper.seedProducts([existingProduct]);

      // Test negative price
      await expect(productService.updateProduct('1', {
        basePrice: -10,
      })).rejects.toThrow('Base price cannot be negative');

      // Test negative stock level
      await expect(productService.updateProduct('1', {
        minStockLevel: -5,
      })).rejects.toThrow('Minimum stock level cannot be negative');
    });
  });

  describe('caching', () => {
    it('should use cached API responses', async () => {
      // Arrange
      const mockProducts = [
        TestDataFactory.createProduct({ id: '1', name: 'Cached Product' }),
      ];
      
      env.apiHelper.setupSuccessResponse('/products?limit=50&offset=0', mockProducts);

      // Act
      const result = await productService.getProducts();

      // Assert
      expect(result).toEqual(mockProducts);
      expect(env.apiHelper.getCallHistory()).toHaveLength(1);
      // Should not sync to local DB if from cache
      expect(env.dbHelper.getCallHistory('findAll')).toHaveLength(0);
    });

    it('should invalidate cache on product update', async () => {
      // Arrange
      const existingProduct = TestDataFactory.createProduct({ id: '1' });
      const updateData: ProductUpdateInput = { name: 'Updated Name' };
      const updatedProduct = { ...existingProduct, ...updateData };
      
      env.dbHelper.seedProducts([existingProduct]);
      env.apiHelper.setupPutSuccess('/products/1', updatedProduct);

      // Act
      await productService.updateProduct('1', updateData);

      // Assert
      expect(env.apiHelper.getCacheInvalidationCalls()).toContain('product_1');
      expect(env.apiHelper.getCacheInvalidationCalls()).toContain('products');
    });
  });
});