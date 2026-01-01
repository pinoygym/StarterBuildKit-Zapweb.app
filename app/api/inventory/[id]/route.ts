import { NextRequest, NextResponse } from 'next/server';
import { inventoryService } from '@/services/inventory.service';
import { AppError } from '@/lib/errors';

export const dynamic = 'force-dynamic';

// GET /api/inventory/[id] - Fetch single inventory batch
// NOTE: This endpoint is currently not implemented as getBatchById doesn't exist in InventoryService
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    // TODO: Implement getBatchById in InventoryService or use alternative method
    return NextResponse.json(
      { success: false, error: 'This endpoint is not yet implemented' },
      { status: 501 }
    );
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
