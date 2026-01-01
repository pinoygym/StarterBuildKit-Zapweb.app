import { NextRequest, NextResponse } from 'next/server';
import { warehouseService } from '@/services/warehouse.service';
import { AppError } from '@/lib/errors';

// GET /api/warehouses/[id] - Fetch single warehouse with details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const warehouse = await warehouseService.getWarehouseById(id);
    return NextResponse.json({ success: true, data: warehouse });
  } catch (error) {
    console.error('Error fetching warehouse:', error);

    if (error instanceof AppError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: error.statusCode }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to fetch warehouse' },
      { status: 500 }
    );
  }
}

// PUT /api/warehouses/[id] - Update warehouse
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const warehouse = await warehouseService.updateWarehouse(id, body);

    return NextResponse.json({ success: true, data: warehouse });
  } catch (error) {
    console.error('Error updating warehouse:', error);

    if (error instanceof AppError) {
      return NextResponse.json(
        { success: false, error: error.message, fields: (error as any).fields },
        { status: error.statusCode }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to update warehouse' },
      { status: 500 }
    );
  }
}

// DELETE /api/warehouses/[id] - Delete warehouse
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await warehouseService.deleteWarehouse(id);
    return NextResponse.json({ success: true, message: 'Warehouse deleted successfully' });
  } catch (error) {
    console.error('Error deleting warehouse:', error);

    if (error instanceof AppError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: error.statusCode }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to delete warehouse' },
      { status: 500 }
    );
  }
}
