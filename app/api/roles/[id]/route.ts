import { NextRequest, NextResponse } from 'next/server';
import { roleService } from '@/services/role.service';
import { authService } from '@/services/auth.service';
import { updateRoleSchema } from '@/lib/validations/role.validation';
import { userHasPermission } from '@/middleware/permission.middleware';
import { PermissionResource, PermissionAction } from '@prisma/client';

/**
 * GET /api/roles/[id]
 * Fetch a single role by ID with permissions
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
          message: 'You do not have permission to view roles',
          required: 'ROLES:READ'
        },
        { status: 403 }
      );
    }

    const role = await roleService.getRoleById(params.id);

    if (!role) {
      return NextResponse.json(
        { success: false, message: 'Role not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      role,
    });
  } catch (error: any) {
    console.error('Get role error:', error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || 'Failed to fetch role',
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/roles/[id]
 * Update a role's details (name, description)
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
          message: 'You do not have permission to update roles',
          required: 'ROLES:UPDATE'
        },
        { status: 403 }
      );
    }

    const body = await request.json();

    // Validate input
    const validationResult = updateRoleSchema.safeParse(body);
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

    // Get IP address and user agent
    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined;
    const userAgent = request.headers.get('user-agent') || undefined;

    const role = await roleService.updateRole(
      params.id,
      validationResult.data,
      payload.userId,
      ipAddress,
      userAgent
    );

    return NextResponse.json({
      success: true,
      role,
      message: 'Role updated successfully',
    });
  } catch (error: any) {
    console.error('Update role error:', error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || 'Failed to update role',
      },
      { status: 400 }
    );
  }
}

/**
 * DELETE /api/roles/[id]
 * Delete a role
 */
export async function DELETE(
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
      PermissionAction.DELETE
    );

    if (!hasPermission) {
      return NextResponse.json(
        {
          success: false,
          message: 'You do not have permission to delete roles',
          required: 'ROLES:DELETE'
        },
        { status: 403 }
      );
    }

    // Get IP address and user agent
    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined;
    const userAgent = request.headers.get('user-agent') || undefined;

    await roleService.deleteRole(params.id, payload.userId, ipAddress, userAgent);

    return NextResponse.json({
      success: true,
      message: 'Role deleted successfully',
    });
  } catch (error: any) {
    console.error('Delete role error:', error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || 'Failed to delete role',
      },
      { status: 400 }
    );
  }
}
