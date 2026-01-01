import { NextRequest, NextResponse } from 'next/server';
import { supplierService } from '@/services/supplier.service';
import { AppError } from '@/lib/errors';
import { SupplierFilters } from '@/types/supplier.types';

// GET /api/suppliers - Fetch all suppliers with optional filters
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    
    const filters: SupplierFilters = {
      status: searchParams.get('status') as any || undefined,
      search: searchParams.get('search') || undefined,
    };

    const suppliers = await supplierService.getAllSuppliers(filters);
    return NextResponse.json({ success: true, data: suppliers });
  } catch (error) {
    console.error('Error fetching suppliers:', error);
    
    if (error instanceof AppError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: error.statusCode }
      );
    }
    
    return NextResponse.json(
      { success: false, error: 'Failed to fetch suppliers' },
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
