import { NextRequest, NextResponse } from 'next/server';
import { authService } from '@/services/auth.service';
import { userService } from '@/services/user.service';
import { exec } from 'child_process';
import util from 'util';

const execPromise = util.promisify(exec);

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    // 1. Authentication & Authorization
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const payload = authService.verifyToken(token);
    if (!payload) {
      return NextResponse.json({ success: false, message: 'Invalid token' }, { status: 401 });
    }

    const user = await userService.getUserById(payload.userId);
    if (!user || !(user as any).isSuperMegaAdmin) {
      return NextResponse.json({ success: false, message: 'Forbidden: Super Mega Admin Access Required' }, { status: 403 });
    }

    console.log(`Starting Ethel.8-v.cc Comprehensive Test Suite for user ${user.email}...`);

    // 2. Run Test Suite
    // We set a longer timeout because this suite is comprehensive
    const timeout = 300000; // 300 seconds (5 minutes)
    const command = 'npm run test:ethel';
    
    try {
        const { stdout, stderr } = await execPromise(command, { timeout });
        
        return NextResponse.json({
            success: true,
            data: {
                message: 'Ethel Test Suite Completed Successfully',
                output: stdout
            }
        });

    } catch (error: any) {
        return NextResponse.json({
            success: false,
            error: 'Ethel Test Suite Failed',
            data: {
                output: error.stdout,
                errors: error.stderr || error.message
            }
        }, { status: 200 }); // Return 200 to allow UI to show logs
    }

  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
