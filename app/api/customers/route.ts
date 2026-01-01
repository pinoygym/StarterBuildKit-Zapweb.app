import { NextRequest, NextResponse } from 'next/server';
import { customerService } from '@/services/customer.service';
import { authService } from '@/services/auth.service';
import { AppError } from '@/lib/errors';
import { CreateCustomerInput, CustomerFilters } from '@/types/customer.types';

// export const dynamic = 'force-dynamic';

/**
 * GET /api/customers
 * Get all customers with optional filtering
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;

    const filters: CustomerFilters = {
      status: searchParams.get('status') as any,
      customerType: searchParams.get('customerType') as any,
      search: searchParams.get('search') || undefined,
    };

    // Remove undefined values
    Object.keys(filters).forEach(key => {
      if (filters[key as keyof CustomerFilters] === undefined || filters[key as keyof CustomerFilters] === null) {
        delete filters[key as keyof CustomerFilters];
      }
    });

    // Pagination parameters
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const skip = (page - 1) * limit;

    const customers = await customerService.getAllCustomers(
      Object.keys(filters).length > 0 ? filters : undefined,
      { skip, limit }
    );

    // Get total count for pagination metadata
    const totalCount = await customerService.getCustomerCount(
      Object.keys(filters).length > 0 ? filters : undefined
    );
    const totalPages = Math.ceil(totalCount / limit);

    const response = NextResponse.json({
      success: true,
      data: customers,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasMore: page < totalPages,
      }
    });

    // Add Cache-Control headers for customer data (2 minutes cache)
    // Cache-Control removed to ensure real-time updates for customers list
    // response.headers.set('Cache-Control', 'public, max-age=120, stale-while-revalidate=240');

    return response;
  } catch (error) {
    console.error('Error fetching customers:', error);

    if (error instanceof AppError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: error.statusCode }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to fetch customers' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const customerData: CreateCustomerInput = {
      customerCode: body.customerCode,
      companyName: body.companyName,
      contactPerson: body.contactPerson,
      phone: body.phone,
      email: body.email,
      address: body.address,
      city: body.city,
      region: body.region,
      postalCode: body.postalCode,
      paymentTerms: body.paymentTerms,
      creditLimit: body.creditLimit !== undefined && body.creditLimit !== '' ? parseFloat(body.creditLimit) : undefined,
      taxId: body.taxId,
      customerType: body.customerType,
      notes: body.notes,
      status: body.status,
    };

    console.log('POST /api/customers body:', body);
    console.log('POST /api/customers customerData:', customerData);

    // Extract userId from token
    let userId = undefined;
    const token = request.cookies.get('auth-token')?.value;
    if (token) {
      try {
        const payload = authService.verifyToken(token);
        userId = payload?.userId;
      } catch (err) {
        console.error('Error verifying token in POST /api/customers:', err);
      }
    }

    const customer = await customerService.createCustomer(customerData, userId);

    return NextResponse.json({
      success: true,
      data: customer,
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating customer:', error);
    if (error instanceof AppError) {
      console.error('AppError details:', JSON.stringify(error, null, 2));
    }

    if (error instanceof AppError) {
      return NextResponse.json(
        {
          success: false,
          error: error.message,
          fields: (error as any).fields,
          receivedData: customerData
        },
        { status: error.statusCode }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create customer',
        details: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}
