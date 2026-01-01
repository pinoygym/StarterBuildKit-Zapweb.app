import { NextRequest, NextResponse } from 'next/server';
import { salesHistoryService } from '@/services/sales-history.service';
import { DatePreset, SalesHistoryFilters } from '@/types/sales-history.types';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Build filters from query params
    const filters: SalesHistoryFilters = {
      preset: searchParams.get('preset') as DatePreset || undefined,
      startDate: searchParams.get('startDate') ? new Date(searchParams.get('startDate')!) : undefined,
      endDate: searchParams.get('endDate') ? new Date(searchParams.get('endDate')!) : undefined,
      branchId: searchParams.get('branchId') || undefined,
    };

    const analytics = await salesHistoryService.getAnalytics(filters);

    return NextResponse.json({
      success: true,
      data: analytics,
    });
  } catch (error) {
    console.error('Error fetching sales analytics:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch sales analytics',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
