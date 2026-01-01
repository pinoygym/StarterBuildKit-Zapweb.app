import { asyncHandler } from '@/lib/api-error';
import { alertService } from '@/services/alert.service';

export const dynamic = 'force-dynamic';

export const GET = asyncHandler(async (request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const branchId = searchParams.get('branchId') || undefined;

    const counts = await alertService.getAlertCounts(branchId);

    return Response.json({ success: true, data: counts });
  } catch (error: any) {
    console.error('Error fetching alert counts:', error);
    return Response.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
