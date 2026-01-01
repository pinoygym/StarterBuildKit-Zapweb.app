import { NextRequest } from 'next/server';
import { asyncHandler } from '@/lib/api-error';
import { salesOrderService } from '@/services/sales-order.service';
import { SalesOrderFilters } from '@/types/sales-order.types';

export const dynamic = 'force-dynamic';

// GET /api/sales-orders - Fetch all sales orders with optional filters
export const GET = asyncHandler(async (request: NextRequest) => {
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
  return Response.json({ success: true, data: salesOrders });
});

// POST /api/sales-orders - Create a new sales order
export const POST = asyncHandler(async (request: NextRequest) => {
  const body = await request.json();

  // Convert deliveryDate string to Date object
  if (body.deliveryDate) {
    body.deliveryDate = new Date(body.deliveryDate);
  }

  const salesOrder = await salesOrderService.createSalesOrder(body);

  return Response.json(
    { success: true, data: salesOrder },
    { status: 201 }
  );
});
