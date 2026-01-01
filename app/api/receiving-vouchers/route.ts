import { NextRequest, NextResponse } from 'next/server';
import { receivingVoucherService } from '@/services/receiving-voucher.service';
import { createReceivingVoucherSchema, receivingVoucherFiltersSchema } from '@/lib/validations/receiving-voucher.validation';
import { AppError } from '@/lib/errors';

// POST /api/receiving-vouchers - Create receiving voucher
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('Received receiving voucher data:', JSON.stringify(body, null, 2));

    // Validate input
    const validationResult = createReceivingVoucherSchema.safeParse(body);
    if (!validationResult.success) {
      console.error('Validation error:', validationResult.error.flatten());
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          details: validationResult.error.flatten()
        },
        { status: 400 }
      );
    }
    const validatedData = validationResult.data;

    // Create receiving voucher
    const rv = await receivingVoucherService.createReceivingVoucher(validatedData);

    return NextResponse.json({
      success: true,
      data: rv,
      message: `Receiving voucher ${rv.rvNumber} created successfully. ${rv.ReceivingVoucherItem.filter(i => Number(i.receivedQuantity) > 0).length} inventory batches created.`,
    });
  } catch (error) {
    console.error('Error creating receiving voucher:', error);
    console.error('Error details:', error instanceof Error ? error.message : String(error));
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack');

    if (error instanceof AppError) {
      return NextResponse.json(
        { success: false, error: error.message, fields: (error as any).fields },
        { status: error.statusCode }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create receiving voucher',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

// GET /api/receiving-vouchers - List receiving vouchers
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const filters = {
      branchId: searchParams.get('branchId') || undefined,
      warehouseId: searchParams.get('warehouseId') || undefined,
      supplierId: searchParams.get('supplierId') || undefined,
      status: searchParams.get('status') || undefined,
      startDate: searchParams.get('startDate') || undefined,
      endDate: searchParams.get('endDate') || undefined,
      rvNumber: searchParams.get('rvNumber') || undefined,
      poNumber: searchParams.get('poNumber') || undefined,
    };

    // Validate filters
    const validatedFilters = receivingVoucherFiltersSchema.parse(filters);

    // Convert date strings to Date objects if provided
    const processedFilters = {
      ...validatedFilters,
      startDate: validatedFilters.startDate ? new Date(validatedFilters.startDate) : undefined,
      endDate: validatedFilters.endDate ? new Date(validatedFilters.endDate) : undefined,
    };

    const rvs = await receivingVoucherService.listReceivingVouchers(processedFilters);

    return NextResponse.json({
      success: true,
      data: rvs,
    });
  } catch (error) {
    console.error('Error fetching receiving vouchers:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    console.error('Error details:', JSON.stringify(error, null, 2));

    if (error instanceof AppError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: error.statusCode }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch receiving vouchers',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
