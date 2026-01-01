import { asyncHandler } from '@/lib/api-error';
import { NextRequest } from 'next/server';
import { inventoryService } from '@/services/inventory.service';
import { AppError } from '@/lib/errors';

export const dynamic = 'force-dynamic';

// GET /api/inventory/stock-levels - Get current stock levels with weighted average costs
export const GET = asyncHandler(async (request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const warehouseId = searchParams.get('warehouseId') || undefined;

    const stockLevels = await inventoryService.getStockLevels(warehouseId);
    return Response.json({ success: true, data: stockLevels });
  } catch (error) {
    console.error('Error fetching stock levels:', error);
    
    if (error instanceof AppError) {
      return Response.json(
        { success: false, error: error.message },
        { status: error.statusCode }
      );
    }
    
    return Response.json(
      { success: false, error: 'Failed to fetch stock levels' },
      { status: 500 }
    );
  }
}
