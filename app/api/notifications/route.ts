import { NextRequest, NextResponse } from 'next/server';
import { notificationService } from '@/services/notification.service';
import { authService } from '@/services/auth.service';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        const token = request.cookies.get('auth-token')?.value;
        if (!token) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

        const payload = authService.verifyToken(token);
        if (!payload) return NextResponse.json({ success: false, error: 'Invalid token' }, { status: 401 });

        // Trigger alert checks (lazy evaluation)
        // In a scaled system, this should be a background job, but for now this ensures responsiveness
        await import('@/services/alert.service').then(m => m.alertService.checkLowStock());

        const notifications = await notificationService.getUserNotifications(payload.userId);
        const unreadCount = await notificationService.getUnreadCount(payload.userId);

        return NextResponse.json({ success: true, data: { notifications, unreadCount } });
    } catch (error) {
        console.error('Error fetching notifications:', error);
        return NextResponse.json({ success: false, error: 'Failed to fetch notifications' }, { status: 500 });
    }
}

export async function PATCH(request: NextRequest) {
    try {
        const token = request.cookies.get('auth-token')?.value;
        if (!token) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

        const payload = authService.verifyToken(token);
        if (!payload) return NextResponse.json({ success: false, error: 'Invalid token' }, { status: 401 });

        const body = await request.json();
        const { id, markAll } = body;

        if (markAll) {
            await notificationService.markAllAsRead(payload.userId);
        } else if (id) {
            await notificationService.markAsRead(id);
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error updating notification:', error);
        return NextResponse.json({ success: false, error: 'Failed' }, { status: 500 });
    }
}
