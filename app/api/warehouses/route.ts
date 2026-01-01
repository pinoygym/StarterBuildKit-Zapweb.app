import { NextRequest, NextResponse } from 'next/server';
import { warehouseService } from '@/services/warehouse.service';
import { AppError } from '@/lib/errors';

export const dynamic = 'force-dynamic';

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
      { success: false, error: error instanceof Error ? error.message : 'Failed to fetch warehouses' },
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
  } catch (error: any) {
    console.error('Error creating warehouse:', error);

    if (error instanceof AppError) {
      return NextResponse.json(
        { success: false, error: error.message, fields: (error as any).fields },
        { status: error.statusCode }
      );
    }

    // Handle Prisma Foreign Key Constraint Violation
    if (error.code === 'P2003') {
      return NextResponse.json(
        { success: false, error: 'Invalid branch ID. The specified branch does not exist.' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to create warehouse' },
      { status: 500 }
    );
  }
}
