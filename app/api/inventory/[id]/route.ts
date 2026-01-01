import { asyncHandler } from '@/lib/api-error';
import { NextRequest } from 'next/server';
import { inventoryService } from '@/services/inventory.service';
import { AppError } from '@/lib/errors';

export const dynamic = 'force-dynamic';

// GET /api/inventory/[id] - Fetch single inventory batch
export const GET = asyncHandler(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const batch = await inventoryService.getBatchById(id);
    return Response.json({ success: true, data: batch });
  } catch (error) {
    console.error('Error fetching inventory batch:', error);
    
    if (error instanceof AppError) {
      return Response.json(
        { success: false, error: error.message },
        { status: error.statusCode }
      );
    }
    
    return Response.json(
      { success: false, error: 'Failed to fetch inventory batch' },
      { status: 500 }
    );
  }
}
