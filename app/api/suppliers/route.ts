import { NextRequest } from 'next/server';
import { asyncHandler } from '@/lib/api-error';
import { supplierService } from '@/services/supplier.service';
import { SupplierFilters } from '@/types/supplier.types';

export const dynamic = 'force-dynamic';

// GET /api/suppliers - Fetch all suppliers with optional filters
export const GET = asyncHandler(async (request: NextRequest) => {
  const searchParams = request.nextUrl.searchParams;

  const filters: SupplierFilters = {
    status: searchParams.get('status') as any || undefined,
    search: searchParams.get('search') || undefined,
  };

  const suppliers = await supplierService.getAllSuppliers(filters);
  return Response.json({ success: true, data: suppliers });
});

// POST /api/suppliers - Create a new supplier
export const POST = asyncHandler(async (request: NextRequest) => {
  const body = await request.json();
  const supplier = await supplierService.createSupplier(body);

  return Response.json(
    { success: true, data: supplier },
    { status: 201 }
  );
});
