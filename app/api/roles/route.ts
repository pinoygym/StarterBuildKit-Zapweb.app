import { NextRequest, NextResponse } from 'next/server';
import { roleService } from '@/services/role.service';
import { authService } from '@/services/auth.service';

// GET /api/roles - Get all roles
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

    const roles = await roleService.getAllRoles();

    return NextResponse.json({ success: true, roles }, { status: 200 });
  } catch (error) {
    console.error('Get roles error:', error);
    return NextResponse.json(
      { success: false, message: 'An error occurred while fetching roles' },
      { status: 500 }
    );
  }
}

// POST /api/roles - Create a new role
export async function POST(request: NextRequest) {
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

    const body = await request.json();
    
    // Validate required fields
    if (!body.name || !body.code) {
      return NextResponse.json(
        { success: false, message: 'Name and code are required' },
        { status: 400 }
      );
    }

    // Get IP address and user agent
    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined;
    const userAgent = request.headers.get('user-agent') || undefined;

    // Create role
    const role = await roleService.createRole(body, payload.userId, ipAddress, userAgent);

    return NextResponse.json({ success: true, role }, { status: 201 });
  } catch (error: any) {
    console.error('Create role error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'An error occurred while creating role' },
      { status: 400 }
    );
  }
}
