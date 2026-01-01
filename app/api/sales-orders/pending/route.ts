import { NextRequest, NextResponse } from 'next/server';
import { salesOrderService } from '@/services/sales-order.service';
import { AppError } from '@/lib/errors';

// GET /api/sales-orders/pending - Fetch pending sales orders for POS conversion
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const branchId = searchParams.get('branchId') || undefined;
    
    const pendingOrders = await salesOrderService.getPendingSalesOrders(branchId);
    
    return NextResponse.json({ success: true, data: pendingOrders });
  } catch (error) {
    console.error('Error fetching pending sales orders:', error);
    
    if (error instanceof AppError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: error.statusCode }
      );
    }
    
    return NextResponse.json(
      { success: false, error: 'Failed to fetch pending sales orders' },
      { status: 500 }
    );
  }
}
