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

// POS Receipt Types
export interface POSReceiptItem {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  uom: string;
  unitPrice: number;
  subtotal: number;
  costOfGoodsSold: number;
}

export interface POSReceipt {
  id: string;
  saleId: string;
  receiptNumber: string;
  branchId: string;
  branchName: string;
  branchAddress: string;
  branchPhone: string;
  cashierId: string;
  cashierName: string;
  customerId?: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  items: POSReceiptItem[];
  subtotal: number;
  tax: number;
  taxRate: number;
  totalAmount: number;
  paymentMethod: string;
  amountReceived: number;
  change: number;
  discountAmount: number;
  discountReason?: string;
  loyaltyPoints: number;
  notes?: string;
  barcode?: string;
  qrCode?: string;
  isPrinted: boolean;
  printCount: number;
  createdAt: Date;
  companySettings?: CompanySettings;
}

export interface CompanySettings {
  id: string;
  companyName: string;
  address: string;
  phone?: string;
  email?: string;
  taxId?: string;
  website?: string;
  logoUrl?: string;
  headerText?: string;
  footerText?: string;
  receiptHeader?: string;
  receiptFooter?: string;
  primaryColor: string;
  secondaryColor: string;
  fontFamily: string;
  paperSize: string;
  thermalPrinter: boolean;
  autoPrintReceipts: boolean;
}

export interface DailySalesSummary {
  id: string;
  branchId: string;
  branchName: string;
  date: Date;
  totalSales: number;
  totalTransactions: number;
  averageTransaction: number;
  cashSales: number;
  cardSales: number;
  digitalSales: number;
  creditSales: number;
  totalTax: number;
  totalDiscount: number;
  grossProfit: number;
  createdAt: Date;
}

export interface EmployeePerformance {
  id: string;
  userId: string;
  employeeName: string;
  branchId: string;
  branchName: string;
  date: Date;
  totalSales: number;
  transactionCount: number;
  averageTransaction: number;
  itemsSold: number;
  returnsHandled: number;
  customerSatisfaction?: number;
  createdAt: Date;
}

export interface CustomerPurchaseHistory {
  id: string;
  customerId: string;
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  saleId: string;
  receiptNumber: string;
  branchId: string;
  branchName: string;
  totalAmount: number;
  itemsCount: number;
  paymentMethod: string;
  purchaseDate: Date;
  loyaltyPointsEarned: number;
  createdAt: Date;
}

export interface PromotionUsage {
  id: string;
  promotionName: string;
  promotionCode?: string;
  saleId: string;
  receiptNumber: string;
  customerId?: string;
  customerName?: string;
  discountAmount: number;
  discountType: string;
  discountValue: number;
  usageDate: Date;
  branchId: string;
  branchName: string;
  createdAt: Date;
}

export interface ReportTemplate {
  id: string;
  name: string;
  type: ReportType;
  description?: string;
  template: any; // JSON template configuration
  isDefault: boolean;
  isActive: boolean;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ReportExport {
  id: string;
  reportType: ReportType;
  reportName: string;
  format: ExportFormat;
  fileUrl?: string;
  fileSize?: number;
  status: ExportStatus;
  filters?: any;
  errorMessage?: string;
  requestedBy: string;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export type ReportType = 
  | 'POS_RECEIPT'
  | 'SALES_SUMMARY'
  | 'INVENTORY_MOVEMENT'
  | 'CUSTOMER_HISTORY'
  | 'EMPLOYEE_PERFORMANCE'
  | 'DISCOUNT_ANALYTICS'
  | 'PROFIT_LOSS'
  | 'BALANCE_SHEET'
  | 'CASH_FLOW'
  | 'CUSTOM';

export type ExportFormat = 'PDF' | 'EXCEL' | 'CSV' | 'JSON';
export type ExportStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
