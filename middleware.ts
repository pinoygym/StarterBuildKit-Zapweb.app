import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

// Define public API routes that don't require authentication
const publicApiRoutes = [
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/verify-email',
  '/api/roles', // Allow fetching roles for registration page
  '/api/auth/me', // Allow checking auth status without 401
  '/api/dev', // Allow dev/seed routes for testing
];

// Define public page routes
const publicPageRoutes = [
  '/',
  '/login',
  '/register',
  '/verify-email',
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if this is an API route
  const isApiRoute = pathname.startsWith('/api');

  // Check if the route is public
  const isPublicApi = publicApiRoutes.some((route) => pathname.startsWith(route));
  const isPublicPage = publicPageRoutes.some((route) => pathname === route || pathname.startsWith(route + '/'));

  // Get the auth token from cookies or Authorization header
  const cookieToken = request.cookies.get('auth-token')?.value;
  const authHeader = request.headers.get('authorization');
  const headerToken = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;

  const token = cookieToken || headerToken;

  // Get JWT Secret for verification
  const JWT_SECRET = process.env.JWT_SECRET || (process.env.NODE_ENV !== 'production' ? 'your-secret-key-change-in-production' : '');

  // Function to verify token
  async function verifyAuth(token: string) {
    try {
      const { payload } = await jwtVerify(
        token,
        new TextEncoder().encode(JWT_SECRET)
      );
      return payload;
    } catch (error) {
      console.error('JWT Verification Error:', error);
      return null;
    }
  }

  // Handle API routes
  if (isApiRoute) {
    // If it's a public API route
    if (isPublicApi) {
      // Security Check: Restrict /api/dev in production
      if (pathname.startsWith('/api/dev') && process.env.NODE_ENV === 'production') {
        return NextResponse.json(
          { success: false, error: 'Access to /api/dev is restricted in production' },
          { status: 403 }
        );
      }
      return NextResponse.next();
    }

    // If it's a protected API route without token, return 401 JSON response
    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - Authentication token required' },
        { status: 401 }
      );
    }

    // Verify the token
    const verifiedToken = await verifyAuth(token);

    if (!verifiedToken) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - Invalid or expired token' },
        { status: 401 }
      );
    }

    // Token is valid, allow API request to proceed
    return NextResponse.next();
  }

  // Handle page routes
  // If accessing protected pages without a token, redirect to login
  if (!isPublicPage && !token) {
    const url = new URL('/login', request.url);
    url.searchParams.set('redirect', pathname);
    return NextResponse.redirect(url);
  }

  // If accessing login/register with a valid token, redirect to dashboard
  if ((pathname === '/login' || pathname === '/register') && token) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

// Configure which routes this middleware applies to
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
};