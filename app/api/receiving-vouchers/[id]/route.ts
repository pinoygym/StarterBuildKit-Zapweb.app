import { NextRequest } from 'next/server';
import { asyncHandler } from '@/lib/api-error';
import { receivingVoucherService } from '@/services/receiving-voucher.service';

export const dynamic = 'force-dynamic';

// GET /api/receiving-vouchers/[id] - Get single receiving voucher
export const GET = asyncHandler(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params;
  const rv = await receivingVoucherService.getReceivingVoucherById(id);

  return Response.json({
    success: true,
    data: rv,
  });
});
