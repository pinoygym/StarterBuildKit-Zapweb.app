import { NextRequest, NextResponse } from 'next/server';
import { purchaseOrderService } from '@/services/purchase-order.service';
import { AppError } from '@/lib/errors';

// POST /api/purchase-orders/[id]/receive - Receive purchase order
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const purchaseOrder = await purchaseOrderService.receivePurchaseOrder(id);
    
    return NextResponse.json({
      success: true,
      data: purchaseOrder,
      message: 'Purchase order received successfully. Inventory batches and AP record created.',
    });
  } catch (error) {
    console.error('Error receiving purchase order:', error);
    
    if (error instanceof AppError) {
      return NextResponse.json(
        { success: false, error: error.message, fields: (error as any).fields },
        { status: error.statusCode }
      );
    }
    
    return NextResponse.json(
      { success: false, error: 'Failed to receive purchase order' },
      { status: 500 }
    );
  }
}
