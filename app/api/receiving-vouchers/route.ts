import { NextRequest } from 'next/server';
import { asyncHandler } from '@/lib/api-error';
import { receivingVoucherService } from '@/services/receiving-voucher.service';
import { createReceivingVoucherSchema, receivingVoucherFiltersSchema } from '@/lib/validations/receiving-voucher.validation';

export const dynamic = 'force-dynamic';

// POST /api/receiving-vouchers - Create receiving voucher
export const POST = asyncHandler(async (request: NextRequest) => {
  console.log('=== RECEIVING VOUCHER POST REQUEST START ===');
  const body = await request.json();
  console.log('Received receiving voucher data:', JSON.stringify(body, null, 2));

  // Validate input
  console.log('Starting validation...');
  const validationResult = createReceivingVoucherSchema.safeParse(body);
  if (!validationResult.success) {
    console.error('Validation error:', validationResult.error.flatten());
    return Response.json(
      {
        success: false,
        error: 'Validation failed',
        details: validationResult.error.flatten()
      },
      { status: 400 }
    );
  }
  const validatedData = validationResult.data;
  console.log('Validation passed, validated data:', JSON.stringify(validatedData, null, 2));

  // Create receiving voucher
  console.log('Calling receivingVoucherService.createReceivingVoucher...');
  const rv = await receivingVoucherService.createReceivingVoucher(validatedData);
  console.log('Receiving voucher created successfully:', rv.rvNumber);

  return Response.json({
    success: true,
    data: rv,
    message: `Receiving voucher ${rv.rvNumber} created successfully. ${rv.ReceivingVoucherItem.filter(i => Number(i.receivedQuantity) > 0).length} inventory batches created.`,
  });
});

// GET /api/receiving-vouchers - List receiving vouchers
export const GET = asyncHandler(async (request: NextRequest) => {
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

  return Response.json({
    success: true,
    data: rvs,
  });
});
