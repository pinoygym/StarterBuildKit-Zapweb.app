export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  roleId: string;
  branchId?: string;
  currentBranch?: string;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  emailVerified: boolean;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  permissions?: string[];
  roles?: string[];
}

export interface Branch {
  id: string;
  name: string;
  code: string;
  location: string;
  manager: string;
  phone: string;
  status: 'active' | 'inactive';
  createdAt: Date;
  updatedAt: Date;
}

export interface Role {
  id: string;
  name: string;
  description?: string;
  isSystem: boolean;
  permissions: Permission[];
}

export interface Permission {
  id: string;
  resource: string;
  action: string;
  description?: string;
}

export interface Product {
  id: string;
  name: string;
  description?: string;
  category: string;
  imageUrl?: string;
  basePrice: number;
  price: number; // Add price property
  baseUOM: string;
  uom: string; // Add uom property
  minStockLevel: number;
  shelfLifeDays: number;
  status: ProductStatus;
  alternateUOMs: ProductUOM[];
  createdAt: Date;
  updatedAt: Date;
}

export type ProductStatus = 'active' | 'inactive' | 'discontinued';

export interface ProductUOM {
  id: string;
  productId: string;
  name: string;
  conversionFactor: number;
  sellingPrice: number;
  createdAt: Date;
}

export interface Customer {
  id: string;
  customerCode: string;
  companyName?: string;
  contactPerson: string;
  phone: string;
  email: string;
  address?: string;
  city?: string;
  region?: string;
  postalCode?: string;
  paymentTerms: string;
  creditLimit?: number;
  taxId?: string;
  customerType: 'regular' | 'wholesale' | 'retail';
  notes?: string;
  status: 'active' | 'inactive';
  createdAt: Date;
  updatedAt: Date;
}

export interface InventoryBatch {
  id: string;
  batchNumber: string;
  productId: string;
  productName: string;
  warehouseId: string;
  location?: string; // Add location property
  currentStock: number;
  minStockLevel: number;
  unitCost: number;
  costPrice?: number; // Add costPrice property
  uom: string;
  expiryDate: Date;
  receivedDate: Date;
  status: 'active' | 'expired' | 'disposed';
  supplierName?: string; // Add supplierName property
  createdAt: Date;
  updatedAt: Date;
}

export type StockOperationType = 'add' | 'deduct' | 'adjust' | 'transfer';

export interface StockMovement {
  id: string;
  batchId: string;
  productId: string;
  productName: string;
  type: StockOperationType;
  quantity: number;
  previousStock: number;
  newStock: number;
  unitCost?: number;
  totalCost?: number;
  reason?: string;
  reference?: string;
  userId: string;
  userName: string;
  warehouseId: string;
  createdAt: Date;
}

export interface POSSale {
  id: string;
  receiptNumber: string;
  branchId: string;
  userId: string;
  subtotal: number;
  tax: number;
  totalAmount: number;
  paymentMethod: 'cash' | 'card' | 'credit' | 'digital';
  amountReceived?: number;
  change?: number;
  customerId?: string;
  customerName?: string;
  items: POSSaleItem[];
  status: 'completed' | 'voided' | 'refunded';
  createdAt: Date;
  updatedAt: Date;
}

export interface POSSaleItem {
  id: string;
  saleId: string;
  productId: string;
  productName: string;
  quantity: number;
  uom: string;
  unitPrice: number;
  subtotal: number;
  costOfGoodsSold: number;
}

export interface CartItem {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  uom: string;
  unitPrice: number;
  subtotal: number;
  imageUrl?: string;
}

export interface SalesSummary {
  totalSales: number;
  totalTransactions: number;
  averageTransactionValue: number;
  topProducts: Array<{
    productId: string;
    productName: string;
    quantitySold: number;
    totalRevenue: number;
  }>;
}

export type PaymentMethod = 'cash' | 'card' | 'credit' | 'digital';
export type SaleStatus = 'completed' | 'voided' | 'refunded';

export interface SyncStatus {
  lastSyncAt?: Date;
  isConnected: boolean;
  pendingChanges: number;
  syncInProgress: boolean;
  lastError?: string;
}

export interface BackupStatus {
  lastBackupAt?: Date;
  backupInProgress: boolean;
  lastError?: string;
  availableBackups: Date[];
}