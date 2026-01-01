import { Product } from '@prisma/client';
import { productRepository } from '@/repositories/product.repository';
import {
  CreateProductInput,
  UpdateProductInput,
  ProductWithUOMs,
  ProductFilters
} from '@/types/product.types';
import { ValidationError, NotFoundError } from '@/lib/errors';
import { productSchema, updateProductSchema } from '@/lib/validations/product.validation';
import { auditService } from './audit.service';

export class ProductService {
  async getAllProducts(filters?: ProductFilters, pagination?: { skip?: number; limit?: number }): Promise<ProductWithUOMs[]> {
    return await productRepository.findAll(filters, pagination);
  }

  async getProductCount(filters?: ProductFilters): Promise<number> {
    return await productRepository.count(filters);
  }

  async getProductById(id: string): Promise<ProductWithUOMs> {
    const product = await productRepository.findById(id);
    if (!product) {
      throw new NotFoundError('Product');
    }
    return product;
  }

  async getActiveProducts(): Promise<ProductWithUOMs[]> {
    return await productRepository.findActive();
  }

  async createProduct(data: CreateProductInput, userId?: string): Promise<ProductWithUOMs> {
    // Validate input
    const validationResult = productSchema.safeParse(data);
    if (!validationResult.success) {
      const errors = validationResult.error.flatten().fieldErrors;
      throw new ValidationError('Invalid product data', errors as Record<string, string>);
    }

    // Check if product name already exists
    const existingProduct = await productRepository.findByName(data.name);
    if (existingProduct) {
      throw new ValidationError('Product name already exists', {
        name: 'Product name must be unique'
      });
    }

    // Validate that alternate UOM names don't conflict with base UOM
    if (data.alternateUOMs && data.alternateUOMs.length > 0) {
      const uomNames = data.alternateUOMs.map(uom => uom.name.toLowerCase());

      // Check if base UOM is in alternate UOMs
      if (uomNames.includes(data.baseUOM.toLowerCase())) {
        throw new ValidationError('Invalid UOM configuration', {
          alternateUOMs: 'Alternate UOM names cannot be the same as base UOM'
        });
      }

      // Check for duplicate alternate UOM names
      const uniqueUOMs = new Set(uomNames);
      if (uniqueUOMs.size !== uomNames.length) {
        throw new ValidationError('Invalid UOM configuration', {
          alternateUOMs: 'Alternate UOM names must be unique'
        });
      }
    }

    const product = await productRepository.create({ ...validationResult.data, createdById: userId });

    // Log the action
    await auditService.log({
      userId,
      action: 'CREATE',
      resource: 'PRODUCT',
      resourceId: product.id,
      details: { name: product.name }
    });

    return product;
  }

  async updateProduct(id: string, data: UpdateProductInput, userId?: string): Promise<ProductWithUOMs> {
    // Check if product exists
    const existingProduct = await productRepository.findById(id);
    if (!existingProduct) {
      throw new NotFoundError('Product');
    }

    // Validate input
    const validationResult = updateProductSchema.safeParse(data);
    if (!validationResult.success) {
      const errors = validationResult.error.flatten().fieldErrors;
      throw new ValidationError('Invalid product data', errors as Record<string, string>);
    }

    // Check if product name is being updated and if it already exists
    if (data.name && data.name !== existingProduct.name) {
      const productWithName = await productRepository.findByName(data.name);
      if (productWithName) {
        throw new ValidationError('Product name already exists', {
          name: 'Product name must be unique'
        });
      }
    }

    // Validate UOM configuration if being updated
    if (data.alternateUOMs !== undefined) {
      const baseUOM = data.baseUOM || existingProduct.baseUOM;

      if (data.alternateUOMs.length > 0) {
        const uomNames = data.alternateUOMs.map(uom => uom.name.toLowerCase());

        // Check if base UOM is in alternate UOMs
        if (uomNames.includes(baseUOM.toLowerCase())) {
          throw new ValidationError('Invalid UOM configuration', {
            alternateUOMs: 'Alternate UOM names cannot be the same as base UOM'
          });
        }

        // Check for duplicate alternate UOM names
        const uniqueUOMs = new Set(uomNames);
        if (uniqueUOMs.size !== uomNames.length) {
          throw new ValidationError('Invalid UOM configuration', {
            alternateUOMs: 'Alternate UOM names must be unique'
          });
        }
      }
    }

    const product = await productRepository.update(id, { ...validationResult.data, updatedById: userId });

    // Log the action
    await auditService.log({
      userId,
      action: 'UPDATE',
      resource: 'PRODUCT',
      resourceId: id,
      details: { changedFields: Object.keys(data) }
    });

    return product;
  }

