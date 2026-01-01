import { NextRequest, NextResponse } from 'next/server';
import { purchaseOrderService } from '@/services/purchase-order.service';
import { AppError } from '@/lib/errors';
import { PurchaseOrderFilters } from '@/types/purchase-order.types';

// GET /api/purchase-orders - Fetch all purchase orders with optional filters
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    
    const filters: PurchaseOrderFilters = {
      status: searchParams.get('status') as any || undefined,
      branchId: searchParams.get('branchId') || undefined,
      supplierId: searchParams.get('supplierId') || undefined,
      warehouseId: searchParams.get('warehouseId') || undefined,
      startDate: searchParams.get('startDate') ? new Date(searchParams.get('startDate')!) : undefined,
      endDate: searchParams.get('endDate') ? new Date(searchParams.get('endDate')!) : undefined,
    };

    const purchaseOrders = await purchaseOrderService.getAllPurchaseOrders(filters);
    return NextResponse.json({ success: true, data: purchaseOrders });
  } catch (error) {
    console.error('Error fetching purchase orders:', error);
    
    if (error instanceof AppError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: error.statusCode }
      );
    }
    
    return NextResponse.json(
      { success: false, error: 'Failed to fetch purchase orders' },
      { status: 500 }
    );
  }
}

// POST /api/purchase-orders - Create a new purchase order
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Convert date string to Date object
    if (body.expectedDeliveryDate) {
      body.expectedDeliveryDate = new Date(body.expectedDeliveryDate);
    }
    
    const purchaseOrder = await purchaseOrderService.createPurchaseOrder(body);
    
    return NextResponse.json(
      { success: true, data: purchaseOrder },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating purchase order:', error);
    
    if (error instanceof AppError) {
      return NextResponse.json(
        { success: false, error: error.message, fields: (error as any).fields },
        { status: error.statusCode }
      );
    }
    
    return NextResponse.json(
      { success: false, error: 'Failed to create purchase order' },
      { status: 500 }
    );
  }
}
