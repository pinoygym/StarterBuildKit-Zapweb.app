import { NextRequest, NextResponse } from 'next/server';
import { supplierService } from '@/services/supplier.service';
import { authService } from '@/services/auth.service';
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

    // Serialize a sample supplier to check for BigInt issues
    if (suppliers.length > 0) {
      try {
        JSON.stringify(suppliers[0]);
      } catch (jsonError) {
        console.error('[API] JSON Serialization Error on supplier sample:', jsonError);
        throw new Error(`JSON Serialization failed: ${(jsonError as Error).message}`);
      }
    }

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

    console.log('[API] Sending success response for /api/suppliers');
    return response;
  } catch (error: any) {
    console.error('Error fetching suppliers:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });

    // FORCE EXPOSE ERROR DETAILS FOR DEBUGGING
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch suppliers',
        debug_message: error.message,
        debug_stack: error.stack,
        debug_name: error.name,
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

    // Extract userId from token
    let userId = undefined;
    const token = request.cookies.get('auth-token')?.value;
    if (token) {
      try {
        const payload = authService.verifyToken(token);
        userId = payload?.userId;
      } catch (err) {
        console.error('Error verifying token in POST /api/suppliers:', err);
      }
    }

    const supplier = await supplierService.createSupplier(body, userId);

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
