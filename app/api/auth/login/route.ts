import { NextRequest, NextResponse } from 'next/server';
import { authService } from '@/services/auth.service';
import { LoginInput } from '@/types/auth.types';

export async function POST(request: NextRequest) {
  try {
    const body: LoginInput = await request.json();
    
    // Validate required fields
    if (!body.email || !body.password) {
      return NextResponse.json(
        { success: false, message: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Get IP address and user agent
    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined;
    const userAgent = request.headers.get('user-agent') || undefined;

    // Attempt login
    const result = await authService.login(body, ipAddress, userAgent);

    if (!result.success) {
      return NextResponse.json(result, { status: 401 });
    }

    // Set HTTP-only cookie with the token
    const response = NextResponse.json(result, { status: 200 });
    
    if (result.token) {
      response.cookies.set('auth-token', result.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24, // 24 hours
        path: '/',
      });
    }

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { success: false, message: 'An error occurred during login' },
      { status: 500 }
    );
  }
}
