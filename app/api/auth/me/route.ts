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

    const shapedUser = {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      roleId: user.roleId,
      branchId: user.branchId,
      status: user.status,
      emailVerified: user.emailVerified,
      role: {
        id: user.Role.id,
        name: user.Role.name,
        description: user.Role.description,
      },
      branch: user.Branch ? {
        id: user.Branch.id,
        name: user.Branch.name,
        code: user.Branch.code,
      } : undefined,
    };

    return NextResponse.json({ 
      success: true, 
      user: shapedUser,
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
