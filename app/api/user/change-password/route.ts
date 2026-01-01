import { NextRequest, NextResponse } from 'next/server';
import { authMiddleware } from '@/middleware/auth.middleware';
import { authService } from '@/services/auth.service';

export async function POST(request: NextRequest) {
  try {
    const authResult = await authMiddleware(request);

    if (!authResult.authenticated || !authResult.user) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { oldPassword, newPassword } = body;

    // Validate required fields
    if (!oldPassword || !newPassword) {
      return NextResponse.json(
        { success: false, message: 'Current password and new password are required' },
        { status: 400 }
      );
    }

    // Validate password strength
    if (newPassword.length < 8) {
      return NextResponse.json(
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
      return NextResponse.json(
        { success: false, message: result.message },
        { status: 400 }
      );
    }

    // Clear the auth cookie to force re-login
    const response = NextResponse.json({
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
    return NextResponse.json(
      { success: false, message: error.message || 'An error occurred while changing password' },
      { status: 500 }
    );
  }
}
