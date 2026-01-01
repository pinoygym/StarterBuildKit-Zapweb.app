import { useState, useEffect } from 'react';
import {
  StockLevelReport,
  InventoryValueReport,
  SalesReport,
  BestSellingProduct,
  ProfitLossStatement,
  CashFlowStatement,
  BalanceSheet,
  CashFlowStatement,
  BalanceSheet,
  ReportFilters,
  POSReceipt,
  DailySalesSummary,
  EmployeePerformance,
  CustomerPurchaseHistory,
  PromotionUsage,
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
        const mapped = (result.data || []).map((u: any) => ({
          id: u.id,
          promotionName: u.promotion?.name ?? u.promotionName ?? '',
          promotionCode: u.promotion?.code ?? u.promotionCode ?? '',
          saleId: u.saleId,
          receiptNumber: u.receiptNumber,
          customerId: u.customer?.id ?? u.customerId,
          customerName: u.customer?.name ?? u.customerName ?? '',
          discountAmount: u.discountAmount,
          discountType: u.discountType ?? u.promotion?.type ?? '',
          discountValue: u.discountValue ?? u.promotion?.value ?? 0,
          usageDate: new Date(u.createdAt ?? u.usageDate),
          branchId: u.branch?.id ?? u.branchId,
          branchName: u.branch?.name ?? u.branchName ?? '',
          createdAt: new Date(u.createdAt)
        }));
        setData(mapped);
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
      if (filters?.fromDate) params.append('startDate', filters.fromDate.toISOString());
      if (filters?.toDate) params.append('endDate', filters.toDate.toISOString());
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

// New Reporting Hooks for Comprehensive System

export function usePOSReceipt(receiptId?: string) {
  const [data, setData] = useState<POSReceipt | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReceipt = async () => {
    if (!receiptId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`/api/reports/pos-receipt/${receiptId}`);
      const result = await response.json();

      if (result.success) {
        setData(result.data);
        setError(null);
      } else {
        setError(result.error || 'Failed to fetch receipt');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReceipt();
  }, [receiptId]);

  return { data, loading, error, refetch: fetchReceipt };
}

export function useCashFlow(filters?: ReportFilters) {
  const [data, setData] = useState<CashFlowStatement | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReport = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters?.branchId) params.append('branchId', filters.branchId);
      if (filters?.fromDate) params.append('fromDate', filters.fromDate.toISOString());
      if (filters?.toDate) params.append('toDate', filters.toDate.toISOString());

      const response = await fetch(`/api/reports/cash-flow?${params.toString()}`);
      const result = await response.json();
      if (result.success) {
        setData(result.data);
        setError(null);
      } else {
        setError(result.error || 'Failed to fetch cash flow');
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

export function useBalanceSheet(filters?: ReportFilters) {
  const [data, setData] = useState<BalanceSheet | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReport = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters?.branchId) params.append('branchId', filters.branchId);
      if (filters?.fromDate) params.append('fromDate', filters.fromDate.toISOString());
      if (filters?.toDate) params.append('toDate', filters.toDate.toISOString());

      const response = await fetch(`/api/reports/balance-sheet?${params.toString()}`);
      const result = await response.json();
      if (result.success) {
        setData(result.data);
        setError(null);
      } else {
        setError(result.error || 'Failed to fetch balance sheet');
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

export function useDailySalesSummary(filters?: ReportFilters) {
  const [data, setData] = useState<DailySalesSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReport = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      
      if (filters?.branchId) params.append('branchId', filters.branchId);
      if (filters?.fromDate) params.append('fromDate', filters.fromDate.toISOString());
      if (filters?.toDate) params.append('toDate', filters.toDate.toISOString());

      const response = await fetch(`/api/reports/daily-sales-summary?${params.toString()}`);
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

export function useEmployeePerformance(filters?: ReportFilters) {
  const [data, setData] = useState<EmployeePerformance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReport = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      
      if (filters?.branchId) params.append('branchId', filters.branchId);
      if (filters?.fromDate) params.append('fromDate', filters.fromDate.toISOString());
      if (filters?.toDate) params.append('toDate', filters.toDate.toISOString());

      const response = await fetch(`/api/reports/employee-performance?${params.toString()}`);
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

export function useCustomerPurchaseHistory(customerId?: string, filters?: ReportFilters) {
  const [data, setData] = useState<CustomerPurchaseHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReport = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      
      if (customerId) params.append('customerId', customerId);
      if (filters?.branchId) params.append('branchId', filters.branchId);
      if (filters?.fromDate) params.append('fromDate', filters.fromDate.toISOString());
      if (filters?.toDate) params.append('toDate', filters.toDate.toISOString());

      const response = await fetch(`/api/reports/customer-purchase-history?${params.toString()}`);
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
  }, [customerId, filters?.branchId, filters?.fromDate, filters?.toDate]);

  return { data, loading, error, refetch: fetchReport };
}

export function usePromotionUsage(filters?: ReportFilters) {
  const [data, setData] = useState<PromotionUsage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReport = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      
      if (filters?.branchId) params.append('branchId', filters.branchId);
      if (filters?.fromDate) params.append('fromDate', filters.fromDate.toISOString());
      if (filters?.toDate) params.append('toDate', filters.toDate.toISOString());

      const response = await fetch(`/api/reports/discount-promotion-analytics?${params.toString()}`);
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

export function useReceivingVariance(filters?: ReportFilters) {
  const [data, setData] = useState<import('@/types/receiving-voucher.types').VarianceReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReport = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters?.branchId) params.append('branchId', filters.branchId);
      if (filters?.fromDate) params.append('startDate', filters.fromDate.toISOString());
      if (filters?.toDate) params.append('endDate', filters.toDate.toISOString());

      const response = await fetch(`/api/reports/receiving-variance?${params.toString()}`);
      const result = await response.json();
      if (result.success) {
        setData(result.data || []);
        setError(null);
      } else {
        setError(result.error || 'Failed to fetch receiving variance');
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
