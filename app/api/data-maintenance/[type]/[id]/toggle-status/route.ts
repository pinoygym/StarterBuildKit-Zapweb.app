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

export async function PATCH(
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

    const data = await dataMaintenanceService.toggleStatus(type as ReferenceDataType, id);

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error: any) {
    console.error('Error toggling status:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to toggle status',
      },
      { status: error.statusCode || 500 }
    );
  }
}
