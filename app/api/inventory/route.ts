import { asyncHandler } from '@/lib/api-error';
import { NextRequest } from 'next/server';
import { inventoryService } from '@/services/inventory.service';
import { AppError } from '@/lib/errors';
import { InventoryFilters } from '@/types/inventory.types';

export const dynamic = 'force-dynamic';

// GET /api/inventory - Fetch inventory data with optional filters
export const GET = asyncHandler(async (request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;

    const filters: InventoryFilters = {
      productId: searchParams.get('productId') || undefined,
      warehouseId: searchParams.get('warehouseId') || undefined,
    };

    const inventory = await inventoryService.getAll(filters);
    return Response.json({ success: true, data: inventory });
  } catch (error) {
    console.error('Error fetching inventory:', error);

    if (error instanceof AppError) {
      return Response.json(
        { success: false, error: error.message },
        { status: error.statusCode }
      );
    }

    return Response.json(
      { success: false, error: 'Failed to fetch inventory' },
      { status: 500 }
    );
  }
}
