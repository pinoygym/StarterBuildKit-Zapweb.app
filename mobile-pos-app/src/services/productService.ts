import { optimizedAPI } from './optimizedAPI';
import { databaseService } from './database/databaseService';
import { Product, ProductCreateInput, ProductUpdateInput, ProductWithSync } from '../types';

export class ProductService {
  private api = optimizedAPI;
  private db = databaseService;

  /**
   * Get all products with optional filtering
   */
  async getProducts(options: {
    category?: string;
    status?: string;
    search?: string;
    limit?: number;
    offset?: number;
  } = {}): Promise<Product[]> {
    const { category, status, search, limit = 50, offset = 0 } = options;

    try {
      // Try API first if online
      const params = new URLSearchParams({
        limit: limit.toString(),
        offset: offset.toString(),
      });

      if (category) params.append('category', category);
      if (status) params.append('status', status);
      if (search) params.append('search', search);

      const response = await this.api.get<Product[]>(`/products?${params}`, {
        cacheKey: `products_${params.toString()}`,
        cacheTTL: 300000, // 5 minutes
      });

      if (response.data && !response.fromCache) {
        // Update local database with fresh data
        await this.syncProductsToLocal(response.data);
      }

      return response.data || await this.getProductsFromDB(options);
    } catch (error) {
      // Fallback to local database
      console.warn('API failed, using local database:', error);
      return await this.getProductsFromDB(options);
    }
  }

  /**
   * Get product by ID
   */
  async getProductById(id: string): Promise<Product | null> {
    try {
      // Try API first
      const response = await this.api.get<Product>(`/products/${id}`, {
        cacheKey: `product_${id}`,
        cacheTTL: 600000, // 10 minutes
      });

      if (response.data && !response.fromCache) {
        // Update local database
        await this.updateProductInDB(response.data);
      }

      return response.data || await this.getProductFromDB(id);
    } catch (error) {
      // Fallback to local database
      console.warn('API failed, using local database:', error);
      return await this.getProductFromDB(id);
    }
  }

  /**
   * Create a new product
   */
  async createProduct(productData: ProductCreateInput): Promise<Product> {
    // Validate required fields
    this.validateProductData(productData);

    try {
      // Try API first
      const response = await this.api.post<Product>('/products', productData);
      
      if (response.data) {
        // Add to local database
        await this.addProductToDB(response.data);
        
        // Invalidate cache
        await this.api.invalidateCache('products');
        
        return response.data;
      }

      throw new Error('Failed to create product');
    } catch (error) {
      // If API fails, create locally and mark for sync
      console.warn('API failed, creating locally:', error);
      
      const localProduct = await this.createProductLocally(productData);
      return localProduct;
    }
  }

  /**
   * Update an existing product
   */
  async updateProduct(id: string, updateData: ProductUpdateInput): Promise<Product> {
    // Validate update data
    this.validateProductUpdateData(updateData);

    try {
      // Try API first
      const response = await this.api.put<Product>(`/products/${id}`, updateData);
      
      if (response.data) {
        // Update local database
        await this.updateProductInDB(response.data);
        
        // Invalidate cache
        await this.api.invalidateCache(`product_${id}`);
        await this.api.invalidateCache('products');
        
        return response.data;
      }

      throw new Error('Failed to update product');
    } catch (error) {
      // If API fails, update locally and mark for sync
      console.warn('API failed, updating locally:', error);
      
      const localProduct = await this.updateProductLocally(id, updateData);
      return localProduct;
    }
  }

  /**
   * Delete a product
   */
  async deleteProduct(id: string): Promise<void> {
    try {
      // Try API first
      await this.api.delete(`/products/${id}`);
      
      // Remove from local database
      await this.deleteProductFromDB(id);
      
      // Invalidate cache
      await this.api.invalidateCache(`product_${id}`);
      await this.api.invalidateCache('products');
      
    } catch (error) {
      // If API fails, delete locally and mark for sync
      console.warn('API failed, deleting locally:', error);
      
      await this.deleteProductLocally(id);
    }
  }

