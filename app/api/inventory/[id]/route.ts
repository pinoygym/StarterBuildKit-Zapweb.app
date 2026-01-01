import { NextRequest, NextResponse } from 'next/server';
import { inventoryService } from '@/services/inventory.service';
import { AppError } from '@/lib/errors';

// GET /api/inventory/[id] - Fetch single inventory batch
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const batch = await inventoryService.getBatchById(id);
    return NextResponse.json({ success: true, data: batch });
  } catch (error) {
    console.error('Error fetching inventory batch:', error);
    
    if (error instanceof AppError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: error.statusCode }
      );
    }
    
    return NextResponse.json(
      { success: false, error: 'Failed to fetch inventory batch' },
      { status: 500 }
    );
  }
}
