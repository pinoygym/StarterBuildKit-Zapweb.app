import { asyncHandler } from '@/lib/api-error';
import { NextRequest } from 'next/server';
import { dataMaintenanceService } from '@/services/data-maintenance.service';
import { ReferenceDataType } from '@/types/data-maintenance.types';

export const dynamic = 'force-dynamic';

const VALID_TYPES: ReferenceDataType[] = [
  'product-categories',
  'expense-categories',
  'payment-methods',
  'units-of-measure',
  'expense-vendors',
  'sales-agents',
];

export const PATCH = asyncHandler(async (
  request: NextRequest,
  { params }: { params: { type: string; id: string } }
) {
  try {
    const { type, id } = params;

    // Validate type
    if (!VALID_TYPES.includes(type as ReferenceDataType)) {
      return Response.json(
        { success: false, error: 'Invalid reference data type' },
        { status: 400 }
      );
    }

    const data = await dataMaintenanceService.toggleStatus(type as ReferenceDataType, id);

    return Response.json({
      success: true,
      data,
    });
  } catch (error: any) {
    console.error('Error toggling status:', error);
    return Response.json(
      {
        success: false,
        error: error.message || 'Failed to toggle status',
      },
      { status: error.statusCode || 500 }
    );
  }
}
