import { asyncHandler } from '@/lib/api-error';
import { arService } from '@/services/ar.service';

export const dynamic = 'force-dynamic';

export const GET = asyncHandler(async (
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params;
  const record = await arService.getARById(id);

  if (!record) {
    return Response.json(
      { success: false, error: 'AR record not found' },
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
  await arService.deleteAR(id);

  return Response.json({ success: true, message: 'AR record deleted successfully' });
});
