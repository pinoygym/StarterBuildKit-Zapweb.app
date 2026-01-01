import { useState, useEffect } from 'react';
import { ARWithPayments, ARFilters } from '@/types/ar.types';

export function useAR(filters?: ARFilters) {
  const [records, setRecords] = useState<ARWithPayments[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRecords = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      
      if (filters?.branchId) params.append('branchId', filters.branchId);
      if (filters?.status) params.append('status', filters.status);
      if (filters?.customerName) params.append('customerName', filters.customerName);
      if (filters?.fromDate) params.append('fromDate', filters.fromDate.toISOString());
      if (filters?.toDate) params.append('toDate', filters.toDate.toISOString());

      const response = await fetch(`/api/ar?${params.toString()}`);
      const data = await response.json();

      if (data.success) {
        setRecords(data.data);
        setError(null);
      } else {
        setError(data.error || 'Failed to fetch AR records');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, [filters?.branchId, filters?.status, filters?.customerName]);

  return { records, loading, error, refetch: fetchRecords };
}
