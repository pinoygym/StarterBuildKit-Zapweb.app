import { useQuery } from '@tanstack/react-query';
import { APWithPayments, APFilters } from '@/types/ap.types';

/**
 * Hook to fetch AP records with React Query
 */
export function useAP(filters?: APFilters) {
  const query = useQuery({
    queryKey: ['ap', filters],
    queryFn: async () => {
      const params = new URLSearchParams();

      if (filters?.branchId) params.append('branchId', filters.branchId);
      if (filters?.supplierId) params.append('supplierId', filters.supplierId);
      if (filters?.status) params.append('status', filters.status);
      if (filters?.fromDate) params.append('fromDate', filters.fromDate.toISOString());
      if (filters?.toDate) params.append('toDate', filters.toDate.toISOString());

      const response = await fetch(`/api/ap?${params.toString()}`);
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch AP records');
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
