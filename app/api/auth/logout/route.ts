import { NextRequest, NextResponse } from 'next/server';
import { authService } from '@/services/auth.service';

export async function POST(request: NextRequest) {
  try {
    console.log('Logout API called');

    // Get token from cookie
    const token = request.cookies.get('auth-token')?.value;
    console.log('Token from cookie:', token ? 'present' : 'missing');

    if (!token) {
      console.log('No token found, returning 401');
      return NextResponse.json(
        { success: false, message: 'No active session found' },
        { status: 401 }
      );
    }

    // Verify token
    const payload = authService.verifyToken(token);
    console.log('Token verification result:', payload ? 'valid' : 'invalid');

    if (!payload) {
      console.log('Invalid token, returning 401');
      return NextResponse.json(
        { success: false, message: 'Invalid session' },
        { status: 401 }
      );
    }

    console.log('Token valid, proceeding with logout for user:', payload.userId);

    // Get IP address and user agent
    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined;
    const userAgent = request.headers.get('user-agent') || undefined;

    // Logout
    console.log('Calling authService.logout...');
    await authService.logout(token, payload.userId, ipAddress, userAgent);
    console.log('authService.logout completed successfully');

    // Clear the cookie with explicit settings
    console.log('Clearing auth-token cookie');
    const response = NextResponse.json(
      { success: true, message: 'Logged out successfully' },
      { status: 200 }
    );

    // Delete cookie with the same settings used when setting it
    response.cookies.set('auth-token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0, // Expire immediately
      path: '/',
    });
    console.log('Logout API completed successfully');

    return response;
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { success: false, message: 'An error occurred during logout' },
      { status: 500 }
    );
  }
}
