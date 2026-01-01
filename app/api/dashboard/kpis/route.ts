import { asyncHandler } from '@/lib/api-error';
import { dashboardService } from '@/services/dashboard.service';

export const dynamic = 'force-dynamic';

export const GET = asyncHandler(async (request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const branchId = searchParams.get('branchId') || undefined;

    const kpis = await dashboardService.getKPIs({ branchId });

    return Response.json({ success: true, data: kpis });
  } catch (error: any) {
    console.error('Error fetching dashboard KPIs:', error);
    return Response.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
