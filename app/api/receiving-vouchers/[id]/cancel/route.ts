import { NextRequest } from 'next/server';
import { asyncHandler } from '@/lib/api-error';
import { receivingVoucherService } from '@/services/receiving-voucher.service';
import { cancelReceivingVoucherSchema } from '@/lib/validations/receiving-voucher.validation';

export const dynamic = 'force-dynamic';

// POST /api/receiving-vouchers/[id]/cancel - Cancel a receiving voucher
export const POST = asyncHandler(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params;
  const body = await request.json();

  // Validate input
  const validationResult = cancelReceivingVoucherSchema.safeParse(body);
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

  // Cancel receiving voucher
  console.log('Calling receivingVoucherService.cancelReceivingVoucher...');
  const rv = await receivingVoucherService.cancelReceivingVoucher(id, validatedData);
  console.log('Receiving voucher cancelled successfully:', rv.rvNumber);

  return Response.json({
    success: true,
    data: rv,
    message: `Receiving voucher ${rv.rvNumber} cancelled successfully.`,
  });
});