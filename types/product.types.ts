import { Product, ProductUOM } from '@prisma/client';

export type ProductStatus = 'active' | 'inactive';

export type ProductCategory = 'Carbonated' | 'Juices' | 'Energy Drinks' | 'Water' | 'Other';

export interface AlternateUOMInput {
  name: string;
  conversionFactor: number;
  sellingPrice: number;
}

export interface CreateProductInput {
  name: string;
  description?: string;
  category: ProductCategory;
  imageUrl?: string;
  basePrice: number;
  baseUOM: string;
  minStockLevel: number;
  shelfLifeDays: number;
  status?: ProductStatus;
  alternateUOMs?: AlternateUOMInput[];
}

export interface UpdateProductInput {
  name?: string;
  description?: string;
  category?: ProductCategory;
  imageUrl?: string;
  basePrice?: number;
  baseUOM?: string;
  minStockLevel?: number;
  shelfLifeDays?: number;
  status?: ProductStatus;
  alternateUOMs?: AlternateUOMInput[];
}

export type ProductWithUOMs = Product & {
  alternateUOMs: ProductUOM[];
};

export interface ProductFilters {
  category?: ProductCategory;
  status?: ProductStatus;
  search?: string;
}
