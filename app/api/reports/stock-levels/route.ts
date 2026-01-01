import { asyncHandler } from '@/lib/api-error';
import { ReportService } from '@/services/report.service';

export const dynamic = 'force-dynamic';

const reportService = new ReportService();

export const GET = asyncHandler(async (request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const branchId = searchParams.get('branchId') || undefined;
    const warehouseId = searchParams.get('warehouseId') || undefined;
    const category = searchParams.get('category') || undefined;

    const report = await reportService.getStockLevelReport({
      branchId,
      warehouseId,
      category,
    });

    return Response.json({ success: true, data: report });
  } catch (error: any) {
    console.error('Error generating stock level report:', error);
    return Response.json(
      { success: false, error: error.message || 'Failed to generate report' },
      { status: 500 }
    );
  }
}
