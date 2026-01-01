import { NextRequest, NextResponse } from 'next/server';
import { posService } from '@/services/pos.service';
import { AppError } from '@/lib/errors';

// GET /api/pos/products - Fetch active products with stock
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const warehouseId = searchParams.get('warehouseId');

    if (!warehouseId) {
      return NextResponse.json(
        { success: false, error: 'Warehouse ID is required' },
        { status: 400 }
      );
    }

    const products = await posService.getActiveProductsWithStock(warehouseId);
    return NextResponse.json({ success: true, data: products });
  } catch (error) {
    console.error('Error fetching POS products:', error);

    if (error instanceof AppError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: error.statusCode }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to fetch products' },
      { status: 500 }
    );
  }
}
