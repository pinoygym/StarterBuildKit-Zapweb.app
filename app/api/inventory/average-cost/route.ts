import { asyncHandler } from '@/lib/api-error';
import { NextRequest } from 'next/server';
import { inventoryService } from '@/services/inventory.service';
import { AppError } from '@/lib/errors';

export const dynamic = 'force-dynamic';

export const GET = asyncHandler(async (request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const productId = searchParams.get('productId');
    const warehouseId = searchParams.get('warehouseId');
    const uom = searchParams.get('uom');

    if (!productId || !warehouseId || !uom) {
      return Response.json(
        { success: false, error: 'Missing required parameters: productId, warehouseId, uom' },
        { status: 400 }
      );
    }

    const averageCost = await inventoryService.getAverageCostByUOM(productId, warehouseId, uom);

    return Response.json({ success: true, data: averageCost });
  } catch (error) {
    console.error('Error fetching average cost:', error);

    if (error instanceof AppError) {
      return Response.json(
        { success: false, error: error.message },
        { status: error.statusCode }
      );
    }

    return Response.json(
      { success: false, error: 'Failed to fetch average cost' },
      { status: 500 }
    );
  }
}