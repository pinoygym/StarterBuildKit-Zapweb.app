import { useState, useEffect } from 'react';
import {
  StockLevelReport,
  InventoryValueReport,
  SalesReport,
  BestSellingProduct,
  ProfitLossStatement,
  CashFlowStatement,
  BalanceSheet,
  ReportFilters,
} from '@/types/report.types';

export function useStockLevelReport(filters?: ReportFilters) {
  const [data, setData] = useState<StockLevelReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReport = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      
      if (filters?.branchId) params.append('branchId', filters.branchId);
      if (filters?.warehouseId) params.append('warehouseId', filters.warehouseId);
      if (filters?.category) params.append('category', filters.category);

      const response = await fetch(`/api/reports/stock-levels?${params.toString()}`);
      const result = await response.json();

      if (result.success) {
        setData(result.data);
        setError(null);
      } else {
        setError(result.error || 'Failed to fetch report');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [filters?.branchId, filters?.warehouseId, filters?.category]);

  return { data, loading, error, refetch: fetchReport };
}

export function useInventoryValueReport(filters?: ReportFilters) {
  const [data, setData] = useState<InventoryValueReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReport = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      
      if (filters?.branchId) params.append('branchId', filters.branchId);
      if (filters?.warehouseId) params.append('warehouseId', filters.warehouseId);

      const response = await fetch(`/api/reports/inventory-value?${params.toString()}`);
      const result = await response.json();

      if (result.success) {
        setData(result.data);
        setError(null);
      } else {
        setError(result.error || 'Failed to fetch report');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [filters?.branchId, filters?.warehouseId]);

  return { data, loading, error, refetch: fetchReport };
}

export function useSalesReport(filters?: ReportFilters, groupBy: 'day' | 'week' | 'month' = 'day') {
  const [data, setData] = useState<SalesReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReport = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      
      if (filters?.branchId) params.append('branchId', filters.branchId);
      if (filters?.fromDate) params.append('fromDate', filters.fromDate.toISOString());
      if (filters?.toDate) params.append('toDate', filters.toDate.toISOString());
      params.append('groupBy', groupBy);

      const response = await fetch(`/api/reports/sales?${params.toString()}`);
      const result = await response.json();

      if (result.success) {
        setData(result.data);
        setError(null);
      } else {
        setError(result.error || 'Failed to fetch report');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [filters?.branchId, filters?.fromDate, filters?.toDate, groupBy]);

  return { data, loading, error, refetch: fetchReport };
}

export function useBestSellers(filters?: ReportFilters, limit: number = 10) {
  const [data, setData] = useState<BestSellingProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReport = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      
      if (filters?.branchId) params.append('branchId', filters.branchId);
      if (filters?.fromDate) params.append('fromDate', filters.fromDate.toISOString());
      if (filters?.toDate) params.append('toDate', filters.toDate.toISOString());
      params.append('limit', limit.toString());

      const response = await fetch(`/api/reports/best-sellers?${params.toString()}`);
      const result = await response.json();

      if (result.success) {
        setData(result.data);
        setError(null);
      } else {
        setError(result.error || 'Failed to fetch report');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [filters?.branchId, filters?.fromDate, filters?.toDate, limit]);

  return { data, loading, error, refetch: fetchReport };
}

export function useProfitLoss(filters?: ReportFilters) {
  const [data, setData] = useState<ProfitLossStatement | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReport = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      
      if (filters?.branchId) params.append('branchId', filters.branchId);
      if (filters?.fromDate) params.append('fromDate', filters.fromDate.toISOString());
      if (filters?.toDate) params.append('toDate', filters.toDate.toISOString());

      const response = await fetch(`/api/reports/profit-loss?${params.toString()}`);
      const result = await response.json();

      if (result.success) {
        setData(result.data);
        setError(null);
      } else {
        setError(result.error || 'Failed to fetch report');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [filters?.branchId, filters?.fromDate, filters?.toDate]);

  return { data, loading, error, refetch: fetchReport };
}
