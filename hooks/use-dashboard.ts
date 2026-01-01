import { useApiQuery, buildApiUrl, apiFetch } from './use-api';
import { DashboardKPIs, TopProduct, WarehouseUtilization, BranchComparison, ARAPAging, SalesOrderSummary, DashboardActivity } from '@/types/dashboard.types';

/**
 * Hook to fetch dashboard KPIs
 */
export function useDashboardKPIs(branchId?: string) {
  return useApiQuery<DashboardKPIs>(
    ['dashboard', 'kpis', branchId || 'all'],
    () => apiFetch(buildApiUrl('/api/dashboard/kpis', { branchId })),
    {
      staleTime: 1000 * 60 * 2, // 2 minutes
      refetchInterval: 1000 * 60 * 5, // Refetch every 5 minutes
    }
  );
}

/**
 * Hook to fetch top selling products
 */
export function useTopProducts(branchId?: string, limit: number = 5) {
  return useApiQuery<TopProduct[]>(
    ['dashboard', 'top-products', branchId || 'all', limit.toString()],
    () => apiFetch(buildApiUrl('/api/dashboard/top-products', { branchId, limit: limit.toString() })),
    {
      staleTime: 1000 * 60 * 5, // 5 minutes
    }
  );
}

/**
 * Hook to fetch warehouse utilization
 */
export function useWarehouseUtilization(branchId?: string) {
  return useApiQuery<WarehouseUtilization[]>(
    ['dashboard', 'warehouse-utilization', branchId || 'all'],
    () => apiFetch(buildApiUrl('/api/dashboard/warehouse-utilization', { branchId })),
    {
      staleTime: 1000 * 60 * 5, // 5 minutes
    }
  );
}

/**
 * Hook to fetch branch comparison
 */
export function useBranchComparison() {
  return useApiQuery<BranchComparison[]>(
    ['dashboard', 'branch-comparison'],
    () => apiFetch('/api/dashboard/branch-comparison'),
    {
      staleTime: 1000 * 60 * 10, // 10 minutes
    }
  );
}

/**
 * Hook to fetch sales trends
 */
export function useSalesTrends(branchId?: string, days: number = 7) {
  return useApiQuery<{ date: string; sales: number; revenue: number }[]>(
    ['dashboard', 'sales-trends', branchId || 'all', days.toString()],
    () => apiFetch(buildApiUrl('/api/dashboard/sales-trends', { branchId, days: days.toString() })),
    {
      staleTime: 1000 * 60 * 5, // 5 minutes
    }
  );
}

/**
 * Hook to fetch low stock products
 */
export function useLowStockProducts(branchId?: string, limit: number = 10) {
  return useApiQuery<{
    productId: string;
    productName: string;
    currentStock: number;
    minStockLevel: number;
    status: 'low' | 'critical';
  }[]>(
    ['dashboard', 'low-stock', branchId || 'all', limit.toString()],
    () => apiFetch(buildApiUrl('/api/dashboard/low-stock', { branchId, limit: limit.toString() })),
    {
      staleTime: 1000 * 60 * 2, // 2 minutes
      refetchInterval: 1000 * 60 * 5, // Refetch every 5 minutes (important for stock alerts)
    }
  );
}

/**
 * Hook to fetch aging data
 */
export function useAgingData(branchId?: string) {
  return useApiQuery<ARAPAging>(
    ['dashboard', 'aging', branchId || 'all'],
    () => apiFetch(buildApiUrl('/api/dashboard/aging', { branchId })),
    {
      staleTime: 1000 * 60 * 5, // 5 minutes
    }
  );
}

/**
 * Hook to fetch sales order summary
 */
export function useSalesOrderSummary(branchId?: string) {
  return useApiQuery<SalesOrderSummary[]>(
    ['dashboard', 'orders-summary', branchId || 'all'],
    () => apiFetch(buildApiUrl('/api/dashboard/orders-summary', { branchId })),
    {
      staleTime: 1000 * 60 * 5, // 5 minutes
    }
  );
}

/**
 * Hook to fetch recent activities
 */
export function useRecentActivities(branchId?: string, limit: number = 10) {
  return useApiQuery<DashboardActivity[]>(
    ['dashboard', 'recent-activities', branchId || 'all', limit.toString()],
    () => apiFetch(buildApiUrl('/api/dashboard/recent-activities', { branchId, limit: limit.toString() })),
    {
      staleTime: 1000 * 60 * 2, // 2 minutes
    }
  );
}

/**
 * Hook to fetch entity counts
 */
export function useEntityCounts(branchId?: string) {
  return useApiQuery<Record<string, number>>(
    ['dashboard', 'counts', branchId || 'all'],
    () => apiFetch(buildApiUrl('/api/dashboard/counts', { branchId })),
    {
      staleTime: 1000 * 60 * 10, // 10 minutes
    }
  );
}
