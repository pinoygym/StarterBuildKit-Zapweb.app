import { NextRequest, NextResponse } from 'next/server';
import { inventoryService } from '@/services/inventory.service';
import { AppError } from '@/lib/errors';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const productId = searchParams.get('productId');
    const warehouseId = searchParams.get('warehouseId');
    const uom = searchParams.get('uom');

    if (!productId || !warehouseId || !uom) {
      return NextResponse.json(
        { success: false, error: 'Missing required parameters: productId, warehouseId, uom' },
        { status: 400 }
      );
    }

    const averageCost = await inventoryService.getAverageCostByUOM(productId, warehouseId, uom);

    return NextResponse.json({ success: true, data: averageCost });
  } catch (error) {
    console.error('Error fetching average cost:', error);

    if (error instanceof AppError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: error.statusCode }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to fetch average cost' },
      { status: 500 }
    );
  }
}