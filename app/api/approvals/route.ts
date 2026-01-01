import { NextRequest, NextResponse } from 'next/server';
import { approvalService } from '@/services/approval.service';
import { authService } from '@/services/auth.service';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        const token = request.cookies.get('auth-token')?.value;
        if (!token) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

        const payload = authService.verifyToken(token);
        if (!payload) return NextResponse.json({ success: false, error: 'Invalid token' }, { status: 401 });

        const searchParams = request.nextUrl.searchParams;
        const status = searchParams.get('status') || 'PENDING';

        const requests = await prisma.approvalRequest.findMany({
            where: {
                status: status,
            },
            include: {
                RequestedBy: {
                    select: {
                        firstName: true,
                        lastName: true,
                        email: true,
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        return NextResponse.json({ success: true, data: requests });
    } catch (error) {
        console.error('Error fetching approvals:', error);
        return NextResponse.json({ success: false, error: 'Failed to fetch approvals' }, { status: 500 });
    }
}
