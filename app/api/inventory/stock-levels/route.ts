import { NextRequest, NextResponse } from 'next/server';
import { inventoryService } from '@/services/inventory.service';
import { AppError } from '@/lib/errors';

// GET /api/inventory/stock-levels - Get current stock levels with weighted average costs
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const warehouseId = searchParams.get('warehouseId') || undefined;

    const stockLevels = await inventoryService.getStockLevels(warehouseId);
    return NextResponse.json({ success: true, data: stockLevels });
  } catch (error) {
    console.error('Error fetching stock levels:', error);
    
    if (error instanceof AppError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: error.statusCode }
      );
    }
    
    return NextResponse.json(
      { success: false, error: 'Failed to fetch stock levels' },
      { status: 500 }
    );
  }
}
