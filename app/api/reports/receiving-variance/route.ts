import { asyncHandler } from '@/lib/api-error';
import { NextRequest } from 'next/server';
import { receivingVoucherService } from '@/services/receiving-voucher.service';
import { AppError } from '@/lib/errors';

export const dynamic = 'force-dynamic';

// GET /api/reports/receiving-variance - Generate variance report
export const GET = asyncHandler(async (request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const filters = {
      branchId: searchParams.get('branchId') || undefined,
      startDate: searchParams.get('startDate')
        ? new Date(searchParams.get('startDate')!)
        : undefined,
      endDate: searchParams.get('endDate')
        ? new Date(searchParams.get('endDate')!)
        : undefined,
    };

    const report = await receivingVoucherService.generateVarianceReport(filters);

    return Response.json({
      success: true,
      data: report,
    });
  } catch (error) {
    console.error('Error generating variance report:', error);

    if (error instanceof AppError) {
      return Response.json(
        { success: false, error: error.message },
        { status: error.statusCode }
      );
    }

    return Response.json(
      { success: false, error: 'Failed to generate variance report' },
      { status: 500 }
    );
  }
}
