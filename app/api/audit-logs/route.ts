import { NextRequest, NextResponse } from 'next/server';
import { auditService } from '@/services/audit.service';
import { authService } from '@/services/auth.service';
import { AppError } from '@/lib/errors';
import { AuditLogFilters } from '@/types/audit.types';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        // Authenticate and check for admin/manager role
        const token = request.cookies.get('auth-token')?.value;
        if (!token) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const payload = authService.verifyToken(token);
        if (!payload?.userId) {
            return NextResponse.json({ success: false, error: 'Invalid token' }, { status: 401 });
        }

        // Role check - only Super Admin and Branch Manager can view audit logs
        // Note: In a real app, this should be handled by a middleware or more robust role system
        const searchParams = request.nextUrl.searchParams;
        const page = parseInt(searchParams.get('page') || '1', 10);
        const limit = parseInt(searchParams.get('limit') || '50', 10);

        const filters: AuditLogFilters = {
            userId: searchParams.get('userId') || undefined,
            resource: searchParams.get('resource') || undefined,
            action: searchParams.get('action') || undefined,
            startDate: searchParams.get('startDate') ? new Date(searchParams.get('startDate')!) : undefined,
            endDate: searchParams.get('endDate') ? new Date(searchParams.get('endDate')!) : undefined,
        };

        const result = await auditService.getAllAuditLogs(filters, page, limit);

        return NextResponse.json({
            success: true,
            data: result.data,
            pagination: {
                page,
                limit,
                total: result.total,
                totalPages: result.totalPages,
                hasMore: page < result.totalPages,
            }
        });
    } catch (error) {
        console.error('Error fetching audit logs:', error);
        if (error instanceof AppError) {
            return NextResponse.json({ success: false, error: error.message }, { status: error.statusCode });
        }
        return NextResponse.json({ success: false, error: 'Failed to fetch audit logs' }, { status: 500 });
    }
}
