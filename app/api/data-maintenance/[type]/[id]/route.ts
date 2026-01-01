import { NextRequest, NextResponse } from 'next/server';
import { dataMaintenanceService } from '@/services/data-maintenance.service';
import { ReferenceDataType } from '@/types/data-maintenance.types';

const VALID_TYPES: ReferenceDataType[] = [
  'product-categories',
  'expense-categories',
  'payment-methods',
  'units-of-measure',
  'expense-vendors',
];

export async function GET(
  request: NextRequest,
  { params }: { params: { type: string; id: string } }
) {
  try {
    const { type, id } = params;

    // Validate type
    if (!VALID_TYPES.includes(type as ReferenceDataType)) {
      return NextResponse.json(
        { success: false, error: 'Invalid reference data type' },
        { status: 400 }
      );
    }

    const data = await dataMaintenanceService.getById(type as ReferenceDataType, id);

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error: any) {
    console.error('Error fetching reference data:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch data',
      },
      { status: error.statusCode || 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { type: string; id: string } }
) {
  try {
    const { type, id } = params;

    // Validate type
    if (!VALID_TYPES.includes(type as ReferenceDataType)) {
      return NextResponse.json(
        { success: false, error: 'Invalid reference data type' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const data = await dataMaintenanceService.update(type as ReferenceDataType, id, body);

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error: any) {
    console.error('Error updating reference data:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to update data',
        errors: error.errors || undefined,
      },
      { status: error.statusCode || 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { type: string; id: string } }
) {
  try {
    const { type, id } = params;

    // Validate type
    if (!VALID_TYPES.includes(type as ReferenceDataType)) {
      return NextResponse.json(
        { success: false, error: 'Invalid reference data type' },
        { status: 400 }
      );
    }

    await dataMaintenanceService.delete(type as ReferenceDataType, id);

    return NextResponse.json({
      success: true,
      message: 'Record deleted successfully',
    });
  } catch (error: any) {
    console.error('Error deleting reference data:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to delete data',
        errors: error.errors || undefined,
      },
      { status: error.statusCode || 500 }
    );
  }
}
