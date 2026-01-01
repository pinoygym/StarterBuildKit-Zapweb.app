import { NextRequest, NextResponse } from 'next/server';
import { salesOrderService } from '@/services/sales-order.service';
import { AppError } from '@/lib/errors';

// GET /api/sales-orders/[id] - Fetch a single sales order
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const salesOrder = await salesOrderService.getSalesOrderById(params.id);
    return NextResponse.json({ success: true, data: salesOrder });
  } catch (error) {
    console.error('Error fetching sales order:', error);
    
    if (error instanceof AppError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: error.statusCode }
      );
    }
    
    return NextResponse.json(
      { success: false, error: 'Failed to fetch sales order' },
      { status: 500 }
    );
  }
}

// PUT /api/sales-orders/[id] - Update a sales order
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    
    // Convert deliveryDate string to Date object if provided
    if (body.deliveryDate) {
      body.deliveryDate = new Date(body.deliveryDate);
    }
    
    const salesOrder = await salesOrderService.updateSalesOrder(params.id, body);
    
    return NextResponse.json({ success: true, data: salesOrder });
  } catch (error) {
    console.error('Error updating sales order:', error);
    
    if (error instanceof AppError) {
      return NextResponse.json(
        { success: false, error: error.message, fields: (error as any).fields },
        { status: error.statusCode }
      );
    }
    
    return NextResponse.json(
      { success: false, error: 'Failed to update sales order' },
      { status: 500 }
    );
  }
}

// DELETE /api/sales-orders/[id] - Delete a sales order (not used, use cancel instead)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await salesOrderService.cancelSalesOrder(params.id);
    
    return NextResponse.json({ 
      success: true, 
      message: 'Sales order cancelled successfully' 
    });
  } catch (error) {
    console.error('Error cancelling sales order:', error);
    
    if (error instanceof AppError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: error.statusCode }
      );
    }
    
    return NextResponse.json(
      { success: false, error: 'Failed to cancel sales order' },
      { status: 500 }
    );
  }
}
