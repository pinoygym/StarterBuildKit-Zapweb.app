import { NextRequest } from 'next/server';
import { asyncHandler } from '@/lib/api-error';
import { warehouseService } from '@/services/warehouse.service';

export const dynamic = 'force-dynamic';

// GET /api/warehouses - Fetch all warehouses with utilization
export const GET = asyncHandler(async (request: NextRequest) => {
  const searchParams = request.nextUrl.searchParams;
  const branchId = searchParams.get('branchId');

  const warehouses = branchId
    ? await warehouseService.getWarehousesByBranch(branchId)
    : await warehouseService.getAllWarehouses();

  return Response.json({ success: true, data: warehouses });
});

// POST /api/warehouses - Create a new warehouse
export const POST = asyncHandler(async (request: NextRequest) => {
  const body = await request.json();
  const warehouse = await warehouseService.createWarehouse(body);

  return Response.json(
    { success: true, data: warehouse },
    { status: 201 }
  );
});
