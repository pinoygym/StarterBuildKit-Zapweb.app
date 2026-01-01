import { asyncHandler } from '@/lib/api-error';
import { apService } from '@/services/ap.service';

export const dynamic = 'force-dynamic';

export const POST = asyncHandler(async (
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    if (!body.amount || !body.paymentMethod || !body.paymentDate) {
      return Response.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const updated = await apService.recordPayment({
      apId: id,
      amount: parseFloat(body.amount),
      paymentMethod: body.paymentMethod,
      referenceNumber: body.referenceNumber,
      paymentDate: new Date(body.paymentDate),
    });

    return Response.json({ 
      success: true, 
      data: updated,
      message: 'Payment recorded successfully' 
    });
  } catch (error: any) {
    console.error('Error recording AP payment:', error);
    return Response.json(
      { success: false, error: error.message },
      { status: 400 }
    );
  }
}
