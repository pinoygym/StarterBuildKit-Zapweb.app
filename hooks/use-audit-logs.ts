import { useQuery } from '@tanstack/react-query';
import { AuditLogFilters, PaginatedAuditLogs } from '@/types/audit.types';

export function useAuditLogs(filters: AuditLogFilters = {}, page = 1, limit = 50) {
    return useQuery({
        queryKey: ['audit-logs', filters, page, limit],
        queryFn: async () => {
            const params = new URLSearchParams({
                page: page.toString(),
                limit: limit.toString(),
            });

            if (filters.userId) params.append('userId', filters.userId);
            if (filters.resource) params.append('resource', filters.resource);
            if (filters.action) params.append('action', filters.action);
            if (filters.startDate) params.append('startDate', filters.startDate.toISOString());
            if (filters.endDate) params.append('endDate', filters.endDate.toISOString());

            const response = await fetch(`/api/audit-logs?${params.toString()}`);
            if (!response.ok) {
                throw new Error('Failed to fetch audit logs');
            }
            return response.json() as Promise<{ success: boolean; data: PaginatedAuditLogs['data']; pagination: any }>;
        },
    });
}
