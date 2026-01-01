import { NextRequest } from 'next/server';
import { asyncHandler } from '@/lib/api-error';
import { customerService } from '@/services/customer.service';
import { CreateCustomerInput, CustomerFilters } from '@/types/customer.types';

export const dynamic = 'force-dynamic';

/**
 * GET /api/customers
 * Get all customers with optional filtering
 */
export const GET = asyncHandler(async (request: NextRequest) => {
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

  return Response.json({
    success: true,
    data: customers,
  });
});

/**
 * POST /api/customers
 * Create a new customer
 */
export const POST = asyncHandler(async (request: NextRequest) => {
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

  return Response.json({
    success: true,
    data: customer,
  }, { status: 201 });
});
