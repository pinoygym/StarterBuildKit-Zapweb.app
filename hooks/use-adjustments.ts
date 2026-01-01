import { useQuery } from '@tanstack/react-query';
import { AdjustmentSlip, AdjustmentFilters } from '@/types/inventory.types';

interface AdjustmentsResponse {
    success: boolean;
    data: AdjustmentSlip[];
    error?: string;
}

interface AdjustmentResponse {
    success: boolean;
    data: AdjustmentSlip;
    error?: string;
}

/**
 * Hook to fetch list of adjustment slips with filtering
 */
export function useAdjustments(filters?: AdjustmentFilters) {
    return useQuery({
        queryKey: ['adjustments', filters],
        queryFn: async () => {
            const params = new URLSearchParams();

            if (filters?.warehouseId) params.append('warehouseId', filters.warehouseId);
            if (filters?.productId) params.append('productId', filters.productId);
            if (filters?.searchQuery) params.append('search', filters.searchQuery);
            if (filters?.dateFrom) params.append('dateFrom', filters.dateFrom.toISOString());
            if (filters?.dateTo) params.append('dateTo', filters.dateTo.toISOString());

            const response = await fetch(`/api/inventory/adjustments?${params.toString()}`);
            const result: AdjustmentsResponse = await response.json();

            if (!result.success) {
                throw new Error(result.error || 'Failed to fetch adjustments');
            }

            return result.data;
        },
    });
}

/**
 * Hook to fetch a single adjustment slip by reference ID
 */
export function useAdjustment(referenceId: string) {
    return useQuery({
        queryKey: ['adjustment', referenceId],
        queryFn: async () => {
            const response = await fetch(`/api/inventory/adjustments/${referenceId}`);
            const result: AdjustmentResponse = await response.json();

            if (!result.success) {
                throw new Error(result.error || 'Failed to fetch adjustment');
            }

            return result.data;
        },
        enabled: !!referenceId,
    });
}
