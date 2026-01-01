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


    // Serialize a sample customer to check for BigInt issues
    if (customers.length > 0) {
      try {
        JSON.stringify(customers[0]);
      } catch (jsonError) {
        console.error('[API] JSON Serialization Error on customer sample:', jsonError);
        throw new Error(`JSON Serialization failed: ${(jsonError as Error).message}`);
      }
    }

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

    console.log('[API] Sending success response for /api/customers');
    return response;
  } catch (error: any) {
    console.error('Error fetching customers:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });

    // FORCE EXPOSE ERROR DETAILS FOR DEBUGGING
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch customers',
        debug_message: error.message,
        debug_stack: error.stack,
        debug_name: error.name
      },
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
      return NextResponse.json(
        { success: false, error: error.message, fields: (error as any).fields },
        { status: error.statusCode }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to create customer' },
      { status: 500 }
    );
  }
}