  /**
   * Search products by name or description
   */
  async searchProducts(query: string, options: {
    category?: string;
    limit?: number;
  } = {}): Promise<Product[]> {
    const { category, limit = 20 } = options;

    try {
      const params = new URLSearchParams({
        q: query,
        limit: limit.toString(),
      });

      if (category) params.append('category', category);

      const response = await this.api.get<Product[]>(`/products/search?${params}`, {
        cacheKey: `products_search_${params.toString()}`,
        cacheTTL: 180000, // 3 minutes
      });

      return response.data || await this.searchProductsInDB(query, options);
    } catch (error) {
      // Fallback to local database
      console.warn('API failed, searching locally:', error);
      return await this.searchProductsInDB(query, options);
    }
  }

  /**
   * Get products by category
   */
  async getProductsByCategory(category: string, options: {
    status?: string;
    limit?: number;
  } = {}): Promise<Product[]> {
    return this.getProducts({
      status: 'active',
      ...options,
      category,
    });
  }

  /**
   * Get low stock products
   */
  async getLowStockProducts(threshold: number = 10): Promise<Product[]> {
    try {
      const response = await this.api.get<Product[]>(`/products/low-stock?threshold=${threshold}`, {
        cacheKey: `products_low_stock_${threshold}`,
        cacheTTL: 60000, // 1 minute
      });

      return response.data || await this.getLowStockProductsFromDB(threshold);
    } catch (error) {
      // Fallback to local database
      console.warn('API failed, checking locally:', error);
      return await this.getLowStockProductsFromDB(threshold);
    }
  }

  // Private helper methods

  private validateProductData(data: ProductCreateInput): void {
    if (!data.name || data.name.trim().length === 0) {
      throw new Error('Product name is required');
    }

    if (!data.category || data.category.trim().length === 0) {
      throw new Error('Product category is required');
    }

    if (!data.baseUOM || data.baseUOM.trim().length === 0) {
      throw new Error('Base unit of measure is required');
    }

    if (data.basePrice !== undefined && data.basePrice < 0) {
      throw new Error('Base price cannot be negative');
    }

    if (data.minStockLevel !== undefined && data.minStockLevel < 0) {
      throw new Error('Minimum stock level cannot be negative');
    }

    if (data.shelfLifeDays !== undefined && data.shelfLifeDays < 0) {
      throw new Error('Shelf life days cannot be negative');
    }
  }

  private validateProductUpdateData(data: ProductUpdateInput): void {
    if (data.basePrice !== undefined && data.basePrice < 0) {
      throw new Error('Base price cannot be negative');
    }

    if (data.minStockLevel !== undefined && data.minStockLevel < 0) {
      throw new Error('Minimum stock level cannot be negative');
    }

    if (data.shelfLifeDays !== undefined && data.shelfLifeDays < 0) {
      throw new Error('Shelf life days cannot be negative');
    }
  }

  // Database helper methods

