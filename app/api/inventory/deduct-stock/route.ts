import { asyncHandler } from '@/lib/api-error';
import { NextRequest } from 'next/server';
import { inventoryService } from '@/services/inventory.service';
import { AppError } from '@/lib/errors';
import { DeductStockInput } from '@/types/inventory.types';

export const dynamic = 'force-dynamic';

// POST /api/inventory/deduct-stock - Deduct stock from inventory
export const POST = asyncHandler(async (request: NextRequest) {
  try {
    const body: DeductStockInput = await request.json();
    
    await inventoryService.deductStock(body);
    
    return Response.json(
      { success: true, message: 'Stock deducted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deducting stock:', error);
    
    if (error instanceof AppError) {
      return Response.json(
        { success: false, error: error.message, fields: (error as any).fields },
        { status: error.statusCode }
      );
    }
    
    return Response.json(
      { success: false, error: 'Failed to deduct stock' },
      { status: 500 }
    );
  }
}
