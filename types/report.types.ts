import { Decimal } from '@prisma/client/runtime/library';

export interface StockLevelReport {
  productId: string;
  productName: string;
  category: string;
  warehouseId: string;
  warehouseName: string;
  currentStock: number;
  baseUOM: string;
  minStockLevel: number;
  status: 'adequate' | 'low' | 'critical';
}

export interface InventoryValueReport {
  productId: string;
  productName: string;
  totalQuantity: number;
  averageCost: Decimal;
  totalValue: Decimal;
}

export interface SalesReport {
  date: Date;
  transactionCount: number;
  totalRevenue: Decimal;
  totalCOGS: Decimal;
  grossProfit: Decimal;
  grossMargin: number;
}

export interface BestSellingProduct {
  productId: string;
  productName: string;
  category: string;
  quantitySold: number;
  revenue: Decimal;
  profit: Decimal;
}

export interface ProfitLossStatement {
  revenue: Decimal;
  cogs: Decimal;
  grossProfit: Decimal;
  expenses: Decimal;
  netProfit: Decimal;
  grossMargin: number;
  netMargin: number;
}

export interface CashFlowStatement {
  cashInflows: {
    posSales: Decimal;
    arPayments: Decimal;
    total: Decimal;
  };
  cashOutflows: {
    expenses: Decimal;
    apPayments: Decimal;
    total: Decimal;
  };
  netCashFlow: Decimal;
}

export interface BalanceSheet {
  assets: {
    inventoryValue: Decimal;
    accountsReceivable: Decimal;
    total: Decimal;
  };
  liabilities: {
    accountsPayable: Decimal;
    total: Decimal;
  };
  equity: Decimal;
}

export interface ReportFilters {
  branchId?: string;
  warehouseId?: string;
  category?: string;
  fromDate?: Date;
  toDate?: Date;
}
