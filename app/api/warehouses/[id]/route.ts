import { NextRequest } from 'next/server';
import { asyncHandler } from '@/lib/api-error';
import { warehouseService } from '@/services/warehouse.service';

export const dynamic = 'force-dynamic';

// GET /api/warehouses/[id] - Fetch single warehouse with details
export const GET = asyncHandler(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params;
  const warehouse = await warehouseService.getWarehouseById(id);
  return Response.json({ success: true, data: warehouse });
});

// PUT /api/warehouses/[id] - Update warehouse
export const PUT = asyncHandler(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params;
  const body = await request.json();
  const warehouse = await warehouseService.updateWarehouse(id, body);

  return Response.json({ success: true, data: warehouse });
});

// DELETE /api/warehouses/[id] - Delete warehouse
export const DELETE = asyncHandler(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params;
  await warehouseService.deleteWarehouse(id);
  return Response.json({ success: true, message: 'Warehouse deleted successfully' });
});
