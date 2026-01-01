import { asyncHandler } from '@/lib/api-error';
import { NextRequest } from 'next/server';
import { salesAgentReportService } from '@/services/reports/sales-agent-reports.service';

export const dynamic = 'force-dynamic';

export const GET = asyncHandler(async (request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const type = searchParams.get('type') || 'summary';
        const startDateStr = searchParams.get('startDate');
        const endDateStr = searchParams.get('endDate');
        const branchId = searchParams.get('branchId') || undefined;
        const agentId = searchParams.get('agentId') || undefined;

        const startDate = startDateStr ? new Date(startDateStr) : undefined;
        const endDate = endDateStr ? new Date(endDateStr) : undefined;

        if (type === 'detailed') {
            if (!agentId) {
                return Response.json(
                    { success: false, error: 'Agent ID is required for detailed report' },
                    { status: 400 }
                );
            }
            const data = await salesAgentReportService.getDetailedReport(
                agentId,
                startDate,
                endDate,
                branchId
            );
            return Response.json({ success: true, data });
        } else {
            // Summary
            const data = await salesAgentReportService.getPerformanceSummary(
                startDate,
                endDate,
                branchId
            );
            return Response.json({ success: true, data });
        }
    } catch (error: any) {
        console.error('Error fetching sales agent report:', error);
        return Response.json(
            { success: false, error: error.message || 'Failed to fetch report' },
            { status: 500 }
        );
    }
}
