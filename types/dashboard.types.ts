import { Decimal } from '@prisma/client/runtime/client';

export interface DashboardKPIs {
  totalProducts: number;
  totalStock: number;
  activeSalesOrders: number;
  salesOrderConversionRate: number;
  inventoryValue: Decimal;
  todaySalesCount: number;
  todaySalesRevenue: Decimal;
  outstandingAR: Decimal;
  outstandingAP: Decimal;
  currentMonthExpenses: Decimal;
  overdueReceivables: number;
  overduePayables: number;
  grossProfit?: Decimal;
  netProfit?: Decimal;
}

export interface AgingBucket {
  bucket: '0-30' | '31-60' | '61-90' | '90+';
  amount: Decimal;
  count: number;
}

export interface ARAPAging {
  receivables: AgingBucket[];
  payables: AgingBucket[];
}

export interface SalesOrderSummary {
  status: string;
  count: number;
  totalAmount: Decimal;
}

export interface DashboardActivity {
  id: string;
  type: 'sale' | 'purchase' | 'adjustment' | 'expense';
  description: string;
  amount?: Decimal;
  status?: string;
  timestamp: Date;
  referenceId: string;
}

export interface TopProduct {
  productId: string;
  productName: string;
  quantitySold: number;
  revenue: Decimal;
}

export interface WarehouseUtilization {
  warehouseId: string;
  warehouseName: string;
  branchId: string;
  maxCapacity: number;
  currentStock: number;
  utilizationPercentage: number;
  status: 'normal' | 'warning' | 'critical';
}

export interface BranchComparison {
  branchId: string;
  branchName: string;
  revenue: Decimal;
  expenses: Decimal;
  profit: Decimal;
  inventoryValue: Decimal;
}

export interface DashboardFilters {
  branchId?: string;
  fromDate?: Date;
  toDate?: Date;
}
