import { asyncHandler } from '@/lib/api-error';
import { dashboardService } from '@/services/dashboard.service';

export const dynamic = 'force-dynamic';

export const GET = asyncHandler(async (request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const branchId = searchParams.get('branchId') || undefined;
    const days = parseInt(searchParams.get('days') || '7');

    const trends = await dashboardService.getSalesTrends(days, branchId);

    return Response.json({ success: true, data: trends });
  } catch (error: any) {
    console.error('Error fetching sales trends:', error);
    return Response.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
