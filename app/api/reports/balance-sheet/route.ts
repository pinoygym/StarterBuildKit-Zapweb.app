import { NextResponse } from 'next/server';
import { ReportService } from '@/services/report.service';

const reportService = new ReportService();

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const branchId = searchParams.get('branchId') || undefined;
    const asOfDate = searchParams.get('asOfDate') ? new Date(searchParams.get('asOfDate')!) : new Date();

    const report = await reportService.getBalanceSheet({
      branchId,
    }, asOfDate);

    return NextResponse.json({ success: true, data: report });
  } catch (error: any) {
    console.error('Error generating balance sheet:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to generate report' },
      { status: 500 }
    );
  }
}
