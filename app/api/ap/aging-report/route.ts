import { asyncHandler } from '@/lib/api-error';
import { apService } from '@/services/ap.service';

export const dynamic = 'force-dynamic';

export const GET = asyncHandler(async (request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const branchId = searchParams.get('branchId') || undefined;

    const report = await apService.getAgingReport(branchId);

    return Response.json({ success: true, data: report });
  } catch (error: any) {
    console.error('Error generating AP aging report:', error);
    return Response.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
