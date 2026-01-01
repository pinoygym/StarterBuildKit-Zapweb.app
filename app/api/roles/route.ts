import { NextRequest } from 'next/server';
import { asyncHandler } from '@/lib/api-error';
import { roleService } from '@/services/role.service';
import { authService } from '@/services/auth.service';
import { userHasPermission } from '@/middleware/permission.middleware';

export const dynamic = 'force-dynamic';

// GET /api/roles - Get all roles
export const GET = asyncHandler(async (request: NextRequest) => {
  // Get token from cookie
  const token = request.cookies.get('auth-token')?.value;

  if (!token) {
    return Response.json(
      { success: false, message: 'Authentication required' },
      { status: 401 }
    );
  }

  // Verify token
  const payload = authService.verifyToken(token);

  if (!payload) {
    return Response.json(
      { success: false, message: 'Invalid session' },
      { status: 401 }
    );
  }

  // Check permission
  const hasPermission = await userHasPermission(
    payload.userId,
    'ROLES' as any,
    'READ' as any
  );

  if (!hasPermission) {
    return Response.json(
      {
        success: false,
        message: 'You do not have permission to view roles',
        required: 'ROLES:READ'
      },
      { status: 403 }
    );
  }

  // Fetch all roles with permissions
  const roles = await roleService.getAllRolesWithPermissions();

  return Response.json({ success: true, roles }, { status: 200 });
});

// POST /api/roles - Create a new role
export const POST = asyncHandler(async (request: NextRequest) => {
  // Get token from cookie
  const token = request.cookies.get('auth-token')?.value;

  if (!token) {
    return Response.json(
      { success: false, message: 'Authentication required' },
      { status: 401 }
    );
  }

  // Verify token
  const payload = authService.verifyToken(token);

  if (!payload) {
    return Response.json(
      { success: false, message: 'Invalid session' },
      { status: 401 }
    );
  }

  // Check permission
  const hasPermission = await userHasPermission(
    payload.userId,
    'ROLES' as any,
    'CREATE' as any
  );

  if (!hasPermission) {
    return Response.json(
      {
        success: false,
        message: 'You do not have permission to create roles',
        required: 'ROLES:CREATE'
      },
      { status: 403 }
    );
  }

  const body = await request.json();

  // Validate required fields
  if (!body.name) {
    return Response.json(
      { success: false, message: 'Name is required' },
      { status: 400 }
    );
  }

  // Get IP address and user agent
  const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined;
  const userAgent = request.headers.get('user-agent') || undefined;

  // Create role
  const role = await roleService.createRole(body, payload.userId, ipAddress, userAgent);

  return Response.json({ success: true, role }, { status: 201 });
});
