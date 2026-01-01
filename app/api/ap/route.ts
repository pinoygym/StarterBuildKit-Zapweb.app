import { asyncHandler } from '@/lib/api-error';
import { apService } from '@/services/ap.service';

export const dynamic = 'force-dynamic';

export const GET = asyncHandler(async (request: Request) => {
  const { searchParams } = new URL(request.url);
  const branchId = searchParams.get('branchId') || undefined;
  const supplierId = searchParams.get('supplierId') || undefined;
  const status = searchParams.get('status') || undefined;
  const fromDate = searchParams.get('fromDate')
    ? new Date(searchParams.get('fromDate')!)
    : undefined;
  const toDate = searchParams.get('toDate')
    ? new Date(searchParams.get('toDate')!)
    : undefined;

  const records = await apService.getAllAP({
    branchId,
    supplierId,
    status,
    fromDate,
    toDate,
  });

  return Response.json({ success: true, data: records });
});

export const POST = asyncHandler(async (request: Request) => {
  const body = await request.json();

  if (!body.branchId || !body.supplierId || !body.totalAmount || !body.dueDate) {
    return Response.json(
      { success: false, error: 'Missing required fields' },
      { status: 400 }
    );
  }

  const record = await apService.createAP({
    branchId: body.branchId,
    supplierId: body.supplierId,
    purchaseOrderId: body.purchaseOrderId,
    totalAmount: parseFloat(body.totalAmount),
    dueDate: new Date(body.dueDate),
  });

  return Response.json({ success: true, data: record });
});
