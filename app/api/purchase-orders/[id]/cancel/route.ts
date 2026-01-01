import { asyncHandler } from '@/lib/api-error';
import { NextRequest } from 'next/server';
import { purchaseOrderService } from '@/services/purchase-order.service';
import { AppError } from '@/lib/errors';

export const dynamic = 'force-dynamic';

// POST /api/purchase-orders/[id]/cancel - Cancel purchase order
export const POST = asyncHandler(async (
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    
    if (!body.reason) {
      return Response.json(
        { success: false, error: 'Cancellation reason is required' },
        { status: 400 }
      );
    }
    
    const purchaseOrder = await purchaseOrderService.cancelPurchaseOrder(id, {
      reason: body.reason,
    });
    
    return Response.json({
      success: true,
      data: purchaseOrder,
      message: 'Purchase order cancelled successfully',
    });
  } catch (error) {
    console.error('Error cancelling purchase order:', error);
    
    if (error instanceof AppError) {
      return Response.json(
        { success: false, error: error.message, fields: (error as any).fields },
        { status: error.statusCode }
      );
    }
    
    return Response.json(
      { success: false, error: 'Failed to cancel purchase order' },
      { status: 500 }
    );
  }
}
