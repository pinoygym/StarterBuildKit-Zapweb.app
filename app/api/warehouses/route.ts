import { NextRequest, NextResponse } from 'next/server';
import { warehouseService } from '@/services/warehouse.service';
import { AppError } from '@/lib/errors';

// GET /api/warehouses - Fetch all warehouses with utilization
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const branchId = searchParams.get('branchId');

    const warehouses = branchId
      ? await warehouseService.getWarehousesByBranch(branchId)
      : await warehouseService.getAllWarehouses();

    return NextResponse.json({ success: true, data: warehouses });
  } catch (error) {
    console.error('Error fetching warehouses:', error);

    if (error instanceof AppError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: error.statusCode }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to fetch warehouses' },
      { status: 500 }
    );
  }
}

// POST /api/warehouses - Create a new warehouse
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const warehouse = await warehouseService.createWarehouse(body);

    return NextResponse.json(
      { success: true, data: warehouse },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating warehouse:', error);

    if (error instanceof AppError) {
      return NextResponse.json(
        { success: false, error: error.message, fields: (error as any).fields },
        { status: error.statusCode }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to create warehouse' },
      { status: 500 }
    );
  }
}
