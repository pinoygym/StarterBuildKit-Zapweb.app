import { NextRequest, NextResponse } from 'next/server';
import { authService } from '@/services/auth.service';
import { JWTPayload } from '@/types/auth.types';

export interface AuthenticatedRequest extends NextRequest {
  user?: JWTPayload;
}

/**
 * Middleware to verify JWT token and attach user info to request
 */
export async function withAuth(
  request: NextRequest,
  handler: (req: AuthenticatedRequest) => Promise<NextResponse>
): Promise<NextResponse> {
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
        { success: false, message: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    // Validate session exists and is not expired
    const session = await authService.validateSession(token);

    if (!session) {
      return NextResponse.json(
        { success: false, message: 'Session expired or invalid' },
        { status: 401 }
      );
    }

    // Attach user info to request
    const authenticatedRequest = request as AuthenticatedRequest;
    authenticatedRequest.user = payload;

    // Call the handler
    return await handler(authenticatedRequest);
  } catch (error) {
    console.error('Authentication middleware error:', error);
    return NextResponse.json(
      { success: false, message: 'Authentication failed' },
      { status: 401 }
    );
  }
}

/**
 * Extract user from request (helper function)
 */
export function getUser(request: NextRequest): JWTPayload | null {
  const token = request.cookies.get('auth-token')?.value;
  if (!token) return null;
  
  return authService.verifyToken(token);
}

/**
 * Check if user is authenticated (helper function)
 */
export function isAuthenticated(request: NextRequest): boolean {
  return getUser(request) !== null;
}
