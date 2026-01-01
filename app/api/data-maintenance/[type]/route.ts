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

export async function GET(request: NextRequest, { params }: { params: { type: string } }) {
  try {
    const { type } = params;

    // Validate type
    if (!VALID_TYPES.includes(type as ReferenceDataType)) {
      return NextResponse.json(
        { success: false, error: 'Invalid reference data type' },
        { status: 400 }
      );
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || undefined;
    const search = searchParams.get('search') || undefined;

    const data = await dataMaintenanceService.getAll(type as ReferenceDataType, {
      status,
      search,
    });

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

export async function POST(request: NextRequest, { params }: { params: { type: string } }) {
  try {
    const { type } = params;

    // Validate type
    if (!VALID_TYPES.includes(type as ReferenceDataType)) {
      return NextResponse.json(
        { success: false, error: 'Invalid reference data type' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const data = await dataMaintenanceService.create(type as ReferenceDataType, body);

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error: any) {
    console.error('Error creating reference data:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to create data',
        errors: error.errors || undefined,
      },
      { status: error.statusCode || 500 }
    );
  }
}
