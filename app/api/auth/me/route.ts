import { NextRequest, NextResponse } from 'next/server';
import { authService } from '@/services/auth.service';
import { userService } from '@/services/user.service';
import { permissionService } from '@/services/permission.service';

// GET /api/auth/me - Get current authenticated user
export async function GET(request: NextRequest) {
  try {
    // Get token from cookie
    const token = request.cookies.get('auth-token')?.value;
    
    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Not authenticated' },
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

    // Get user details
    const user = await userService.getUserById(payload.userId);

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }

    // Get user permissions
    const permissions = await permissionService.getUserPermissions(payload.userId);
    const permissionStrings = permissions.map(p => `${p.resource}:${p.action}`);

    return NextResponse.json({ 
      success: true, 
      user,
      permissions: permissionStrings
    }, { status: 200 });
  } catch (error) {
    console.error('Get current user error:', error);
    return NextResponse.json(
      { success: false, message: 'An error occurred' },
      { status: 500 }
    );
  }
}
