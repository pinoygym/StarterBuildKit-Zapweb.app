import { NextResponse } from 'next/server';
import { dashboardService } from '@/services/dashboard.service';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const branchId = searchParams.get('branchId') || undefined;
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 5;

    const products = await dashboardService.getTopSellingProducts(limit, branchId);

    return NextResponse.json({ success: true, data: products });
  } catch (error: any) {
    console.error('Error fetching top products:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
