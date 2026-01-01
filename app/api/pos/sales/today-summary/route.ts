import { NextRequest, NextResponse } from 'next/server';
import { posService } from '@/services/pos.service';
import { AppError } from '@/lib/errors';

// GET /api/pos/sales/today-summary - Fetch today's POS summary
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const branchId = searchParams.get('branchId') || undefined;

    const summary = await posService.getTodaySummary(branchId);
    return NextResponse.json({ success: true, data: summary });
  } catch (error) {
    console.error('Error fetching today summary:', error);

    if (error instanceof AppError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: error.statusCode }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to fetch today summary' },
      { status: 500 }
    );
  }
}
