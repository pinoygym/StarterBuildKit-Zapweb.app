import { NextRequest } from 'next/server';

/**
 * Extract authentication token from request
 * Checks Authorization header first (Bearer token), then cookies
 */
export function extractToken(request: NextRequest): string | undefined {
    // Check Authorization header first (Bearer token)
    const authHeader = request.headers.get('authorization');
    if (authHeader?.startsWith('Bearer ')) {
        return authHeader.substring(7);
    }

    // Fallback to cookie
    return request.cookies.get('auth-token')?.value;
}
