import { NextRequest, NextResponse } from 'next/server';
import { posService } from '@/services/pos.service';
import { AppError } from '@/lib/errors';
import { POSSaleFilters } from '@/types/pos.types';
import { posSaleSchema } from '@/lib/validations/pos.validation';
import { ZodError } from 'zod';

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
    const rawBody = await request.json();
    console.log('POS sale raw body:', JSON.stringify(rawBody, null, 2));

    const body = posSaleSchema.parse(rawBody);
    console.log('POS sale validated data:', JSON.stringify(body, null, 2));

    const sale = await posService.processSale(body);

    return NextResponse.json(
      { success: true, data: sale },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error processing POS sale:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack');
    console.error('Error details:', error instanceof Error ? error.message : String(error));

    // Validation errors from Zod schema
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid POS sale data',
          fields: error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    // Domain/business errors
    if (error instanceof AppError) {
      return NextResponse.json(
        { success: false, error: error.message, fields: (error as any).fields },
        { status: error.statusCode }
      );
    }

    // Fallback: unexpected errors
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to process sale',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
