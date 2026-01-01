import { NextRequest } from 'next/server';
import { asyncHandler } from '@/lib/api-error';
import { permissionService } from '@/services/permission.service';
import { authService } from '@/services/auth.service';

export const dynamic = 'force-dynamic';

// GET /api/permissions - Get all permissions
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

  // Check if we need grouped permissions
  const { searchParams } = new URL(request.url);
  const grouped = searchParams.get('grouped') === 'true';

  let permissions;
  if (grouped) {
    permissions = await permissionService.getPermissionsGrouped();
  } else {
    permissions = await permissionService.getAllPermissions();
  }

  return Response.json({ success: true, permissions }, { status: 200 });
});
