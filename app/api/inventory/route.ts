import { NextRequest, NextResponse } from 'next/server';
import { inventoryService } from '@/services/inventory.service';
import { AppError } from '@/lib/errors';
import { BatchFilters } from '@/types/inventory.types';

// GET /api/inventory - Fetch all inventory batches with optional filters
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    
    const filters: BatchFilters = {
      productId: searchParams.get('productId') || undefined,
      warehouseId: searchParams.get('warehouseId') || undefined,
      status: searchParams.get('status') as any || undefined,
      expiryDateFrom: searchParams.get('expiryDateFrom') 
        ? new Date(searchParams.get('expiryDateFrom')!) 
        : undefined,
      expiryDateTo: searchParams.get('expiryDateTo') 
        ? new Date(searchParams.get('expiryDateTo')!) 
        : undefined,
    };

    const batches = await inventoryService.getAllBatches(filters);
    return NextResponse.json({ success: true, data: batches });
  } catch (error) {
    console.error('Error fetching inventory batches:', error);
    
    if (error instanceof AppError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: error.statusCode }
      );
    }
    
    return NextResponse.json(
      { success: false, error: 'Failed to fetch inventory batches' },
      { status: 500 }
    );
  }
}
