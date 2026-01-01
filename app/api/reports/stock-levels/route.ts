import { NextResponse } from 'next/server';
import { ReportService } from '@/services/report.service';

const reportService = new ReportService();

export async function GET(request: Request) {
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

    return NextResponse.json({ success: true, data: report });
  } catch (error: any) {
    console.error('Error generating stock level report:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to generate report' },
      { status: 500 }
    );
  }
}