  private async getProductsFromDB(options: any): Promise<Product[]> {
    const { category, status, search, limit = 50, offset = 0 } = options;

    let whereClause = 'WHERE 1=1';
    const params: any[] = [];

    if (category) {
      whereClause += ' AND category = ?';
      params.push(category);
    }

    if (status) {
      whereClause += ' AND status = ?';
      params.push(status);
    }

    if (search) {
      whereClause += ' AND (name LIKE ? OR description LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    whereClause += ' ORDER BY name LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const rows = await this.db.findAll('products', whereClause, params);
    let results = Array.isArray(rows) ? rows : [];
    if (category) results = results.filter((p: any) => p.category === category);
    if (status) results = results.filter((p: any) => p.status === status);
    if (search) {
      const q = String(search).toLowerCase();
      results = results.filter((p: any) =>
        String(p.name || '').toLowerCase().includes(q) ||
        String(p.description || '').toLowerCase().includes(q)
      );
    }
    return results.slice(offset, offset + limit);
  }

  private async getProductFromDB(id: string): Promise<Product | null> {
    return await this.db.findById('products', id);
  }

  private async addProductToDB(product: Product): Promise<void> {
    await this.db.insert('products', {
      ...product,
      syncStatus: 'synced',
      lastModified: new Date().toISOString(),
    });
  }

  private async updateProductInDB(product: Product): Promise<void> {
    await this.db.update('products', product.id, {
      ...product,
      syncStatus: 'synced',
      lastModified: new Date().toISOString(),
    });
  }

  private async deleteProductFromDB(id: string): Promise<void> {
    await this.db.delete('products', id);
  }

  private async createProductLocally(productData: ProductCreateInput): Promise<Product> {
    const now = new Date();
    const product: ProductWithSync = {
      id: `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: productData.name,
      description: productData.description,
      category: productData.category,
      imageUrl: productData.imageUrl || undefined,
      basePrice: productData.basePrice,
      baseUOM: productData.baseUOM,
      minStockLevel: productData.minStockLevel ?? 0,
      shelfLifeDays: productData.shelfLifeDays ?? 0,
      status: productData.status || 'active',
      alternateUOMs: [],
      createdAt: now,
      updatedAt: now,
      syncStatus: 'pending_create',
      lastModified: new Date().toISOString(),
    };

    await this.addProductToDB(product);
    return product;
  }

  private async updateProductLocally(id: string, updateData: ProductUpdateInput): Promise<Product> {
    const existingProduct = await this.getProductFromDB(id);
    if (!existingProduct) {
      throw new Error('Product not found');
    }

    const updatedProduct: ProductWithSync = {
      id: existingProduct.id,
      name: existingProduct.name,
      description: existingProduct.description,
      category: existingProduct.category,
      imageUrl: existingProduct.imageUrl,
      basePrice: existingProduct.basePrice,
      baseUOM: existingProduct.baseUOM,
      minStockLevel: existingProduct.minStockLevel,
      shelfLifeDays: existingProduct.shelfLifeDays,
      status: existingProduct.status,
      alternateUOMs: existingProduct.alternateUOMs,
      createdAt: existingProduct.createdAt,
      updatedAt: new Date(),
      syncStatus: (existingProduct as any).syncStatus === 'pending_create' ? 'pending_create' : 'pending_update',
      lastModified: new Date().toISOString(),
      ...updateData,
    };

    await this.updateProductInDB(updatedProduct);
    return updatedProduct;
  }

  private async deleteProductLocally(id: string): Promise<void> {
    const existingProduct = await this.getProductFromDB(id);
    if (!existingProduct) {
      throw new Error('Product not found');
    }

    // Mark as deleted instead of actually deleting for sync purposes
    await this.updateProductInDB({
      ...existingProduct,
      status: 'inactive',
      updatedAt: new Date(),
    } as any);

    // Add sync operation for deletion
    await this.db.addSyncOperation({
      operationType: 'delete',
      tableName: 'products',
      recordId: id,
      operationData: { id },
    });
  }

  private async searchProductsInDB(query: string, options: any): Promise<Product[]> {
    const { category, limit = 20 } = options;

    let whereClause = 'WHERE (name LIKE ? OR description LIKE ?)';
    const params = [`%${query}%`, `%${query}%`];

    if (category) {
      whereClause += ' AND category = ?';
      params.push(category);
    }

    whereClause += ' AND status != ? ORDER BY name LIMIT ?';
    params.push('deleted', limit);

    const rows = await this.db.findAll('products', whereClause, params);
    let results = Array.isArray(rows) ? rows : [];
    const q = String(query).toLowerCase();
    results = results.filter((p: any) =>
      String(p.name || '').toLowerCase().includes(q) ||
      String(p.description || '').toLowerCase().includes(q)
    );
    if (category) results = results.filter((p: any) => p.category === category);
    return results.slice(0, limit);
  }

  private async getLowStockProductsFromDB(threshold: number): Promise<Product[]> {
    const sql = `
      SELECT p.* FROM products p
      LEFT JOIN inventory_batches ib ON p.id = ib.product_id
      WHERE p.status = ? AND (ib.quantity < ? OR ib.quantity IS NULL)
      ORDER BY p.name
    `;
    const result = await this.db.execute(sql, ['active', threshold]);
    return result as Product[];
  }

  private async syncProductsToLocal(products: Product[]): Promise<void> {
    await this.db.findAll('products');
    for (const product of products) {
      const existing = await this.getProductFromDB(product.id);
      if (existing) {
        await this.updateProductInDB(product);
      } else {
        await this.addProductToDB(product);
      }
    }
  }
}

// Export singleton instance
export const productService = new ProductService();