import { NextRequest, NextResponse } from 'next/server';
import { customerService } from '@/services/customer.service';
import { authService } from '@/services/auth.service';
import { AppError } from '@/lib/errors';
import { UpdateCustomerInput } from '@/types/customer.types';

export const dynamic = 'force-dynamic';

/**
 * GET /api/customers/[id]
 * Get a single customer by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const customer = await customerService.getCustomerById(id);
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
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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
        console.error('Error verifying token in PUT /api/customers/[id]:', err);
      }
    }

    const customer = await customerService.updateCustomer(id, updateData, userId);

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
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Extract userId from token
    let userId = undefined;
    const token = request.cookies.get('auth-token')?.value;
    if (token) {
      try {
        const payload = authService.verifyToken(token);
        userId = payload?.userId;
      } catch (err) {
        console.error('Error verifying token in DELETE /api/customers/[id]:', err);
      }
    }

    await customerService.deleteCustomer(id, userId);

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
