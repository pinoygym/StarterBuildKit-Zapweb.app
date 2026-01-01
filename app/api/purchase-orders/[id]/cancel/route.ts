import { NextRequest, NextResponse } from 'next/server';
import { purchaseOrderService } from '@/services/purchase-order.service';
import { AppError } from '@/lib/errors';

// POST /api/purchase-orders/[id]/cancel - Cancel purchase order
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    
    if (!body.reason) {
      return NextResponse.json(
        { success: false, error: 'Cancellation reason is required' },
        { status: 400 }
      );
    }
    
    const purchaseOrder = await purchaseOrderService.cancelPurchaseOrder(id, {
      reason: body.reason,
    });
    
    return NextResponse.json({
      success: true,
      data: purchaseOrder,
      message: 'Purchase order cancelled successfully',
    });
  } catch (error) {
    console.error('Error cancelling purchase order:', error);
    
    if (error instanceof AppError) {
      return NextResponse.json(
        { success: false, error: error.message, fields: (error as any).fields },
        { status: error.statusCode }
      );
    }
    
    return NextResponse.json(
      { success: false, error: 'Failed to cancel purchase order' },
      { status: 500 }
    );
  }
}
