import { NextRequest, NextResponse } from 'next/server';
import { userService } from '@/services/user.service';
import { authService } from '@/services/auth.service';

interface RouteParams {
  params: {
    id: string;
  };
}

// POST /api/users/[id]/verify - Verify a user's email
export async function POST(request: NextRequest, { params }: RouteParams) {
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

    // Get IP address and user agent
    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined;
    const userAgent = request.headers.get('user-agent') || undefined;

    // Verify user
    const user = await userService.updateUser(
      params.id, 
      { emailVerified: true }, 
      payload.userId, 
      ipAddress, 
      userAgent
    );

    return NextResponse.json({ success: true, user }, { status: 200 });
  } catch (error: any) {
    console.error('Verify user error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'An error occurred while verifying user' },
      { status: 400 }
    );
  }
}