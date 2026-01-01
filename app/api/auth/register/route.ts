import { NextRequest, NextResponse } from 'next/server';
import { authService } from '@/services/auth.service';
import { RegisterInput } from '@/types/auth.types';

export async function POST(request: NextRequest) {
  try {
    const body: RegisterInput = await request.json();

    // Validate required fields
    if (!body.email || !body.password || !body.firstName || !body.lastName || !body.roleId) {
      return NextResponse.json(
        { success: false, message: 'Email, password, first name, last name, and role are required' },
        { status: 400 }
      );
    }

    // Validate password length
    if (body.password.length < 8) {
      return NextResponse.json(
        { success: false, message: 'Password must be at least 8 characters long' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(body.email)) {
      return NextResponse.json(
        { success: false, message: 'Please provide a valid email address' },
        { status: 400 }
      );
    }

    // Get IP address and user agent
    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined;
    const userAgent = request.headers.get('user-agent') || undefined;

    // Attempt registration
    const result = await authService.registerUser(body, ipAddress, userAgent);

    if (!result.success) {
      return NextResponse.json(result, { status: 400 });
    }

    return NextResponse.json(result, { status: 201 });
  } catch (error: any) {
    console.error('Registration error:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
      code: error.code
    });

    // Check for specific Prisma errors
    if (error.code === 'P2002') {
      return NextResponse.json(
        { success: false, message: 'Email already registered' },
        { status: 400 }
      );
    }

    if (error.code === 'P2003') {
      return NextResponse.json(
        { success: false, message: 'Invalid role or branch selected. Please refresh and try again.' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: 'An error occurred during registration. Please try again.',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}
