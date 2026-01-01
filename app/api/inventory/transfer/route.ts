import { asyncHandler } from '@/lib/api-error';
import { NextRequest } from 'next/server';
import { inventoryService } from '@/services/inventory.service';
import { AppError } from '@/lib/errors';
import { TransferStockInput } from '@/types/inventory.types';

export const dynamic = 'force-dynamic';

// POST /api/inventory/transfer - Transfer stock between warehouses
export const POST = asyncHandler(async (request: NextRequest) {
  try {
    const body: TransferStockInput = await request.json();
    
    await inventoryService.transferStock(body);
    
    return Response.json(
      { success: true, message: 'Stock transferred successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error transferring stock:', error);
    
    if (error instanceof AppError) {
      return Response.json(
        { success: false, error: error.message, fields: (error as any).fields },
        { status: error.statusCode }
      );
    }
    
    return Response.json(
      { success: false, error: 'Failed to transfer stock' },
      { status: 500 }
    );
  }
}
