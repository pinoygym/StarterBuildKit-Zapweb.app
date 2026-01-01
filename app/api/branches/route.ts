import { NextRequest, NextResponse } from 'next/server';
import { branchService } from '@/services/branch.service';
import { AppError } from '@/lib/errors';

// GET /api/branches - Fetch all branches
export async function GET() {
  try {
    const branches = await branchService.getAllBranches();
    return NextResponse.json({ success: true, data: branches });
  } catch (error) {
    console.error('Error fetching branches:', error);
    
    if (error instanceof AppError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: error.statusCode }
      );
    }
    
    return NextResponse.json(
      { success: false, error: 'Failed to fetch branches' },
      { status: 500 }
    );
  }
}

// POST /api/branches - Create a new branch
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('Branch creation request body:', body);
    const branch = await branchService.createBranch(body);

    return NextResponse.json(
      { success: true, data: branch },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating branch:', error);
    console.error('Error details:', error instanceof Error ? error.message : error);

    if (error instanceof AppError) {
      return NextResponse.json(
        { success: false, error: error.message, fields: (error as any).fields },
        { status: error.statusCode }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to create branch' },
      { status: 500 }
    );
  }
}
