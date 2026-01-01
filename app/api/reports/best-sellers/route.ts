import { NextResponse } from 'next/server';
import { ReportService } from '@/services/report.service';

const reportService = new ReportService();

export async function GET(request: Request) {
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

    return NextResponse.json({ success: true, data: report });
  } catch (error: any) {
    console.error('Error generating best sellers report:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to generate report' },
      { status: 500 }
    );
  }
}
