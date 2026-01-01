import { NextResponse } from 'next/server';
import { dashboardService } from '@/services/dashboard.service';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const branchId = searchParams.get('branchId') || undefined;
    const days = parseInt(searchParams.get('days') || '7');

    const trends = await dashboardService.getSalesTrends(days, branchId);

    return NextResponse.json({ success: true, data: trends });
  } catch (error: any) {
    console.error('Error fetching sales trends:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
