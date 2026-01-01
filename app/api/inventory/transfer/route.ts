import { NextRequest, NextResponse } from 'next/server';
import { inventoryService } from '@/services/inventory.service';
import { AppError } from '@/lib/errors';
import { TransferStockInput } from '@/types/inventory.types';

// POST /api/inventory/transfer - Transfer stock between warehouses
export async function POST(request: NextRequest) {
  try {
    const body: TransferStockInput = await request.json();
    
    await inventoryService.transferStock(body);
    
    return NextResponse.json(
      { success: true, message: 'Stock transferred successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error transferring stock:', error);
    
    if (error instanceof AppError) {
      return NextResponse.json(
        { success: false, error: error.message, fields: (error as any).fields },
        { status: error.statusCode }
      );
    }
    
    return NextResponse.json(
      { success: false, error: 'Failed to transfer stock' },
      { status: 500 }
    );
  }
}
