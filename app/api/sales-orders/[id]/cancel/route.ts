import { asyncHandler } from '@/lib/api-error';
import { NextRequest } from 'next/server';
import { salesOrderService } from '@/services/sales-order.service';
import { AppError } from '@/lib/errors';

export const dynamic = 'force-dynamic';

// POST /api/sales-orders/[id]/cancel - Cancel a sales order
export const POST = asyncHandler(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const salesOrder = await salesOrderService.cancelSalesOrder(id);
    
    return Response.json({ 
      success: true, 
      data: salesOrder,
      message: 'Sales order cancelled successfully' 
    });
  } catch (error) {
    console.error('Error cancelling sales order:', error);
    
    if (error instanceof AppError) {
      return Response.json(
        { success: false, error: error.message, fields: (error as any).fields },
        { status: error.statusCode }
      );
    }
    
    return Response.json(
      { success: false, error: 'Failed to cancel sales order' },
      { status: 500 }
    );
  }
}
