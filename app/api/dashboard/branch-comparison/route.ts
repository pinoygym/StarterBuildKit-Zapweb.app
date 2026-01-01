import { NextResponse } from 'next/server';
import { dashboardService } from '@/services/dashboard.service';

export async function GET(request: Request) {
  try {
    const comparison = await dashboardService.getBranchComparison();

    return NextResponse.json({ success: true, data: comparison });
  } catch (error: any) {
    console.error('Error fetching branch comparison:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
