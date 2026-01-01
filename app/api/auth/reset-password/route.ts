import { asyncHandler } from '@/lib/api-error';
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export const dynamic = 'force-dynamic';

export const POST = asyncHandler(async (request: NextRequest) {
  try {
    const { token, password } = await request.json();

    if (!token || !password) {
      return Response.json(
        { success: false, message: 'Token and password are required' },
        { status: 400 }
      );
    }

    // Validate password strength
    if (password.length < 8) {
      return Response.json(
        { success: false, message: 'Password must be at least 8 characters long' },
        { status: 400 }
      );
    }

    // Find valid reset token
    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { token },
      include: { User: true },
    });

    if (!resetToken) {
      return Response.json(
        { success: false, message: 'Invalid or expired reset token' },
        { status: 400 }
      );
    }

    // Check if token has expired
    if (new Date() > resetToken.expiresAt) {
      return Response.json(
        { success: false, message: 'Reset token has expired' },
        { status: 400 }
      );
    }

    // Check if token has already been used
    if (resetToken.used) {
      return Response.json(
        { success: false, message: 'Reset token has already been used' },
        { status: 400 }
      );
    }

    // Hash new password
    const passwordHash = await bcrypt.hash(password, 12);

    // Update user password and mark token as used in a transaction
    await prisma.$transaction([
      prisma.user.update({
        where: { id: resetToken.userId },
        data: {
          passwordHash,
          passwordChangedAt: new Date(),
        },
      }),
      prisma.passwordResetToken.update({
        where: { id: resetToken.id },
        data: { used: true },
      }),
      // Invalidate all sessions for this user (force re-login)
      prisma.session.deleteMany({
        where: { userId: resetToken.userId },
      }),
    ]);

    return Response.json({
      success: true,
      message: 'Password reset successfully',
    });
  } catch (error) {
    console.error('Reset password error:', error);
    return Response.json(
      { success: false, message: 'An error occurred. Please try again later.' },
      { status: 500 }
    );
  }
}
