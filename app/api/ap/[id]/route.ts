import { asyncHandler } from '@/lib/api-error';
import { apService } from '@/services/ap.service';

export const dynamic = 'force-dynamic';

export const GET = asyncHandler(async (
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params;
  const record = await apService.getAPById(id);

  if (!record) {
    return Response.json(
      { success: false, error: 'AP record not found' },
      { status: 404 }
    );
  }

  return Response.json({ success: true, data: record });
});

export const DELETE = asyncHandler(async (
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params;
  await apService.deleteAP(id);

  return Response.json({ success: true, message: 'AP record deleted successfully' });
});
