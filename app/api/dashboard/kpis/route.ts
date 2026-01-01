import { NextResponse } from 'next/server';
import { dashboardService } from '@/services/dashboard.service';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const branchId = searchParams.get('branchId') || undefined;

    const kpis = await dashboardService.getKPIs({ branchId });

    return NextResponse.json({ success: true, data: kpis });
  } catch (error: any) {
    console.error('Error fetching dashboard KPIs:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
