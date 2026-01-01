import { NextResponse } from 'next/server';
import { dashboardService } from '@/services/dashboard.service';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const branchId = searchParams.get('branchId') || undefined;

    const utilization = await dashboardService.getWarehouseUtilization(branchId);

    return NextResponse.json({ success: true, data: utilization });
  } catch (error: any) {
    console.error('Error fetching warehouse utilization:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
