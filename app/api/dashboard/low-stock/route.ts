import { NextResponse } from 'next/server';
import { dashboardService } from '@/services/dashboard.service';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const branchId = searchParams.get('branchId') || undefined;
    const limit = parseInt(searchParams.get('limit') || '10');

    const products = await dashboardService.getLowStockProducts(limit, branchId);

    return NextResponse.json({ success: true, data: products });
  } catch (error: any) {
    console.error('Error fetching low stock products:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
