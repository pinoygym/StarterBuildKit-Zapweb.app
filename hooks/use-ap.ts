import { useState, useEffect } from 'react';
import { APWithPayments, APFilters } from '@/types/ap.types';

export function useAP(filters?: APFilters) {
  const [records, setRecords] = useState<APWithPayments[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRecords = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      
      if (filters?.branchId) params.append('branchId', filters.branchId);
      if (filters?.supplierId) params.append('supplierId', filters.supplierId);
      if (filters?.status) params.append('status', filters.status);
      if (filters?.fromDate) params.append('fromDate', filters.fromDate.toISOString());
      if (filters?.toDate) params.append('toDate', filters.toDate.toISOString());

      const response = await fetch(`/api/ap?${params.toString()}`);
      const data = await response.json();

      if (data.success) {
        setRecords(data.data);
        setError(null);
      } else {
        setError(data.error || 'Failed to fetch AP records');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, [filters?.branchId, filters?.supplierId, filters?.status]);

  return { records, loading, error, refetch: fetchRecords };
}
