import { asyncHandler } from '@/lib/api-error';
import { NextRequest } from 'next/server';
import { posService } from '@/services/pos.service';
import { AppError } from '@/lib/errors';

export const dynamic = 'force-dynamic';

// GET /api/pos/sales/today-summary - Fetch today's POS summary
export const GET = asyncHandler(async (request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const branchId = searchParams.get('branchId') || undefined;

    const summary = await posService.getTodaySummary(branchId);
    return Response.json({ success: true, data: summary });
  } catch (error) {
    console.error('Error fetching today summary:', error);

    if (error instanceof AppError) {
      return Response.json(
        { success: false, error: error.message },
        { status: error.statusCode }
      );
    }

    return Response.json(
      { success: false, error: 'Failed to fetch today summary' },
      { status: 500 }
    );
  }
}
