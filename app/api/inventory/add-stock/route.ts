import { asyncHandler } from '@/lib/api-error';
import { NextRequest } from 'next/server';
import { inventoryService } from '@/services/inventory.service';
import { AppError } from '@/lib/errors';
import { AddStockInput } from '@/types/inventory.types';

export const dynamic = 'force-dynamic';

// POST /api/inventory/add-stock - Add stock to inventory
export const POST = asyncHandler(async (request: NextRequest) {
  try {
    const body: AddStockInput = await request.json();

    const batch = await inventoryService.addStock(body);
    
    return Response.json(
      { success: true, data: batch, message: 'Stock added successfully' },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error adding stock:', error);
    
    if (error instanceof AppError) {
      return Response.json(
        { success: false, error: error.message, fields: (error as any).fields },
        { status: error.statusCode }
      );
    }
    
    return Response.json(
      { success: false, error: 'Failed to add stock' },
      { status: 500 }
    );
  }
}
