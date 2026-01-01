import { Decimal } from '@prisma/client/runtime/library';

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
