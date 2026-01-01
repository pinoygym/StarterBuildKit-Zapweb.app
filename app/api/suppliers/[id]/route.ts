import { NextRequest } from 'next/server';
import { asyncHandler } from '@/lib/api-error';
import { supplierService } from '@/services/supplier.service';

export const dynamic = 'force-dynamic';

// GET /api/suppliers/[id] - Fetch single supplier
export const GET = asyncHandler(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params;
  const supplier = await supplierService.getSupplierById(id);
  return Response.json({ success: true, data: supplier });
});

// PUT /api/suppliers/[id] - Update supplier
export const PUT = asyncHandler(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params;
  const body = await request.json();
  const supplier = await supplierService.updateSupplier(id, body);

  return Response.json({ success: true, data: supplier });
});

// DELETE /api/suppliers/[id] - Soft delete supplier (set status to inactive)
export const DELETE = asyncHandler(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params;
  await supplierService.deleteSupplier(id);
  return Response.json({ success: true, message: 'Supplier deleted successfully' });
});
