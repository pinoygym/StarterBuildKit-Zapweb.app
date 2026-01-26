import { NextResponse } from 'next/server';
import { apService } from '@/services/ap.service';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Basic validation
    if (!body.supplierId || !body.totalAmount || !body.allocations || body.allocations.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const record = await apService.recordBatchPayment({
      supplierId: body.supplierId,
      totalAmount: parseFloat(body.totalAmount),
      paymentMethod: body.paymentMethod,
      referenceNumber: body.referenceNumber,
      paymentDate: new Date(body.paymentDate),
      allocations: body.allocations.map((a: any) => ({
        apId: a.apId,
        amount: parseFloat(a.amount),
        purchaseOrderId: a.purchaseOrderId, // Not technically needed for service logic but good for tracking
      })),
    });

    return NextResponse.json({ success: true, data: record });
  } catch (error: any) {
    console.error('Error recording AP batch payment:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 400 }
    );
  }
}
