import { NextRequest, NextResponse } from 'next/server';
import { inventoryService } from '@/services/inventory.service';
import { AppError } from '@/lib/errors';
import { DeductStockInput } from '@/types/inventory.types';

// POST /api/inventory/deduct-stock - Deduct stock from inventory
export async function POST(request: NextRequest) {
  try {
    const body: DeductStockInput = await request.json();
    
    await inventoryService.deductStock(body);
    
    return NextResponse.json(
      { success: true, message: 'Stock deducted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deducting stock:', error);
    
    if (error instanceof AppError) {
      return NextResponse.json(
        { success: false, error: error.message, fields: (error as any).fields },
        { status: error.statusCode }
      );
    }
    
    return NextResponse.json(
      { success: false, error: 'Failed to deduct stock' },
      { status: 500 }
    );
  }
}
