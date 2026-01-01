import { NextRequest, NextResponse } from 'next/server';
import { roleService } from '@/services/role.service';
import { authService } from '@/services/auth.service';
import { assignPermissionsSchema } from '@/lib/validations/role.validation';
import { userHasPermission } from '@/middleware/permission.middleware';
import { PermissionResource, PermissionAction } from '@prisma/client';

/**
 * GET /api/roles/[id]/permissions
 * Get all permissions assigned to a role
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // Check permission
    const hasPermission = await userHasPermission(
      payload.userId,
      PermissionResource.ROLES,
      PermissionAction.READ
    );

    if (!hasPermission) {
      return NextResponse.json(
        {
          success: false,
          message: 'You do not have permission to view role permissions',
          required: 'ROLES:READ'
        },
        { status: 403 }
      );
    }

    const permissions = await roleService.getRolePermissions(params.id);

    return NextResponse.json({
      success: true,
      permissions,
    });
  } catch (error: any) {
    console.error('Get role permissions error:', error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || 'Failed to fetch role permissions',
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/roles/[id]/permissions
 * Bulk assign/update permissions for a role
 * This replaces all existing permissions with the provided list
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // Check permission
    const hasPermission = await userHasPermission(
      payload.userId,
      PermissionResource.ROLES,
      PermissionAction.UPDATE
    );

    if (!hasPermission) {
      return NextResponse.json(
        {
          success: false,
          message: 'You do not have permission to update role permissions',
          required: 'ROLES:UPDATE'
        },
        { status: 403 }
      );
    }

    const body = await request.json();

    // Validate input
    const validationResult = assignPermissionsSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          message: 'Validation failed',
          errors: validationResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { permissionIds } = validationResult.data;

    // Get IP address and user agent
    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined;
    const userAgent = request.headers.get('user-agent') || undefined;

    // Assign permissions to role
    await roleService.assignPermissions(
      params.id,
      permissionIds,
      payload.userId,
      ipAddress,
      userAgent
    );

    // Fetch updated role with permissions
    const role = await roleService.getRoleById(params.id);

    return NextResponse.json({
      success: true,
      role,
      message: 'Permissions updated successfully',
    });
  } catch (error: any) {
    console.error('Update role permissions error:', error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || 'Failed to update permissions',
      },
      { status: 400 }
    );
  }
}
