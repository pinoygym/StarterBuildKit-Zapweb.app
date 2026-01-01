import { NextRequest, NextResponse } from 'next/server';
import { salesOrderService } from '@/services/sales-order.service';
import { AppError } from '@/lib/errors';

// POST /api/sales-orders/[id]/cancel - Cancel a sales order
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const salesOrder = await salesOrderService.cancelSalesOrder(id);
    
    return NextResponse.json({ 
      success: true, 
      data: salesOrder,
      message: 'Sales order cancelled successfully' 
    });
  } catch (error) {
    console.error('Error cancelling sales order:', error);
    
    if (error instanceof AppError) {
      return NextResponse.json(
        { success: false, error: error.message, fields: (error as any).fields },
        { status: error.statusCode }
      );
    }
    
    return NextResponse.json(
      { success: false, error: 'Failed to cancel sales order' },
      { status: 500 }
    );
  }
}