  async deleteProduct(id: string, userId?: string, userRole?: string): Promise<void> {
    // Check if product exists
    const product = await productRepository.findById(id);
    if (!product) {
      throw new NotFoundError('Product');
    }

    // Prevent deleting active products unless user is Super Admin
    if (product.status === 'active' && userRole !== 'Super Admin') {
      throw new ValidationError('Active products cannot be deleted. Please set to inactive first or contact a Super Admin.');
    }

    // Soft delete implementation - just calls repository delete which now does soft delete
    await productRepository.delete(id);

    // Log the action
    await auditService.log({
      userId,
      action: 'DELETE',
      resource: 'PRODUCT',
      resourceId: id,
      details: { name: product.name, status: 'inactive' }
    });
  }

  async toggleProductStatus(id: string): Promise<Product> {
    const product = await this.getProductById(id);
    const newStatus = product.status === 'active' ? 'inactive' : 'active';
    return await productRepository.updateStatus(id, newStatus);
  }

  /**
   * Get all UOMs for a product (base UOM + alternate UOMs)
   */
  async getProductUOMs(productId: string): Promise<Array<{ name: string; sellingPrice: number }>> {
    const product = await this.getProductById(productId);

    const uoms = [
      {
        name: product.baseUOM,
        sellingPrice: Number(product.basePrice),
      },
      ...product.alternateUOMs.map(uom => ({
        name: uom.name,
        sellingPrice: Number(uom.sellingPrice),
      })),
    ];

    return uoms;
  }

  /**
   * Get selling price for a specific UOM
   */
  async getUOMSellingPrice(productId: string, uomName: string): Promise<number> {
    const product = await this.getProductById(productId);

    // Check if it's the base UOM
    if (uomName === product.baseUOM) {
      return Number(product.basePrice);
    }

    // Check alternate UOMs
    const alternateUOM = product.alternateUOMs.find(
      uom => uom.name.trim().toLowerCase() === uomName.trim().toLowerCase()
    );

    if (!alternateUOM) {
      throw new ValidationError(`UOM '${uomName}' not found for product`, {
        uom: 'Invalid UOM for this product'
      });
    }

    return Number(alternateUOM.sellingPrice);
  }
}

// Singleton instance
let instance: ProductService | null = null;

export const productService = {
  get instance() {
    if (!instance) {
      instance = new ProductService();
    }
    return instance;
  },

  // Proxy methods for backward compatibility and cleaner API
  getAllProducts: (filters?: ProductFilters, pagination?: { skip?: number; limit?: number }) => productService.instance.getAllProducts(filters, pagination),
  getProductCount: (filters?: ProductFilters) => productService.instance.getProductCount(filters),
  getProductById: (id: string) => productService.instance.getProductById(id),
  getActiveProducts: () => productService.instance.getActiveProducts(),
  createProduct: (data: CreateProductInput, userId?: string) => productService.instance.createProduct(data, userId),
  updateProduct: (id: string, data: UpdateProductInput, userId?: string) => productService.instance.updateProduct(id, data, userId),
  deleteProduct: (id: string, userId?: string, userRole?: string) => productService.instance.deleteProduct(id, userId, userRole),
  toggleProductStatus: (id: string) => productService.instance.toggleProductStatus(id),
  getProductUOMs: (productId: string) => productService.instance.getProductUOMs(productId),
  getUOMSellingPrice: (productId: string, uomName: string) => productService.instance.getUOMSellingPrice(productId, uomName),
};
