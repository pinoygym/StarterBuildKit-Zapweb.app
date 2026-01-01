import { NextRequest, NextResponse } from 'next/server';
import { salesOrderService } from '@/services/sales-order.service';
import { AppError } from '@/lib/errors';
import { SalesOrderFilters } from '@/types/sales-order.types';

// GET /api/sales-orders - Fetch all sales orders with optional filters
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    
    const filters: SalesOrderFilters = {
      status: searchParams.get('status') as any || undefined,
      salesOrderStatus: searchParams.get('salesOrderStatus') as any || undefined,
      branchId: searchParams.get('branchId') || undefined,
      warehouseId: searchParams.get('warehouseId') || undefined,
      search: searchParams.get('search') || undefined,
    };

    // Handle date filters
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    
    if (startDate) {
      filters.startDate = new Date(startDate);
    }
    
    if (endDate) {
      filters.endDate = new Date(endDate);
    }

    const salesOrders = await salesOrderService.getAllSalesOrders(filters);
    return NextResponse.json({ success: true, data: salesOrders });
  } catch (error) {
    console.error('Error fetching sales orders:', error);
    
    if (error instanceof AppError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: error.statusCode }
      );
    }
    
    return NextResponse.json(
      { success: false, error: 'Failed to fetch sales orders' },
      { status: 500 }
    );
  }
}

// POST /api/sales-orders - Create a new sales order
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Convert deliveryDate string to Date object
    if (body.deliveryDate) {
      body.deliveryDate = new Date(body.deliveryDate);
    }
    
    const salesOrder = await salesOrderService.createSalesOrder(body);
    
    return NextResponse.json(
      { success: true, data: salesOrder },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating sales order:', error);
    
    if (error instanceof AppError) {
      return NextResponse.json(
        { success: false, error: error.message, fields: (error as any).fields },
        { status: error.statusCode }
      );
    }
    
    return NextResponse.json(
      { success: false, error: 'Failed to create sales order' },
      { status: 500 }
    );
  }
}
