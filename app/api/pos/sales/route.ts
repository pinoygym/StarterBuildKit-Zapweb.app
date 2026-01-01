import { NextRequest, NextResponse } from 'next/server';
import { posService } from '@/services/pos.service';
import { AppError } from '@/lib/errors';
import { POSSaleFilters } from '@/types/pos.types';

// GET /api/pos/sales - Fetch all POS sales with optional filters
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;

    const filters: POSSaleFilters = {
      branchId: searchParams.get('branchId') || undefined,
      paymentMethod: searchParams.get('paymentMethod') as any || undefined,
      search: searchParams.get('search') || undefined,
    };

    // Handle date filters
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    if (startDate) {
      filters.startDate = new Date(startDate);
    }

    if (endDate) {
      filters.endDate = new Date(endDate);
    }

    const sales = await posService.getAllSales(filters);
    return NextResponse.json({ success: true, data: sales });
  } catch (error) {
    console.error('Error fetching POS sales:', error);

    if (error instanceof AppError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: error.statusCode }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to fetch POS sales' },
      { status: 500 }
    );
  }
}

// POST /api/pos/sales - Process a new POS sale
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const sale = await posService.processSale(body);

    return NextResponse.json(
      { success: true, data: sale },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error processing POS sale:', error);

    if (error instanceof AppError) {
      return NextResponse.json(
        { success: false, error: error.message, fields: (error as any).fields },
        { status: error.statusCode }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to process sale' },
      { status: 500 }
    );
  }
}
