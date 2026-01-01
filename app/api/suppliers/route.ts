import { NextRequest, NextResponse } from 'next/server';
import { supplierService } from '@/services/supplier.service';
import { AppError } from '@/lib/errors';
import { SupplierFilters } from '@/types/supplier.types';

export const dynamic = 'force-dynamic';

// GET /api/suppliers - Fetch all suppliers with optional filters
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;

    const filters: SupplierFilters = {
      status: searchParams.get('status') as any || undefined,
      search: searchParams.get('search') || undefined,
    };

    // Remove undefined values
    Object.keys(filters).forEach(key => {
      if (filters[key as keyof SupplierFilters] === undefined) {
        delete filters[key as keyof SupplierFilters];
      }
    });

    // Pagination parameters
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const skip = (page - 1) * limit;

    const suppliers = await supplierService.getAllSuppliers(filters, { skip, limit });

    // Get total count for pagination metadata
    const totalCount = await supplierService.getSupplierCount(filters);
    const totalPages = Math.ceil(totalCount / limit);

    const response = NextResponse.json({
      success: true,
      data: suppliers,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasMore: page < totalPages,
      }
    });

    // Add Cache-Control headers
    // Cache-Control removed to ensure real-time updates for supplier list
    // response.headers.set('Cache-Control', 'public, max-age=60, stale-while-revalidate=120');

    return response;
  } catch (error) {
    console.error('Error fetching suppliers:', error);

    if (error instanceof AppError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: error.statusCode }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch suppliers',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

// POST /api/suppliers - Create a new supplier
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const supplier = await supplierService.createSupplier(body);

    return NextResponse.json(
      { success: true, data: supplier },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating supplier:', error);

    if (error instanceof AppError) {
      return NextResponse.json(
        { success: false, error: error.message, fields: (error as any).fields },
        { status: error.statusCode }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to create supplier' },
      { status: 500 }
    );
  }
}
