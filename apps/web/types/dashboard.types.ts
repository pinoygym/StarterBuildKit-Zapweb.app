import { Prisma } from '@prisma/client';

export interface DashboardKPIs {
  totalProducts: number;
  totalStock: number;
  activeSalesOrders: number;
  salesOrderConversionRate: number;
  inventoryValue: Prisma.Decimal;
  todaySalesCount: number;
  todaySalesRevenue: Prisma.Decimal;
  outstandingAR: Prisma.Decimal;
  outstandingAP: Prisma.Decimal;
  currentMonthExpenses: Prisma.Decimal;
  overdueReceivables: number;
  overduePayables: number;
  grossProfit?: Prisma.Decimal;
  netProfit?: Prisma.Decimal;
}

export interface AgingBucket {
  bucket: '0-30' | '31-60' | '61-90' | '90+';
  amount: Prisma.Decimal;
  count: number;
}

export interface ARAPAging {
  receivables: AgingBucket[];
  payables: AgingBucket[];
}

export interface SalesOrderSummary {
  status: string;
  count: number;
  totalAmount: Prisma.Decimal;
}

export interface DashboardActivity {
  id: string;
  type: 'sale' | 'purchase' | 'adjustment' | 'expense';
  description: string;
  amount?: Prisma.Decimal;
  status?: string;
  timestamp: Date;
  referenceId: string;
}

export interface TopProduct {
  productId: string;
  productName: string;
  quantitySold: number;
  revenue: Prisma.Decimal;
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
  revenue: Prisma.Decimal;
  expenses: Prisma.Decimal;
  profit: Prisma.Decimal;
  inventoryValue: Prisma.Decimal;
}

export interface DashboardFilters {
  branchId?: string;
  fromDate?: Date;
  toDate?: Date;
}
