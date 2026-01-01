import { NextRequest, NextResponse } from 'next/server';
import { inventoryService } from '@/services/inventory.service';
import { AppError } from '@/lib/errors';

interface AdjustStockRequest {
  batchId: string;
  newQuantity: number;
  reason: string;
}

// POST /api/inventory/adjust - Adjust batch quantity
export async function POST(request: NextRequest) {
  try {
    const body: AdjustStockRequest = await request.json();
    
    await inventoryService.adjustStock(body);
    
    return NextResponse.json(
      { success: true, message: 'Stock adjusted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error adjusting stock:', error);
    
    if (error instanceof AppError) {
      return NextResponse.json(
        { success: false, error: error.message, fields: (error as any).fields },
        { status: error.statusCode }
      );
    }
    
    return NextResponse.json(
      { success: false, error: 'Failed to adjust stock' },
      { status: 500 }
    );
  }
}
