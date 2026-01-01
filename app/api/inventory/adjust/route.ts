import { asyncHandler } from '@/lib/api-error';
import { NextRequest } from 'next/server';
import { inventoryService } from '@/services/inventory.service';
import { AppError } from '@/lib/errors';

export const dynamic = 'force-dynamic';

interface AdjustStockRequest {
  batchId: string;
  newQuantity: number;
  reason: string;
}

// POST /api/inventory/adjust - Adjust batch quantity
export const POST = asyncHandler(async (request: NextRequest) {
  try {
    const body: AdjustStockRequest = await request.json();
    
    await inventoryService.adjustStock(body);
    
    return Response.json(
      { success: true, message: 'Stock adjusted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error adjusting stock:', error);
    
    if (error instanceof AppError) {
      return Response.json(
        { success: false, error: error.message, fields: (error as any).fields },
        { status: error.statusCode }
      );
    }
    
    return Response.json(
      { success: false, error: 'Failed to adjust stock' },
      { status: 500 }
    );
  }
}
