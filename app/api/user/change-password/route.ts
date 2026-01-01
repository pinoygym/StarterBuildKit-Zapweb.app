import { asyncHandler } from '@/lib/api-error';
import { NextRequest } from 'next/server';
import { getAuthResult } from '@/middleware/auth.middleware';
import { authService } from '@/services/auth.service';

export const dynamic = 'force-dynamic';

export const POST = asyncHandler(async (request: NextRequest) {
  try {
    const authResult: { authenticated: boolean; user?: any } = await getAuthResult(request);

    if (!authResult.authenticated || !authResult.user) {
      return Response.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { oldPassword, newPassword } = body;

    // Validate required fields
    if (!oldPassword || !newPassword) {
      return Response.json(
        { success: false, message: 'Current password and new password are required' },
        { status: 400 }
      );
    }

    // Validate password strength
    if (newPassword.length < 8) {
      return Response.json(
        { success: false, message: 'New password must be at least 8 characters long' },
        { status: 400 }
      );
    }

    // Get IP address and user agent for audit logging
    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined;
    const userAgent = request.headers.get('user-agent') || undefined;

    // Change password using auth service
    const result = await authService.changePassword(
      authResult.user.userId,
      oldPassword,
      newPassword,
      ipAddress,
      userAgent
    );

    if (!result.success) {
      return Response.json(
        { success: false, message: result.message },
        { status: 400 }
      );
    }

    // Clear the auth cookie to force re-login
    const response = Response.json({
      success: true,
      message: 'Password changed successfully. Please log in again.',
    });

    response.cookies.set('auth-token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0,
      path: '/',
    });

    return response;
  } catch (error: any) {
    console.error('Error changing password:', error);
    return Response.json(
      { success: false, message: error.message || 'An error occurred while changing password' },
      { status: 500 }
    );
  }
}
