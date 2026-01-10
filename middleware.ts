import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from 'jose';

const PUBLIC_ROUTES = [
    '/login',
    '/register',
    '/forgot-password',
    '/reset-password',
    '/api/auth/login',
    '/api/auth/register',
    '/api/auth/forgot-password',
    '/api/auth/reset-password',
    '/api/auth/me',
    '/api/auth/verify-email',
    '/api/dev/seed',
];

const JWT_SECRET = new TextEncoder().encode(
    process.env.JWT_SECRET || 'your-fallback-secret-at-least-32-chars-long'
);

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Allow public routes
    if (PUBLIC_ROUTES.some(route => pathname.startsWith(route))) {
        return NextResponse.next();
    }

    // Skip auth for static files
    if (
        pathname.startsWith('/_next') ||
        pathname.startsWith('/api/_next') ||
        pathname.startsWith('/static') ||
        pathname.includes('favicon.ico')
    ) {
        return NextResponse.next();
    }

    let token = request.cookies.get('auth-token')?.value;
    let tokenFromHeader = false;

    // Support Bearer token for API requests
    if (!token) {
        const authHeader = request.headers.get('Authorization');
        if (authHeader?.startsWith('Bearer ')) {
            token = authHeader.substring(7);
            tokenFromHeader = true;
        }
    }

    if (!token) {
        if (pathname.startsWith('/api')) {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }
        const url = new URL('/login', request.url);
        url.searchParams.set('callbackUrl', pathname);
        return NextResponse.redirect(url);
    }

    try {
        await jwtVerify(token, JWT_SECRET);

        // If we got the token from the header, inject it as a cookie for downstream route handlers
        if (tokenFromHeader) {
            const requestHeaders = new Headers(request.headers);
            requestHeaders.set('Cookie', `auth-token=${token}`);
            return NextResponse.next({
                request: {
                    headers: requestHeaders,
                },
            });
        }

        return NextResponse.next();
    } catch (error) {
        if (pathname.startsWith('/api')) {
            return NextResponse.json({ success: false, message: 'Invalid token' }, { status: 401 });
        }
        const url = new URL('/login', request.url);
        url.searchParams.set('callbackUrl', pathname);
        return NextResponse.redirect(url);
    }
}

export const config = {
    matcher: [
        "/((?!_next/static|_next/image|favicon.ico|public).*)",
    ],
};
