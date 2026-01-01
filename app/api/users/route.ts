import { NextRequest } from 'next/server';
import { asyncHandler } from '@/lib/api-error';
import { userService } from '@/services/user.service';
import { authService } from '@/services/auth.service';
import { CreateUserInput, UserFilters } from '@/types/user.types';

export const dynamic = 'force-dynamic';

// GET /api/users - Get all users with optional filters
export const GET = asyncHandler(async (request: NextRequest) => {
  // Get token from cookie
  const token = request.cookies.get('auth-token')?.value;

  if (!token) {
    return Response.json(
      { success: false, message: 'Authentication required' },
      { status: 401 }
    );
  }

  // Verify token
  const payload = authService.verifyToken(token);

  if (!payload) {
    return Response.json(
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

  // Get current user to check if they are Super Mega Admin
  const currentUser = await userService.getUserById(payload.userId);
  const isSuperMegaAdmin = currentUser?.isSuperMegaAdmin || false;

  const filters: UserFilters = {
    search,
    roleId,
    branchId,
    status,
    emailVerified,
    includeSuperMegaAdmin: isSuperMegaAdmin,
  };

  const users = await userService.getAllUsers(filters, page, limit);

  return Response.json(users, { status: 200 });
});

// POST /api/users - Create a new user
export const POST = asyncHandler(async (request: NextRequest) => {
  // Get token from cookie
  const token = request.cookies.get('auth-token')?.value;

  if (!token) {
    return Response.json(
      { success: false, message: 'Authentication required' },
      { status: 401 }
    );
  }

  // Verify token
  const payload = authService.verifyToken(token);

  if (!payload) {
    return Response.json(
      { success: false, message: 'Invalid session' },
      { status: 401 }
    );
  }

  const body: CreateUserInput = await request.json();

  // Validate required fields
  if (!body.email || !body.password || !body.firstName || !body.lastName || !body.roleId) {
    return Response.json(
      { success: false, message: 'Email, password, first name, last name, and role are required' },
      { status: 400 }
    );
  }

  // Get IP address and user agent
  const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined;
  const userAgent = request.headers.get('user-agent') || undefined;

  // Create user
  const user = await userService.createUser(body, payload.userId, ipAddress, userAgent);

  return Response.json({ success: true, user }, { status: 201 });
});
