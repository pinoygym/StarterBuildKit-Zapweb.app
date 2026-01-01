import { NextRequest } from 'next/server';
import { asyncHandler } from '@/lib/api-error';
import { branchService } from '@/services/branch.service';

export const dynamic = 'force-dynamic';

// GET /api/branches/[id] - Fetch single branch
export const GET = asyncHandler(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params;
  const branch = await branchService.getBranchById(id);
  return Response.json({ success: true, data: branch });
});

// PUT /api/branches/[id] - Update branch
export const PUT = asyncHandler(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params;
  const body = await request.json();
  const branch = await branchService.updateBranch(id, body);

  return Response.json({ success: true, data: branch });
});

// DELETE /api/branches/[id] - Delete branch
export const DELETE = asyncHandler(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params;
  await branchService.deleteBranch(id);
  return Response.json({ success: true, message: 'Branch deleted successfully' });
});
