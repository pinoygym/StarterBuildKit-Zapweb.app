import { asyncHandler } from '@/lib/api-error';
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { randomBytes, randomUUID } from 'crypto';
import { emailService } from '@/lib/email/email.service';

export const dynamic = 'force-dynamic';

export const POST = asyncHandler(async (request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return Response.json(
        { success: false, message: 'Email is required' },
        { status: 400 }
      );
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    // Always return success even if user doesn't exist (security best practice)
    if (!user) {
      return Response.json({
        success: true,
        message: 'If an account exists with that email, a reset link has been sent',
      });
    }

    // Check if user is active
    if (user.status !== 'ACTIVE') {
      return Response.json({
        success: true,
        message: 'If an account exists with that email, a reset link has been sent',
      });
    }

    // Generate reset token
    const resetToken = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Store reset token in database
    await prisma.passwordResetToken.create({
      data: {
        id: randomUUID(),
        userId: user.id,
        token: resetToken,
        expiresAt,
        used: false,
      },
    });

    // Send email with reset link
    const resetUrl = `${process.env.APP_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;

    try {
      await emailService.sendPasswordResetEmail(user.email, user.firstName, resetUrl);
    } catch (emailError) {
      console.error('Failed to send reset email:', emailError);
      // Don't expose email sending errors to user
    }

    return Response.json({
      success: true,
      message: 'If an account exists with that email, a reset link has been sent',
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    return Response.json(
      { success: false, message: 'An error occurred. Please try again later.' },
      { status: 500 }
    );
  }
}
