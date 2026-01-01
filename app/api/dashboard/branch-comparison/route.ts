import { asyncHandler } from '@/lib/api-error';
import { dashboardService } from '@/services/dashboard.service';

export const dynamic = 'force-dynamic';

export const GET = asyncHandler(async (request: Request) {
  try {
    const comparison = await dashboardService.getBranchComparison();

    return Response.json({ success: true, data: comparison });
  } catch (error: any) {
    console.error('Error fetching branch comparison:', error);
    return Response.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
