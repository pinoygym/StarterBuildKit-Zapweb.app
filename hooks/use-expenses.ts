import { useState, useEffect } from 'react';
import { ExpenseWithBranch, ExpenseFilters } from '@/types/expense.types';

export function useExpenses(filters?: ExpenseFilters) {
  const [expenses, setExpenses] = useState<ExpenseWithBranch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      
      if (filters?.branchId) params.append('branchId', filters.branchId);
      if (filters?.category) params.append('category', filters.category);
      if (filters?.paymentMethod) params.append('paymentMethod', filters.paymentMethod);
      if (filters?.vendor) params.append('vendor', filters.vendor);
      if (filters?.fromDate) params.append('fromDate', filters.fromDate.toISOString());
      if (filters?.toDate) params.append('toDate', filters.toDate.toISOString());

      const response = await fetch(`/api/expenses?${params.toString()}`);
      const data = await response.json();

      if (data.success) {
        setExpenses(data.data);
        setError(null);
      } else {
        setError(data.error || 'Failed to fetch expenses');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, [filters?.branchId, filters?.category, filters?.paymentMethod, filters?.vendor]);

  return { expenses, loading, error, refetch: fetchExpenses };
}
