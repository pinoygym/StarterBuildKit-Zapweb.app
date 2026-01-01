import { useQuery } from '@tanstack/react-query';
import { ExpenseWithBranch, ExpenseFilters } from '@/types/expense.types';

/**
 * Hook to fetch expenses with React Query
 */
export function useExpenses(filters?: ExpenseFilters) {
  return useQuery({
    queryKey: ['expenses', filters],
    queryFn: async () => {
      const params = new URLSearchParams();

      if (filters?.branchId) params.append('branchId', filters.branchId);
      if (filters?.category) params.append('category', filters.category);
      if (filters?.paymentMethod) params.append('paymentMethod', filters.paymentMethod);
      if (filters?.vendor) params.append('vendor', filters.vendor);
      if (filters?.fromDate) params.append('fromDate', filters.fromDate.toISOString());
      if (filters?.toDate) params.append('toDate', filters.toDate.toISOString());

      const response = await fetch(`/api/expenses?${params.toString()}`);
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch expenses');
      }

      return data.data;
    },
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}
