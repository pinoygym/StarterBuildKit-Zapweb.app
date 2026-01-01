import { asyncHandler } from '@/lib/api-error';
import { ReportService } from '@/services/report.service';

export const dynamic = 'force-dynamic';

const reportService = new ReportService();

export const GET = asyncHandler(async (request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const branchId = searchParams.get('branchId') || undefined;
    const fromDate = searchParams.get('fromDate') ? new Date(searchParams.get('fromDate')!) : undefined;
    const toDate = searchParams.get('toDate') ? new Date(searchParams.get('toDate')!) : undefined;

    const report = await reportService.getProfitLossStatement({
      branchId,
      fromDate,
      toDate,
    });

    return Response.json({ success: true, data: report });
  } catch (error: any) {
    console.error('Error generating P&L statement:', error);
    return Response.json(
      { success: false, error: error.message || 'Failed to generate report' },
      { status: 500 }
    );
  }
}
