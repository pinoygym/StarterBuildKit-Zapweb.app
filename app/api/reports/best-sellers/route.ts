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
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 10;

    const report = await reportService.getBestSellingProducts({
      branchId,
      fromDate,
      toDate,
    }, limit);

    return Response.json({ success: true, data: report });
  } catch (error: any) {
    console.error('Error generating best sellers report:', error);
    return Response.json(
      { success: false, error: error.message || 'Failed to generate report' },
      { status: 500 }
    );
  }
}
