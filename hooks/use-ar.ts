import { useQuery } from '@tanstack/react-query';
import { ARWithPayments, ARFilters } from '@/types/ar.types';

/**
 * Hook to fetch AR records with React Query
 */
export function useAR(filters?: ARFilters) {
  const query = useQuery({
    queryKey: ['ar', filters],
    queryFn: async () => {
      const params = new URLSearchParams();

      if (filters?.branchId) params.append('branchId', filters.branchId);
      if (filters?.status) params.append('status', filters.status);
      if (filters?.customerName) params.append('customerName', filters.customerName);
      if (filters?.customerId) params.append('customerId', filters.customerId);
      if (filters?.fromDate) params.append('fromDate', filters.fromDate.toISOString());
      if (filters?.toDate) params.append('toDate', filters.toDate.toISOString());

      const response = await fetch(`/api/ar?${params.toString()}`);
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch AR records');
      }

      return data.data;
    },
    staleTime: 1000 * 60 * 2, // 2 minutes
  });

  return {
    records: query.data || [],
    loading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}
