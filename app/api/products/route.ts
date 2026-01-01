import { NextRequest } from 'next/server';
import { asyncHandler } from '@/lib/api-error';
import { productService } from '@/services/product.service';
import { ProductFilters } from '@/types/product.types';

export const dynamic = 'force-dynamic';

// GET /api/products - Fetch all products with optional filters
export const GET = asyncHandler(async (request: NextRequest) => {
  const searchParams = request.nextUrl.searchParams;

  const filters: ProductFilters = {
    category: searchParams.get('category') as any || undefined,
    status: searchParams.get('status') as any || undefined,
    search: searchParams.get('search') || undefined,
  };

  const products = await productService.getAllProducts(filters);
  return Response.json({ success: true, data: products });
});

// POST /api/products - Create a new product
export const POST = asyncHandler(async (request: NextRequest) => {
  const body = await request.json();
  const product = await productService.createProduct(body);

  return Response.json(
    { success: true, data: product },
    { status: 201 }
  );
});
