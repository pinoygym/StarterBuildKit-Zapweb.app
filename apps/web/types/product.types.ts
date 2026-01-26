import { Product, ProductUOM } from '@prisma/client';

export type ProductStatus = 'active' | 'inactive';

// Category is now dynamic and fetched from the database
export type ProductCategory = string;

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
  CreatedBy?: {
    id: string;
    firstName: string;
    lastName: string;
  };
  UpdatedBy?: {
    id: string;
    firstName: string;
    lastName: string;
  };
  Supplier?: {
    id: string;
    companyName: string;
  } | null;
};

export interface ProductFilters {
  category?: ProductCategory;
  status?: ProductStatus;
  search?: string;
  page?: number;
  limit?: number;
}

export interface PaginationMetadata {
  page: number;
  limit: number;
  totalCount: number;
  totalPages: number;
  hasMore: boolean;
}

export interface ProductsResponse {
  success: boolean;
  data: ProductWithUOMs[];
  pagination: PaginationMetadata;
  error?: string;
}
