import { asyncHandler } from '@/lib/api-error';
import { NextRequest } from 'next/server';
import { posService } from '@/services/pos.service';
import { AppError } from '@/lib/errors';

export const dynamic = 'force-dynamic';

// GET /api/pos/sales/[id] - Fetch single POS sale with items
export const GET = asyncHandler(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const sale = await posService.getSaleById(id);
    return Response.json({ success: true, data: sale });
  } catch (error) {
    console.error('Error fetching POS sale:', error);

    if (error instanceof AppError) {
      return Response.json(
        { success: false, error: error.message },
        { status: error.statusCode }
      );
    }

    return Response.json(
      { success: false, error: 'Failed to fetch POS sale' },
      { status: 500 }
    );
  }
}
