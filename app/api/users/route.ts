import { NextRequest, NextResponse } from 'next/server';
import { userService } from '@/services/user.service';
import { authService } from '@/services/auth.service';
import { CreateUserInput, UserFilters } from '@/types/user.types';

// GET /api/users - Get all users with optional filters
export async function GET(request: NextRequest) {
  try {
    // Get token from cookie
    const token = request.cookies.get('auth-token')?.value;
    
    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    // Verify token
    const payload = authService.verifyToken(token);
    
    if (!payload) {
      return NextResponse.json(
        { success: false, message: 'Invalid session' },
        { status: 401 }
      );
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || undefined;
    const roleId = searchParams.get('roleId') || undefined;
    const branchId = searchParams.get('branchId') || undefined;
    const status = searchParams.get('status') as any || undefined;
    const emailVerified = searchParams.get('emailVerified') === 'true' ? true : searchParams.get('emailVerified') === 'false' ? false : undefined;

    const filters: UserFilters = {
      search,
      roleId,
      branchId,
      status,
      emailVerified,
    };

    const users = await userService.getAllUsers(filters, page, limit);

    return NextResponse.json(users, { status: 200 });
  } catch (error) {
    console.error('Get users error:', error);
    return NextResponse.json(
      { success: false, message: 'An error occurred while fetching users' },
      { status: 500 }
    );
  }
}

// POST /api/users - Create a new user
export async function POST(request: NextRequest) {
  try {
    // Get token from cookie
    const token = request.cookies.get('auth-token')?.value;
    
    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    // Verify token
    const payload = authService.verifyToken(token);
    
    if (!payload) {
      return NextResponse.json(
        { success: false, message: 'Invalid session' },
        { status: 401 }
      );
    }

    const body: CreateUserInput = await request.json();
    
    // Validate required fields
    if (!body.email || !body.password || !body.firstName || !body.lastName || !body.roleId) {
      return NextResponse.json(
        { success: false, message: 'Email, password, first name, last name, and role are required' },
        { status: 400 }
      );
    }

    // Get IP address and user agent
    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined;
    const userAgent = request.headers.get('user-agent') || undefined;

    // Create user
    const user = await userService.createUser(body, payload.userId, ipAddress, userAgent);

    return NextResponse.json({ success: true, user }, { status: 201 });
  } catch (error: any) {
    console.error('Create user error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'An error occurred while creating user' },
      { status: 400 }
    );
  }
}
