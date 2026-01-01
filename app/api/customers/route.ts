import { NextRequest, NextResponse } from 'next/server';
import { customerService } from '@/services/customer.service';
import { AppError } from '@/lib/errors';
import { CreateCustomerInput, CustomerFilters } from '@/types/customer.types';

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

    const customers = await customerService.getAllCustomers(
      Object.keys(filters).length > 0 ? filters : undefined
    );

    return NextResponse.json({
      success: true,
      data: customers,
    });
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

/**
 * POST /api/customers
 * Create a new customer
 */
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
      creditLimit: body.creditLimit ? parseFloat(body.creditLimit) : undefined,
      taxId: body.taxId,
      customerType: body.customerType,
      notes: body.notes,
      status: body.status,
    };

    const customer = await customerService.createCustomer(customerData);

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
