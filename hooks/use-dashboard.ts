import { useApiQuery, buildApiUrl, apiFetch } from './use-api';
import { DashboardKPIs, TopProduct, WarehouseUtilization, BranchComparison } from '@/types/dashboard.types';

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
    ['dashboard', 'top-products', branchId || 'all', limit],
    () => apiFetch(buildApiUrl('/api/dashboard/top-products', { branchId, limit })),
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
    ['dashboard', 'sales-trends', branchId || 'all', days],
    () => apiFetch(buildApiUrl('/api/dashboard/sales-trends', { branchId, days })),
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
    ['dashboard', 'low-stock', branchId || 'all', limit],
    () => apiFetch(buildApiUrl('/api/dashboard/low-stock', { branchId, limit })),
    {
      staleTime: 1000 * 60 * 2, // 2 minutes
      refetchInterval: 1000 * 60 * 5, // Refetch every 5 minutes (important for stock alerts)
    }
  );
}
