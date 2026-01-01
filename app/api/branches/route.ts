import { NextRequest } from 'next/server';
import { asyncHandler } from '@/lib/api-error';
import { branchService } from '@/services/branch.service';

export const dynamic = 'force-dynamic';

// GET /api/branches - Fetch all branches
export const GET = asyncHandler(async () => {
  const branches = await branchService.getAllBranches();
  return Response.json({ success: true, data: branches });
});

// POST /api/branches - Create a new branch
export const POST = asyncHandler(async (request: NextRequest) => {
  const body = await request.json();
  console.log('Branch creation request body:', body);
  const branch = await branchService.createBranch(body);

  return Response.json(
    { success: true, data: branch },
    { status: 201 }
  );
});
