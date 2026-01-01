import { NextRequest } from 'next/server';
import { asyncHandler } from '@/lib/api-error';
import { customerService } from '@/services/customer.service';
import { UpdateCustomerInput } from '@/types/customer.types';

export const dynamic = 'force-dynamic';

/**
 * GET /api/customers/[id]
 * Get a single customer by ID
 */
export const GET = asyncHandler(async (
  request: NextRequest,
  { params }: { params: { id: string } }
) => {
  const customer = await customerService.getCustomerById(params.id);
  return Response.json({ success: true, data: customer });
});

/**
 * PUT /api/customers/[id]
 * Update a customer
 */
export const PUT = asyncHandler(async (
  request: NextRequest,
  { params }: { params: { id: string } }
) => {
  const body = await request.json();

  const updateData: UpdateCustomerInput = {
    companyName: body.companyName,
    contactPerson: body.contactPerson,
    phone: body.phone,
    email: body.email,
    address: body.address,
    city: body.city,
    region: body.region,
    postalCode: body.postalCode,
    paymentTerms: body.paymentTerms,
    creditLimit: body.creditLimit !== undefined ? parseFloat(body.creditLimit) : undefined,
    taxId: body.taxId,
    customerType: body.customerType,
    notes: body.notes,
    status: body.status,
  };

  const customer = await customerService.updateCustomer(params.id, updateData);

  return Response.json({ success: true, data: customer });
});

/**
 * DELETE /api/customers/[id]
 * Delete (soft delete) a customer
 */
export const DELETE = asyncHandler(async (
  request: NextRequest,
  { params }: { params: { id: string } }
) => {
  await customerService.deleteCustomer(params.id);

  return Response.json({
    success: true,
    message: 'Customer deleted successfully'
  });
});
