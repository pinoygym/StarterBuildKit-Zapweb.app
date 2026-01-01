import { asyncHandler } from '@/lib/api-error';
import { NextRequest } from 'next/server';
import { authService } from '@/services/auth.service';

export const dynamic = 'force-dynamic';

export const POST = asyncHandler(async (request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.userId) {
      return Response.json(
        { success: false, message: 'User ID is required' },
        { status: 400 }
      );
    }

    // Get IP address and user agent
    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined;
    const userAgent = request.headers.get('user-agent') || undefined;

    // Verify email
    const result = await authService.verifyEmail(body.userId, ipAddress, userAgent);

    return Response.json(result, { status: 200 });
  } catch (error) {
    console.error('Email verification error:', error);
    return Response.json(
      { success: false, message: 'An error occurred during email verification' },
      { status: 500 }
    );
  }
}
