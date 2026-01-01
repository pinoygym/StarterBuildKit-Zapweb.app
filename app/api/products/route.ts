import { NextRequest, NextResponse } from 'next/server';
import { productService } from '@/services/product.service';
import { authService } from '@/services/auth.service';
import { AppError } from '@/lib/errors';
import { ProductFilters } from '@/types/product.types';

export const dynamic = 'force-dynamic';

// GET /api/products - Fetch all products with optional filters
// GET /api/products - Fetch all products with optional filters
export async function GET(request: NextRequest) {
  try {
    console.log('[API] GET /api/products request received');
    const searchParams = request.nextUrl.searchParams;

    const filters: ProductFilters = {
      category: searchParams.get('category') as any || undefined,
      status: searchParams.get('status') as any || undefined,
      search: searchParams.get('search') || undefined,
    };

    console.log('[API] Filters:', JSON.stringify(filters));

    // Pagination parameters
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const skip = (page - 1) * limit;

    console.log('[API] Pagination:', { page, limit, skip });

    console.log('[API] Calling productService.getAllProducts...');
    const products = await productService.getAllProducts(filters, { skip, limit });
    console.log(`[API] Retrieved ${products.length} products`);

    // Serialize a sample product to check for BigInt issues
    if (products.length > 0) {
      try {
        JSON.stringify(products[0]);
      } catch (jsonError) {
        console.error('[API] JSON Serialization Error on product sample:', jsonError);
        throw new Error(`JSON Serialization failed: ${(jsonError as Error).message}`);
      }
    }

    // Get total count for pagination metadata
    console.log('[API] Calling productService.getProductCount...');
    const totalCount = await productService.getProductCount(filters);
    console.log(`[API] Total count: ${totalCount}`);

    const totalPages = Math.ceil(totalCount / limit);

    const responseData = {
      success: true,
      data: products,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasMore: page < totalPages,
      }
    };

    const response = NextResponse.json(responseData);

    // Add Cache-Control headers for product data (2 minutes cache)
    // Cache-Control removed to ensure real-time updates for product list
    // response.headers.set('Cache-Control', 'public, max-age=120, stale-while-revalidate=240');

    console.log('[API] Sending success response');
    return response;
  } catch (error: any) {
    console.error('Error fetching products:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });

    // FORCE EXPOSE ERROR DETAILS FOR DEBUGGING
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch products',
        debug_message: error.message,
        debug_stack: error.stack,
        debug_name: error.name
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
