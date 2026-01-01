import { asyncHandler } from '@/lib/api-error';
import { NextRequest } from 'next/server';
import { salesOrderService } from '@/services/sales-order.service';
import { AppError } from '@/lib/errors';

export const dynamic = 'force-dynamic';

// GET /api/sales-orders/[id] - Fetch a single sales order
export const GET = asyncHandler(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const salesOrder = await salesOrderService.getSalesOrderById(id);
    return Response.json({ success: true, data: salesOrder });
  } catch (error) {
    console.error('Error fetching sales order:', error);
    
    if (error instanceof AppError) {
      return Response.json(
        { success: false, error: error.message },
        { status: error.statusCode }
      );
    }
    
    return Response.json(
      { success: false, error: 'Failed to fetch sales order' },
      { status: 500 }
    );
  }
}

// PUT /api/sales-orders/[id] - Update a sales order
export const PUT = asyncHandler(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Convert deliveryDate string to Date object if provided
    if (body.deliveryDate) {
      body.deliveryDate = new Date(body.deliveryDate);
    }

    const salesOrder = await salesOrderService.updateSalesOrder(id, body);
    
    return Response.json({ success: true, data: salesOrder });
  } catch (error) {
    console.error('Error updating sales order:', error);
    
    if (error instanceof AppError) {
      return Response.json(
        { success: false, error: error.message, fields: (error as any).fields },
        { status: error.statusCode }
      );
    }
    
    return Response.json(
      { success: false, error: 'Failed to update sales order' },
      { status: 500 }
    );
  }
}

// DELETE /api/sales-orders/[id] - Delete a sales order (not used, use cancel instead)
export const DELETE = asyncHandler(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await salesOrderService.cancelSalesOrder(id);
    
    return Response.json({ 
      success: true, 
      message: 'Sales order cancelled successfully' 
    });
  } catch (error) {
    console.error('Error cancelling sales order:', error);
    
    if (error instanceof AppError) {
      return Response.json(
        { success: false, error: error.message },
        { status: error.statusCode }
      );
    }
    
    return Response.json(
      { success: false, error: 'Failed to cancel sales order' },
      { status: 500 }
    );
  }
}
