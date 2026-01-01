import { NextResponse } from 'next/server';
import { apService } from '@/services/ap.service';

export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (!body.apId || !body.amount || !body.paymentMethod || !body.paymentDate) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const updated = await apService.recordPayment({
      apId: body.apId,
      amount: parseFloat(body.amount),
      paymentMethod: body.paymentMethod,
      referenceNumber: body.referenceNumber,
      paymentDate: new Date(body.paymentDate),
    });

    return NextResponse.json({ 
      success: true, 
      data: updated,
      message: 'Payment recorded successfully' 
    });
  } catch (error: any) {
    console.error('Error recording AP payment:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 400 }
    );
  }
}
