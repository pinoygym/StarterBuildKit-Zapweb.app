import { asyncHandler } from '@/lib/api-error';
import { arService } from '@/services/ar.service';

export const dynamic = 'force-dynamic';

export const GET = asyncHandler(async (request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const branchId = searchParams.get('branchId') || undefined;

    const report = await arService.getAgingReport(branchId);

    return Response.json({ success: true, data: report });
  } catch (error: any) {
    console.error('Error generating AR aging report:', error);
    return Response.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
