import { NextRequest, NextResponse } from 'next/server';
import { permissionService } from '@/services/permission.service';
import { authService } from '@/services/auth.service';
import { PermissionResource, PermissionAction } from '@prisma/client';

/**
 * Middleware to check if user has required permission
 */
export async function withPermission(
  request: NextRequest,
  requiredResource: PermissionResource,
  requiredAction: PermissionAction,
  handler: (req: NextRequest) => Promise<NextResponse>
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

    // Get user permissions
    const permissions = await permissionService.getUserPermissions(payload.userId);

    // Check if user has required permission
    const hasPermission = permissions.some(
      (p) => p.resource === requiredResource && p.action === requiredAction
    );

    if (!hasPermission) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'You do not have permission to perform this action',
          required: `${requiredResource}:${requiredAction}`
        },
        { status: 403 }
      );
    }

    // Call the handler
    return await handler(request);
  } catch (error) {
    console.error('Permission middleware error:', error);
    return NextResponse.json(
      { success: false, message: 'Authorization failed' },
      { status: 403 }
    );
  }
}

/**
 * Middleware to check if user has any of the required permissions
 */
export async function withAnyPermission(
  request: NextRequest,
  requiredPermissions: Array<{ resource: PermissionResource; action: PermissionAction }>,
  handler: (req: NextRequest) => Promise<NextResponse>
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

    // Get user permissions
    const permissions = await permissionService.getUserPermissions(payload.userId);

    // Check if user has any of the required permissions
    const hasAnyPermission = requiredPermissions.some((required) =>
      permissions.some(
        (p) => p.resource === required.resource && p.action === required.action
      )
    );

    if (!hasAnyPermission) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'You do not have the required permissions to perform this action'
        },
        { status: 403 }
      );
    }

    // Call the handler
    return await handler(request);
  } catch (error) {
    console.error('Permission middleware error:', error);
    return NextResponse.json(
      { success: false, message: 'Authorization failed' },
      { status: 403 }
    );
  }
}

/**
 * Check if user has specific permission (helper function)
 */
export async function userHasPermission(
  userId: string,
  resource: PermissionResource,
  action: PermissionAction
): Promise<boolean> {
  try {
    const permissions = await permissionService.getUserPermissions(userId);
    return permissions.some((p) => p.resource === resource && p.action === action);
  } catch (error) {
    console.error('Error checking permission:', error);
    return false;
  }
}
