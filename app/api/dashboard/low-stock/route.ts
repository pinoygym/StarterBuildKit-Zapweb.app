import { asyncHandler } from '@/lib/api-error';
import { dashboardService } from '@/services/dashboard.service';

export const dynamic = 'force-dynamic';

export const GET = asyncHandler(async (request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const branchId = searchParams.get('branchId') || undefined;
    const limit = parseInt(searchParams.get('limit') || '10');

    const products = await dashboardService.getLowStockProducts(limit, branchId);

    return Response.json({ success: true, data: products });
  } catch (error: any) {
    console.error('Error fetching low stock products:', error);
    return Response.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
