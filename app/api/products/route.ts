import { NextRequest, NextResponse } from 'next/server';
import { productService } from '@/services/product.service';
import { AppError } from '@/lib/errors';
import { ProductFilters } from '@/types/product.types';

// GET /api/products - Fetch all products with optional filters
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    
    const filters: ProductFilters = {
      category: searchParams.get('category') as any || undefined,
      status: searchParams.get('status') as any || undefined,
      search: searchParams.get('search') || undefined,
    };

    const products = await productService.getAllProducts(filters);
    return NextResponse.json({ success: true, data: products });
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
    const product = await productService.createProduct(body);
    
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
