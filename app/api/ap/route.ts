import { NextResponse } from 'next/server';
import { apService } from '@/services/ap.service';

export async function GET(request: Request) {
  try {
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

    return NextResponse.json({ success: true, data: records });
  } catch (error: any) {
    console.error('Error fetching AP records:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    if (!body.branchId || !body.supplierId || !body.totalAmount || !body.dueDate) {
      return NextResponse.json(
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

    return NextResponse.json({ success: true, data: record });
  } catch (error: any) {
    console.error('Error creating AP record:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 400 }
    );
  }
}
