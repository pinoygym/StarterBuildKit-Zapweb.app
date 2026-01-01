import { asyncHandler } from '@/lib/api-error';
import { arService } from '@/services/ar.service';

export const dynamic = 'force-dynamic';

export const POST = asyncHandler(async (request: Request) {
  try {
    const body = await request.json();

    if (!body.arId || !body.amount || !body.paymentMethod || !body.paymentDate) {
      return Response.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const updated = await arService.recordPayment({
      arId: body.arId,
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
    console.error('Error recording AR payment:', error);
    return Response.json(
      { success: false, error: error.message },
      { status: 400 }
    );
  }
}
