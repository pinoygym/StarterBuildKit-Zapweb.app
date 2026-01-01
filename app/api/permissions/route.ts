import { NextRequest, NextResponse } from 'next/server';
import { permissionService } from '@/services/permission.service';
import { authService } from '@/services/auth.service';

// GET /api/permissions - Get all permissions
export async function GET(request: NextRequest) {
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

    // Check if we need grouped permissions
    const { searchParams } = new URL(request.url);
    const grouped = searchParams.get('grouped') === 'true';

    let permissions;
    if (grouped) {
      permissions = await permissionService.getPermissionsGrouped();
    } else {
      permissions = await permissionService.getAllPermissions();
    }

    return NextResponse.json({ success: true, permissions }, { status: 200 });
  } catch (error) {
    console.error('Get permissions error:', error);
    return NextResponse.json(
      { success: false, message: 'An error occurred while fetching permissions' },
      { status: 500 }
    );
  }
}
