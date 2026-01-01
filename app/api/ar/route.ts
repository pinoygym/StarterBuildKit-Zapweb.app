import { NextResponse } from 'next/server';
import { arService } from '@/services/ar.service';

export async function GET(request: Request) {
  try {
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

    return NextResponse.json({ success: true, data: records });
  } catch (error: any) {
    console.error('Error fetching AR records:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Validate required fields
    if (!body.branchId || !body.customerName || !body.totalAmount || !body.dueDate) {
      return NextResponse.json(
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

    return NextResponse.json({ success: true, data: record });
  } catch (error: any) {
    console.error('Error creating AR record:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 400 }
    );
  }
}
