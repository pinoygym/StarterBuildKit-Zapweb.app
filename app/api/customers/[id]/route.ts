import { NextRequest, NextResponse } from 'next/server';
import { customerService } from '@/services/customer.service';
import { AppError } from '@/lib/errors';
import { UpdateCustomerInput } from '@/types/customer.types';

/**
 * GET /api/customers/[id]
 * Get a single customer by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const customer = await customerService.getCustomerById(params.id);
    return NextResponse.json({ success: true, data: customer });
  } catch (error) {
    console.error('Error fetching customer:', error);
    
    if (error instanceof AppError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: error.statusCode }
      );
    }
    
    return NextResponse.json(
      { success: false, error: 'Failed to fetch customer' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/customers/[id]
 * Update a customer
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
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
    
    return NextResponse.json({ success: true, data: customer });
  } catch (error) {
    console.error('Error updating customer:', error);
    
    if (error instanceof AppError) {
      return NextResponse.json(
        { success: false, error: error.message, fields: (error as any).fields },
        { status: error.statusCode }
      );
    }
    
    return NextResponse.json(
      { success: false, error: 'Failed to update customer' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/customers/[id]
 * Delete (soft delete) a customer
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await customerService.deleteCustomer(params.id);
    
    return NextResponse.json({ 
      success: true, 
      message: 'Customer deleted successfully' 
    });
  } catch (error) {
    console.error('Error deleting customer:', error);
    
    if (error instanceof AppError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: error.statusCode }
      );
    }
    
    return NextResponse.json(
      { success: false, error: 'Failed to delete customer' },
      { status: 500 }
    );
  }
}
