import { NextRequest, NextResponse } from 'next/server';
import { inventoryService } from '@/services/inventory.service';
import { AppError } from '@/lib/errors';
import { MovementFilters } from '@/types/inventory.types';

// GET /api/inventory/movements - Fetch stock movements with optional filters
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    
    const filters: MovementFilters = {
      productId: searchParams.get('productId') || undefined,
      warehouseId: searchParams.get('warehouseId') || undefined,
      type: searchParams.get('type') as any || undefined,
      referenceType: searchParams.get('referenceType') as any || undefined,
      dateFrom: searchParams.get('dateFrom') 
        ? new Date(searchParams.get('dateFrom')!) 
        : undefined,
      dateTo: searchParams.get('dateTo') 
        ? new Date(searchParams.get('dateTo')!) 
        : undefined,
    };

    const movements = await inventoryService.getAllMovements(filters);
    return NextResponse.json({ success: true, data: movements });
  } catch (error) {
    console.error('Error fetching stock movements:', error);
    
    if (error instanceof AppError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: error.statusCode }
      );
    }
    
    return NextResponse.json(
      { success: false, error: 'Failed to fetch stock movements' },
      { status: 500 }
    );
  }
}
