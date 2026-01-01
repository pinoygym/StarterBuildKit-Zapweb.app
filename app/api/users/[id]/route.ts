import { NextRequest } from 'next/server';
import { asyncHandler } from '@/lib/api-error';
import { userService } from '@/services/user.service';
import { authService } from '@/services/auth.service';
import { UpdateUserInput } from '@/types/user.types';

export const dynamic = 'force-dynamic';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

// GET /api/users/[id] - Get a specific user
export const GET = asyncHandler(async (request: NextRequest, { params }: RouteParams) => {
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

  const { id } = await params;
  const user = await userService.getUserById(id);

  if (!user) {
    return Response.json(
      { success: false, message: 'User not found' },
      { status: 404 }
    );
  }

  return Response.json({ success: true, user }, { status: 200 });
});

// PUT /api/users/[id] - Update a user
export const PUT = asyncHandler(async (request: NextRequest, { params }: RouteParams) => {
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

  const body: UpdateUserInput = await request.json();

  // Get IP address and user agent
  const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined;
  const userAgent = request.headers.get('user-agent') || undefined;

  // Update user
  const { id } = await params;
  const user = await userService.updateUser(id, body, payload.userId, ipAddress, userAgent);

  return Response.json({ success: true, user }, { status: 200 });
});

// DELETE /api/users/[id] - Delete (deactivate) a user
export const DELETE = asyncHandler(async (request: NextRequest, { params }: RouteParams) => {
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

  // Get IP address and user agent
  const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined;
  const userAgent = request.headers.get('user-agent') || undefined;

  // Delete user
  const { id } = await params;
  await userService.deleteUser(id, payload.userId, ipAddress, userAgent);

  return Response.json({ success: true, message: 'User deleted successfully' }, { status: 200 });
});
