import { asyncHandler } from '@/lib/api-error';
import { arService } from '@/services/ar.service';

export const dynamic = 'force-dynamic';

export const GET = asyncHandler(async (request: Request) => {
  const { searchParams } = new URL(request.url);
  const branchId = searchParams.get('branchId') || undefined;
  const status = searchParams.get('status') || undefined;
  const customerName = searchParams.get('customerName') || undefined;
  const fromDate = searchParams.get('fromDate')
    ? new Date(searchParams.get('fromDate')!)
    : undefined;
  const toDate = searchParams.get('toDate')
    ? new Date(searchParams.get('toDate')!)
    : undefined;

  const records = await arService.getAllAR({
    branchId,
    status,
    customerName,
    fromDate,
    toDate,
  });

  return Response.json({ success: true, data: records });
});

export const POST = asyncHandler(async (request: Request) => {
  const body = await request.json();

  // Validate required fields
  if (!body.branchId || !body.customerName || !body.totalAmount || !body.dueDate) {
    return Response.json(
      { success: false, error: 'Missing required fields' },
      { status: 400 }
    );
  }

  const record = await arService.createAR({
    branchId: body.branchId,
    customerName: body.customerName,
    salesOrderId: body.salesOrderId,
    totalAmount: parseFloat(body.totalAmount),
    dueDate: new Date(body.dueDate),
  });

  return Response.json({ success: true, data: record });
});
