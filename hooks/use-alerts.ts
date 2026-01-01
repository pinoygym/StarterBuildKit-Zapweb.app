import { useState, useEffect } from 'react';
import { Alert, AlertFilters } from '@/types/alert.types';

export function useAlerts(filters?: AlertFilters) {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      
      if (filters?.branchId) params.append('branchId', filters.branchId);
      if (filters?.type) params.append('type', filters.type);
      if (filters?.severity) params.append('severity', filters.severity);
      if (filters?.warehouseId) params.append('warehouseId', filters.warehouseId);

      const response = await fetch(`/api/alerts?${params.toString()}`);
      const data = await response.json();

      if (data.success) {
        setAlerts(data.data);
        setError(null);
      } else {
        setError(data.error || 'Failed to fetch alerts');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, [filters?.branchId, filters?.type, filters?.severity, filters?.warehouseId]);

  return { alerts, loading, error, refetch: fetchAlerts };
}
