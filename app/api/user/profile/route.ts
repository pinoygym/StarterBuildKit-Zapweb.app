import { asyncHandler } from '@/lib/api-error';
import { NextRequest } from 'next/server';
import { getAuthResult } from '@/middleware/auth.middleware';
import { userRepository } from '@/repositories/user.repository';

export const dynamic = 'force-dynamic';

export const GET = asyncHandler(async (request: NextRequest) {
  try {
    const authResult: { authenticated: boolean; user?: any } = await getAuthResult(request);

    if (!authResult.authenticated || !authResult.user) {
      return Response.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const user = await userRepository.findById(authResult.user.userId);

    if (!user) {
      return Response.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    return Response.json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        roleId: user.roleId,
        branchId: user.branchId,
        status: user.status,
        emailVerified: user.emailVerified,
        createdAt: user.createdAt,
        lastLoginAt: user.lastLoginAt,
        Role: user.Role,
        Branch: user.Branch,
      },
    });
  } catch (error: any) {
    console.error('Error fetching user profile:', error);
    return Response.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export const PUT = asyncHandler(async (request: NextRequest) {
  try {
    const authResult: { authenticated: boolean; user?: any } = await getAuthResult(request);

    if (!authResult.authenticated || !authResult.user) {
      return Response.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { firstName, lastName, phone } = body;

    // Validate required fields
    if (!firstName || !lastName) {
      return Response.json(
        { success: false, error: 'First name and last name are required' },
        { status: 400 }
      );
    }

    // Update user profile
    const updatedUser = await userRepository.update(authResult.user.userId, {
      firstName,
      lastName,
      phone: phone || null,
    });

    return Response.json({
      success: true,
      data: updatedUser,
      message: 'Profile updated successfully',
    });
  } catch (error: any) {
    console.error('Error updating user profile:', error);
    return Response.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
