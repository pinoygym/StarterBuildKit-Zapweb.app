import { asyncHandler } from '@/lib/api-error';
import { NextRequest } from 'next/server';
import { salesHistoryService } from '@/services/sales-history.service';
import { DatePreset, SalesHistoryFilters } from '@/types/sales-history.types';

export const dynamic = 'force-dynamic';

export const GET = asyncHandler(async (request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Build filters from query params
    const filters: SalesHistoryFilters = {
      preset: searchParams.get('preset') as DatePreset || undefined,
      startDate: searchParams.get('startDate') ? new Date(searchParams.get('startDate')!) : undefined,
      endDate: searchParams.get('endDate') ? new Date(searchParams.get('endDate')!) : undefined,
      branchId: searchParams.get('branchId') || undefined,
      paymentMethod: searchParams.get('paymentMethod') as any || undefined,
      userId: searchParams.get('userId') || undefined,
      customerId: searchParams.get('customerId') || undefined,
      receiptNumber: searchParams.get('receiptNumber') || undefined,
      minAmount: searchParams.get('minAmount') ? parseFloat(searchParams.get('minAmount')!) : undefined,
      maxAmount: searchParams.get('maxAmount') ? parseFloat(searchParams.get('maxAmount')!) : undefined,
      page: searchParams.get('page') ? parseInt(searchParams.get('page')!) : 1,
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 50,
    };

    const result = await salesHistoryService.getSalesHistory(filters);

    return Response.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Error fetching sales history:', error);
    return Response.json(
      {
        success: false,
        error: 'Failed to fetch sales history',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
