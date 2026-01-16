import { NextRequest, NextResponse } from 'next/server';
import { authService } from '@/services/auth.service';
import { userService } from '@/services/user.service';
import { permissionService } from '@/services/permission.service';

export const dynamic = 'force-dynamic';

// GET /api/auth/me - Get current authenticated user
export async function GET(request: NextRequest) {

  console.log('Method:', request.method);
  console.log('URL:', request.url);
  console.log('Headers:', Object.fromEntries(request.headers.entries()));

  try {
    console.log('Processing /api/auth/me request');

    // Get token from cookie
    const token = request.cookies.get('auth-token')?.value;
    console.log('Token from cookie:', token ? `present (${token.substring(0, 20)}...)` : 'MISSING');

    // Also check Authorization header
    const authHeader = request.headers.get('authorization');
    console.log('Authorization header:', authHeader ? `present (${authHeader.substring(0, 20)}...)` : 'missing');

    if (!token) {
      console.log('ℹ️ No token found, returning 200 with null user');
      const response = NextResponse.json(
        { success: true, user: null, message: 'Not authenticated', debug: { hasToken: false } },
        { status: 200 }
      );
      response.headers.set('Cache-Control', 'no-store');
      console.log('=== /api/auth/me REQUEST END (200 - No Token) ===');
      return response;
    }

    // Verify token
    console.log('🔍 Verifying token...');
    const payload = authService.verifyToken(token);
    console.log('Token verification result:', payload ? `valid for user ${payload.userId}` : 'INVALID');

    if (!payload) {
      console.log('ℹ️ Invalid token, returning 200 with null user');
      const response = NextResponse.json(
        { success: true, user: null, message: 'Invalid session', debug: { tokenValid: false } },
        { status: 200 }
      );
      response.headers.set('Cache-Control', 'no-store');
      response.cookies.delete('auth-token'); // <--- Clears stale cookie
      console.log('=== /api/auth/me REQUEST END (200 - Invalid Token) ===');
      return response;
    }

    console.log('✅ Token valid for user:', payload.userId);

    // Get user details
    console.log('🔍 Fetching user details for ID:', payload.userId);
    const user = await userService.getUserById(payload.userId);
    console.log('User lookup result:', user ? `found (${user.email})` : 'NOT FOUND');

    if (!user) {
      console.log('ℹ️ User not found, returning 200 with null user');
      const response = NextResponse.json(
        { success: true, user: null, message: 'User not found', debug: { userExists: false } },
        { status: 200 }
      );
      response.cookies.delete('auth-token'); // <--- Clears stale cookie
      console.log('=== /api/auth/me REQUEST END (200 - User Not Found) ===');
      return response;
    }

    // Get user permissions
    console.log('🔍 Fetching user permissions...');
    const permissions = await permissionService.getUserPermissions(payload.userId);
    const permissionStrings = permissions.map((p: { resource: string; action: string }) => `${p.resource}:${p.action}`);
    console.log('✅ Permissions loaded:', permissionStrings.length, 'permissions');

    const shapedUser = {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      roleId: user.roleId,
      branchId: user.branchId,
      status: user.status,
      emailVerified: user.emailVerified,
      isSuperMegaAdmin: (user as any).isSuperMegaAdmin, // Cast until type is updated
      branchLockEnabled: user.branchLockEnabled,
      Role: {
        id: user.Role.id,
        name: user.Role.name,
        description: user.Role.description,
      },
      Branch: user.Branch ? {
        id: user.Branch.id,
        name: user.Branch.name,
        code: user.Branch.code,
      } : undefined,
    };

    console.log('✅ User data shaped successfully');
    const response = NextResponse.json({
      success: true,
      user: shapedUser,
      permissions: permissionStrings,
      debug: { requestProcessed: true }
    }, { status: 200 });

    // Add cache control headers to prevent Chrome from caching auth state
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');

    console.log('=== /api/auth/me REQUEST END (200) ===');
    return response;
  } catch (error) {
    console.error('❌ Get current user error:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    const response = NextResponse.json(
      { success: false, message: 'An error occurred', debug: { error: error instanceof Error ? error.message : 'Unknown error' } },
      { status: 500 }
    );
    console.log('=== /api/auth/me REQUEST END (500) ===');
    return response;
  }
}
