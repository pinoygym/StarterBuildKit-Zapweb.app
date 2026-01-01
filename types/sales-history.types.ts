import { POSSaleWithItems } from './pos.types';

// Date preset options for quick filtering
export enum DatePreset {
  TODAY = 'today',
  YESTERDAY = 'yesterday',
  THIS_WEEK = 'this_week',
  LAST_WEEK = 'last_week',
  THIS_MONTH = 'this_month',
  LAST_MONTH = 'last_month',
  LAST_30_DAYS = 'last_30_days',
  LAST_60_DAYS = 'last_60_days',
  LAST_90_DAYS = 'last_90_days',
  THIS_YEAR = 'this_year',
  LAST_YEAR = 'last_year',
  CUSTOM = 'custom',
}

// Filters for sales history query
export interface SalesHistoryFilters {
  // Date filters
  preset?: DatePreset;
  startDate?: Date;
  endDate?: Date;

  // Additional filters
  branchId?: string;
  paymentMethod?: 'cash' | 'credit' | 'ar_credit';
  userId?: string; // Cashier/user who made the sale
  customerId?: string;
  receiptNumber?: string;

  // Amount range
  minAmount?: number;
  maxAmount?: number;

  // Pagination
  page?: number;
  limit?: number;
}

// Analytics data for the selected period
export interface SalesAnalytics {
  // Summary
  totalSales: number;
  totalTransactions: number;
  averageTransactionValue: number;
  totalDiscount: number;
  totalTax: number;

  // Payment method breakdown
  paymentMethodBreakdown: {
    cash: { count: number; amount: number };
    credit: { count: number; amount: number };
    ar_credit: { count: number; amount: number };
  };

  // Top products
  topProducts: Array<{
    productId: string;
    productName: string;
    quantitySold: number;
    revenue: number;
  }>;

  // Sales by period (for charts)
  salesByHour?: Array<{ hour: number; sales: number; transactions: number }>;
  salesByDay?: Array<{ date: string; sales: number; transactions: number }>;
  salesByWeek?: Array<{ week: string; sales: number; transactions: number }>;
  salesByMonth?: Array<{ month: string; sales: number; transactions: number }>;
}

// Paginated response for sales history
export interface SalesHistoryResponse {
  sales: POSSaleWithItems[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  analytics?: SalesAnalytics;
}

// Export format options
export enum ExportFormat {
  CSV = 'csv',
  EXCEL = 'excel',
  PDF = 'pdf',
}

// Export request
export interface ExportSalesRequest {
  filters: SalesHistoryFilters;
  format: ExportFormat;
  includeItems?: boolean;
}
