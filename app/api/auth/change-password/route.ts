import { asyncHandler } from '@/lib/api-error';
import { NextRequest } from 'next/server';
import { authService } from '@/services/auth.service';

export const dynamic = 'force-dynamic';

export const POST = asyncHandler(async (request: NextRequest) {
  try {
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

    const body = await request.json();

    // Validate required fields
    if (!body.oldPassword || !body.newPassword) {
      return Response.json(
        { success: false, message: 'Old password and new password are required' },
        { status: 400 }
      );
    }

    // Validate password length
    if (body.newPassword.length < 8) {
      return Response.json(
        { success: false, message: 'New password must be at least 8 characters long' },
        { status: 400 }
      );
    }

    // Get IP address and user agent
    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined;
    const userAgent = request.headers.get('user-agent') || undefined;

    // Change password
    const result = await authService.changePassword(
      payload.userId,
      body.oldPassword,
      body.newPassword,
      ipAddress,
      userAgent
    );

    return Response.json(result, { status: 200 });
  } catch (error) {
    console.error('Password change error:', error);
    return Response.json(
      { success: false, message: 'An error occurred while changing password' },
      { status: 500 }
    );
  }
}
