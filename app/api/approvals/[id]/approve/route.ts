import { NextRequest, NextResponse } from 'next/server';
import { approvalService } from '@/services/approval.service';
import { authService } from '@/services/auth.service';

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> } // params is now a Promise in Next.js 15
) {
    try {
        const token = request.cookies.get('auth-token')?.value;
        if (!token) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

        const payload = authService.verifyToken(token);
        if (!payload) return NextResponse.json({ success: false, error: 'Invalid token' }, { status: 401 });

        const { id } = await params;
        const body = await request.json();
        const { reviewNote } = body;

        await approvalService.approveRequest(id, payload.userId, reviewNote);

        return NextResponse.json({ success: true, message: 'Request approved successfully' });
    } catch (error: any) {
        console.error('Error approving request:', error);
        return NextResponse.json({ success: false, error: error.message || 'Failed to approve request' }, { status: 500 });
    }
}
