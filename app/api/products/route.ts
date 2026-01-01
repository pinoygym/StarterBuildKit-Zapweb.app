import { NextRequest, NextResponse } from 'next/server';
import { productService } from '@/services/product.service';
import { authService } from '@/services/auth.service';
import { AppError } from '@/lib/errors';
import { ProductFilters } from '@/types/product.types';

export const dynamic = 'force-dynamic';

// GET /api/products - Fetch all products with optional filters
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;

    const filters: ProductFilters = {
      category: searchParams.get('category') as any || undefined,
      status: searchParams.get('status') as any || undefined,
      search: searchParams.get('search') || undefined,
    };

    // Pagination parameters
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const skip = (page - 1) * limit;

    const products = await productService.getAllProducts(filters, { skip, limit });

    // Get total count for pagination metadata
    const totalCount = await productService.getProductCount(filters);
    const totalPages = Math.ceil(totalCount / limit);

    const response = NextResponse.json({
      success: true,
      data: products,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasMore: page < totalPages,
      }
    });

    // Add Cache-Control headers for product data (2 minutes cache)
    // Cache-Control removed to ensure real-time updates for product list
    // response.headers.set('Cache-Control', 'public, max-age=120, stale-while-revalidate=240');

    return response;
  } catch (error: any) {
    console.error('Error fetching products:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });

    if (error instanceof AppError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: error.statusCode }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch products',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}

// POST /api/products - Create a new product
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Extract userId from token
    let userId = undefined;
    const token = request.cookies.get('auth-token')?.value;
    if (token) {
      try {
        const payload = authService.verifyToken(token);
        userId = payload?.userId;
      } catch (err) {
        console.error('Error verifying token in POST /api/products:', err);
      }
    }

    const product = await productService.createProduct(body, userId);

    return NextResponse.json(
      { success: true, data: product },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating product:', error);

    if (error instanceof AppError) {
      return NextResponse.json(
        { success: false, error: error.message, fields: (error as any).fields },
        { status: error.statusCode }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to create product' },
      { status: 500 }
    );
  }
}
