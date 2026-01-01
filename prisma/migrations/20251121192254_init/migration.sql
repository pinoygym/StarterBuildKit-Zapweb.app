-- CreateTable
CREATE TABLE "APPayment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "apId" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "paymentMethod" TEXT NOT NULL,
    "referenceNumber" TEXT,
    "paymentDate" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "APPayment_apId_fkey" FOREIGN KEY ("apId") REFERENCES "AccountsPayable" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ARPayment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "arId" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "paymentMethod" TEXT NOT NULL,
    "referenceNumber" TEXT,
    "paymentDate" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ARPayment_arId_fkey" FOREIGN KEY ("arId") REFERENCES "AccountsReceivable" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AccountsPayable" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "branchId" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "purchaseOrderId" TEXT,
    "totalAmount" REAL NOT NULL,
    "paidAmount" REAL NOT NULL DEFAULT 0,
    "balance" REAL NOT NULL,
    "dueDate" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "AccountsPayable_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "AccountsPayable_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AccountsReceivable" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "branchId" TEXT NOT NULL,
    "customerId" TEXT,
    "customerName" TEXT NOT NULL,
    "salesOrderId" TEXT,
    "totalAmount" REAL NOT NULL,
    "paidAmount" REAL NOT NULL DEFAULT 0,
    "balance" REAL NOT NULL,
    "dueDate" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "AccountsReceivable_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "AccountsReceivable_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "resource" TEXT NOT NULL,
    "resourceId" TEXT,
    "details" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Branch" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "manager" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "CompanySettings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "companyName" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "taxId" TEXT,
    "website" TEXT,
    "logoUrl" TEXT,
    "headerText" TEXT,
    "footerText" TEXT,
    "receiptHeader" TEXT,
    "receiptFooter" TEXT,
    "primaryColor" TEXT NOT NULL DEFAULT '#3b82f6',
    "secondaryColor" TEXT NOT NULL DEFAULT '#1e40af',
    "fontFamily" TEXT NOT NULL DEFAULT 'Inter',
    "paperSize" TEXT NOT NULL DEFAULT 'A4',
    "thermalPrinter" BOOLEAN NOT NULL DEFAULT false,
    "autoPrintReceipts" BOOLEAN NOT NULL DEFAULT false,
    "vatEnabled" BOOLEAN NOT NULL DEFAULT false,
    "vatRate" REAL NOT NULL DEFAULT 12.0,
    "vatRegistrationNumber" TEXT,
    "taxInclusive" BOOLEAN NOT NULL DEFAULT true,
    "maxDiscountPercentage" REAL NOT NULL DEFAULT 50.0,
    "requireDiscountApproval" BOOLEAN NOT NULL DEFAULT false,
    "discountApprovalThreshold" REAL NOT NULL DEFAULT 20.0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Customer" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "customerCode" TEXT NOT NULL,
    "companyName" TEXT,
    "contactPerson" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "address" TEXT,
    "city" TEXT,
    "region" TEXT,
    "postalCode" TEXT,
    "paymentTerms" TEXT NOT NULL DEFAULT 'Net 30',
    "creditLimit" REAL,
    "taxId" TEXT,
    "customerType" TEXT NOT NULL DEFAULT 'regular',
    "notes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "CustomerPurchaseHistory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "customerId" TEXT NOT NULL,
    "saleId" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "totalAmount" REAL NOT NULL,
    "itemsCount" INTEGER NOT NULL,
    "paymentMethod" TEXT NOT NULL,
    "purchaseDate" DATETIME NOT NULL,
    "loyaltyPointsEarned" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CustomerPurchaseHistory_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "POSSale" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "CustomerPurchaseHistory_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "CustomerPurchaseHistory_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DailySalesSummary" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "branchId" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "totalSales" REAL NOT NULL,
    "totalTransactions" INTEGER NOT NULL,
    "averageTransaction" REAL NOT NULL,
    "cashSales" REAL NOT NULL,
    "cardSales" REAL NOT NULL,
    "digitalSales" REAL NOT NULL,
    "creditSales" REAL NOT NULL,
    "totalTax" REAL NOT NULL,
    "totalDiscount" REAL NOT NULL,
    "grossProfit" REAL NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "DailySalesSummary_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "EmployeePerformance" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "totalSales" REAL NOT NULL,
    "transactionCount" INTEGER NOT NULL,
    "averageTransaction" REAL NOT NULL,
    "itemsSold" INTEGER NOT NULL,
    "returnsHandled" INTEGER NOT NULL DEFAULT 0,
    "customerSatisfaction" REAL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "EmployeePerformance_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "EmployeePerformance_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Expense" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "branchId" TEXT NOT NULL,
    "expenseDate" DATETIME NOT NULL,
    "category" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "description" TEXT NOT NULL,
    "paymentMethod" TEXT NOT NULL,
    "vendor" TEXT,
    "receiptUrl" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Expense_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "InventoryBatch" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "batchNumber" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "warehouseId" TEXT NOT NULL,
    "quantity" REAL NOT NULL,
    "unitCost" REAL NOT NULL,
    "expiryDate" DATETIME NOT NULL,
    "receivedDate" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "InventoryBatch_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "Warehouse" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "InventoryBatch_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "POSReceipt" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "saleId" TEXT NOT NULL,
    "receiptNumber" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "cashierId" TEXT NOT NULL,
    "customerId" TEXT,
    "subtotal" REAL NOT NULL,
    "tax" REAL NOT NULL,
    "totalAmount" REAL NOT NULL,
    "paymentMethod" TEXT NOT NULL,
    "amountReceived" REAL NOT NULL,
    "change" REAL NOT NULL,
    "discountAmount" REAL NOT NULL DEFAULT 0,
    "discountReason" TEXT,
    "loyaltyPoints" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "barcode" TEXT,
    "qrCode" TEXT,
    "isPrinted" BOOLEAN NOT NULL DEFAULT false,
    "printCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "POSReceipt_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "POSSale" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "POSReceipt_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "POSReceipt_cashierId_fkey" FOREIGN KEY ("cashierId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "POSReceipt_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "POSSale" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "receiptNumber" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "subtotal" REAL NOT NULL,
    "discount" REAL NOT NULL DEFAULT 0,
    "discountType" TEXT,
    "discountValue" REAL,
    "discountReason" TEXT,
    "tax" REAL NOT NULL DEFAULT 0,
    "totalAmount" REAL NOT NULL,
    "paymentMethod" TEXT NOT NULL,
    "amountReceived" REAL,
    "change" REAL,
    "convertedFromOrderId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "POSSale_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "POSSaleItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "saleId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "quantity" REAL NOT NULL,
    "uom" TEXT NOT NULL,
    "originalPrice" REAL,
    "unitPrice" REAL NOT NULL,
    "discount" REAL NOT NULL DEFAULT 0,
    "discountType" TEXT,
    "discountValue" REAL,
    "subtotal" REAL NOT NULL,
    "costOfGoodsSold" REAL NOT NULL,
    CONSTRAINT "POSSaleItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "POSSaleItem_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "POSSale" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PasswordResetToken" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" DATETIME NOT NULL,
    "used" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PasswordResetToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Permission" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "resource" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL,
    "imageUrl" TEXT,
    "basePrice" REAL NOT NULL,
    "averageCostPrice" REAL NOT NULL DEFAULT 0,
    "baseUOM" TEXT NOT NULL,
    "minStockLevel" INTEGER NOT NULL,
    "shelfLifeDays" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "ProductUOM" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "productId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "conversionFactor" REAL NOT NULL,
    "sellingPrice" REAL NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ProductUOM_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PromotionUsage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "promotionName" TEXT NOT NULL,
    "promotionCode" TEXT,
    "saleId" TEXT NOT NULL,
    "customerId" TEXT,
    "discountAmount" REAL NOT NULL,
    "discountType" TEXT NOT NULL,
    "discountValue" REAL NOT NULL,
    "usageDate" DATETIME NOT NULL,
    "branchId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PromotionUsage_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "PromotionUsage_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "PromotionUsage_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "POSSale" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PurchaseOrder" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "poNumber" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "warehouseId" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "totalAmount" REAL NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "receivingStatus" TEXT DEFAULT 'pending',
    "expectedDeliveryDate" DATETIME NOT NULL,
    "actualDeliveryDate" DATETIME,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "PurchaseOrder_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "PurchaseOrder_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "Warehouse" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "PurchaseOrder_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PurchaseOrderItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "poId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "quantity" REAL NOT NULL,
    "uom" TEXT NOT NULL,
    "unitPrice" REAL NOT NULL,
    "subtotal" REAL NOT NULL,
    "receivedQuantity" REAL NOT NULL DEFAULT 0,
    CONSTRAINT "PurchaseOrderItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "PurchaseOrderItem_poId_fkey" FOREIGN KEY ("poId") REFERENCES "PurchaseOrder" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ReceivingVoucher" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "rvNumber" TEXT NOT NULL,
    "purchaseOrderId" TEXT NOT NULL,
    "warehouseId" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "receiverName" TEXT NOT NULL,
    "deliveryNotes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'complete',
    "totalOrderedAmount" REAL NOT NULL,
    "totalReceivedAmount" REAL NOT NULL,
    "varianceAmount" REAL NOT NULL,
    "receivedDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ReceivingVoucher_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ReceivingVoucher_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "Warehouse" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ReceivingVoucher_purchaseOrderId_fkey" FOREIGN KEY ("purchaseOrderId") REFERENCES "PurchaseOrder" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ReceivingVoucherItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "rvId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "orderedQuantity" REAL NOT NULL,
    "receivedQuantity" REAL NOT NULL,
    "varianceQuantity" REAL NOT NULL,
    "variancePercentage" REAL NOT NULL,
    "varianceReason" TEXT,
    "unitPrice" REAL NOT NULL,
    "lineTotal" REAL NOT NULL,
    CONSTRAINT "ReceivingVoucherItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ReceivingVoucherItem_rvId_fkey" FOREIGN KEY ("rvId") REFERENCES "ReceivingVoucher" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ReportExport" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "reportType" TEXT NOT NULL,
    "reportName" TEXT NOT NULL,
    "format" TEXT NOT NULL,
    "fileUrl" TEXT,
    "fileSize" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "filters" JSONB,
    "errorMessage" TEXT,
    "requestedBy" TEXT NOT NULL,
    "completedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "ReportTemplate" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "description" TEXT,
    "template" JSONB NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdBy" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Role" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "RolePermission" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "roleId" TEXT NOT NULL,
    "permissionId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "RolePermission_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "Permission" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "RolePermission_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SalesOrder" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orderNumber" TEXT NOT NULL,
    "customerId" TEXT,
    "customerName" TEXT NOT NULL,
    "customerPhone" TEXT NOT NULL,
    "customerEmail" TEXT,
    "deliveryAddress" TEXT NOT NULL,
    "warehouseId" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "totalAmount" REAL NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "salesOrderStatus" TEXT NOT NULL DEFAULT 'pending',
    "deliveryDate" DATETIME NOT NULL,
    "convertedToSaleId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "SalesOrder_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "SalesOrder_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "Warehouse" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "SalesOrder_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SalesOrderItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "soId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "quantity" REAL NOT NULL,
    "uom" TEXT NOT NULL,
    "unitPrice" REAL NOT NULL,
    "subtotal" REAL NOT NULL,
    CONSTRAINT "SalesOrderItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "SalesOrderItem_soId_fkey" FOREIGN KEY ("soId") REFERENCES "SalesOrder" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "expiresAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "StockMovement" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "batchId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "quantity" REAL NOT NULL,
    "reason" TEXT,
    "referenceId" TEXT,
    "referenceType" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "StockMovement_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "InventoryBatch" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Supplier" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "companyName" TEXT NOT NULL,
    "contactPerson" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "paymentTerms" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "phone" TEXT,
    "roleId" TEXT NOT NULL,
    "branchId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "branchLockEnabled" BOOLEAN NOT NULL DEFAULT false,
    "lastLoginAt" DATETIME,
    "passwordChangedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "User_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "User_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "UserBranchAccess" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "UserBranchAccess_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "UserBranchAccess_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Warehouse" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "manager" TEXT NOT NULL,
    "maxCapacity" INTEGER NOT NULL,
    "branchId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Warehouse_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ProductCategory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "isSystemDefined" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "ExpenseCategory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "isSystemDefined" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "PaymentMethod" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "isSystemDefined" BOOLEAN NOT NULL DEFAULT false,
    "applicableTo" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "UnitOfMeasure" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "isSystemDefined" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "ExpenseVendor" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "contactPerson" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE INDEX "APPayment_paymentDate_idx" ON "APPayment"("paymentDate");

-- CreateIndex
CREATE INDEX "APPayment_apId_idx" ON "APPayment"("apId");

-- CreateIndex
CREATE INDEX "ARPayment_paymentDate_idx" ON "ARPayment"("paymentDate");

-- CreateIndex
CREATE INDEX "ARPayment_arId_idx" ON "ARPayment"("arId");

-- CreateIndex
CREATE INDEX "AccountsPayable_status_dueDate_idx" ON "AccountsPayable"("status", "dueDate");

-- CreateIndex
CREATE INDEX "AccountsPayable_supplierId_status_idx" ON "AccountsPayable"("supplierId", "status");

-- CreateIndex
CREATE INDEX "AccountsPayable_branchId_status_idx" ON "AccountsPayable"("branchId", "status");

-- CreateIndex
CREATE INDEX "AccountsPayable_createdAt_idx" ON "AccountsPayable"("createdAt");

-- CreateIndex
CREATE INDEX "AccountsPayable_dueDate_idx" ON "AccountsPayable"("dueDate");

-- CreateIndex
CREATE INDEX "AccountsPayable_status_idx" ON "AccountsPayable"("status");

-- CreateIndex
CREATE INDEX "AccountsPayable_supplierId_idx" ON "AccountsPayable"("supplierId");

-- CreateIndex
CREATE INDEX "AccountsPayable_branchId_idx" ON "AccountsPayable"("branchId");

-- CreateIndex
CREATE INDEX "AccountsReceivable_customerName_idx" ON "AccountsReceivable"("customerName");

-- CreateIndex
CREATE INDEX "AccountsReceivable_status_dueDate_idx" ON "AccountsReceivable"("status", "dueDate");

-- CreateIndex
CREATE INDEX "AccountsReceivable_branchId_status_idx" ON "AccountsReceivable"("branchId", "status");

-- CreateIndex
CREATE INDEX "AccountsReceivable_createdAt_idx" ON "AccountsReceivable"("createdAt");

-- CreateIndex
CREATE INDEX "AccountsReceivable_dueDate_idx" ON "AccountsReceivable"("dueDate");

-- CreateIndex
CREATE INDEX "AccountsReceivable_status_idx" ON "AccountsReceivable"("status");

-- CreateIndex
CREATE INDEX "AccountsReceivable_branchId_idx" ON "AccountsReceivable"("branchId");

-- CreateIndex
CREATE INDEX "AccountsReceivable_customerId_idx" ON "AccountsReceivable"("customerId");

-- CreateIndex
CREATE INDEX "idx_audit_log_action" ON "AuditLog"("action");

-- CreateIndex
CREATE INDEX "idx_audit_log_created" ON "AuditLog"("createdAt");

-- CreateIndex
CREATE INDEX "idx_audit_log_resource_id" ON "AuditLog"("resourceId");

-- CreateIndex
CREATE INDEX "idx_audit_log_resource" ON "AuditLog"("resource");

-- CreateIndex
CREATE INDEX "idx_audit_log_user" ON "AuditLog"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Branch_code_key" ON "Branch"("code");

-- CreateIndex
CREATE INDEX "Branch_createdAt_idx" ON "Branch"("createdAt");

-- CreateIndex
CREATE INDEX "Branch_code_idx" ON "Branch"("code");

-- CreateIndex
CREATE INDEX "Branch_status_idx" ON "Branch"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Customer_customerCode_key" ON "Customer"("customerCode");

-- CreateIndex
CREATE INDEX "Customer_customerType_idx" ON "Customer"("customerType");

-- CreateIndex
CREATE INDEX "Customer_email_idx" ON "Customer"("email");

-- CreateIndex
CREATE INDEX "Customer_contactPerson_idx" ON "Customer"("contactPerson");

-- CreateIndex
CREATE INDEX "Customer_companyName_idx" ON "Customer"("companyName");

-- CreateIndex
CREATE INDEX "Customer_customerCode_idx" ON "Customer"("customerCode");

-- CreateIndex
CREATE INDEX "Customer_status_idx" ON "Customer"("status");

-- CreateIndex
CREATE UNIQUE INDEX "CustomerPurchaseHistory_saleId_key" ON "CustomerPurchaseHistory"("saleId");

-- CreateIndex
CREATE INDEX "CustomerPurchaseHistory_paymentMethod_idx" ON "CustomerPurchaseHistory"("paymentMethod");

-- CreateIndex
CREATE INDEX "CustomerPurchaseHistory_customerId_purchaseDate_idx" ON "CustomerPurchaseHistory"("customerId", "purchaseDate");

-- CreateIndex
CREATE INDEX "CustomerPurchaseHistory_purchaseDate_idx" ON "CustomerPurchaseHistory"("purchaseDate");

-- CreateIndex
CREATE INDEX "CustomerPurchaseHistory_branchId_idx" ON "CustomerPurchaseHistory"("branchId");

-- CreateIndex
CREATE INDEX "CustomerPurchaseHistory_customerId_idx" ON "CustomerPurchaseHistory"("customerId");

-- CreateIndex
CREATE INDEX "DailySalesSummary_branchId_date_idx" ON "DailySalesSummary"("branchId", "date");

-- CreateIndex
CREATE INDEX "DailySalesSummary_date_idx" ON "DailySalesSummary"("date");

-- CreateIndex
CREATE INDEX "DailySalesSummary_branchId_idx" ON "DailySalesSummary"("branchId");

-- CreateIndex
CREATE UNIQUE INDEX "DailySalesSummary_branchId_date_key" ON "DailySalesSummary"("branchId", "date");

-- CreateIndex
CREATE INDEX "EmployeePerformance_branchId_date_idx" ON "EmployeePerformance"("branchId", "date");

-- CreateIndex
CREATE INDEX "EmployeePerformance_userId_date_idx" ON "EmployeePerformance"("userId", "date");

-- CreateIndex
CREATE INDEX "EmployeePerformance_date_idx" ON "EmployeePerformance"("date");

-- CreateIndex
CREATE INDEX "EmployeePerformance_branchId_idx" ON "EmployeePerformance"("branchId");

-- CreateIndex
CREATE INDEX "EmployeePerformance_userId_idx" ON "EmployeePerformance"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "EmployeePerformance_userId_branchId_date_key" ON "EmployeePerformance"("userId", "branchId", "date");

-- CreateIndex
CREATE INDEX "Expense_category_expenseDate_idx" ON "Expense"("category", "expenseDate");

-- CreateIndex
CREATE INDEX "Expense_branchId_expenseDate_idx" ON "Expense"("branchId", "expenseDate");

-- CreateIndex
CREATE INDEX "Expense_branchId_category_idx" ON "Expense"("branchId", "category");

-- CreateIndex
CREATE INDEX "Expense_createdAt_idx" ON "Expense"("createdAt");

-- CreateIndex
CREATE INDEX "Expense_expenseDate_idx" ON "Expense"("expenseDate");

-- CreateIndex
CREATE INDEX "Expense_category_idx" ON "Expense"("category");

-- CreateIndex
CREATE INDEX "Expense_branchId_idx" ON "Expense"("branchId");

-- CreateIndex
CREATE UNIQUE INDEX "InventoryBatch_batchNumber_key" ON "InventoryBatch"("batchNumber");

-- CreateIndex
CREATE INDEX "InventoryBatch_expiryDate_status_idx" ON "InventoryBatch"("expiryDate", "status");

-- CreateIndex
CREATE INDEX "InventoryBatch_warehouseId_status_idx" ON "InventoryBatch"("warehouseId", "status");

-- CreateIndex
CREATE INDEX "InventoryBatch_productId_status_idx" ON "InventoryBatch"("productId", "status");

-- CreateIndex
CREATE INDEX "InventoryBatch_batchNumber_idx" ON "InventoryBatch"("batchNumber");

-- CreateIndex
CREATE INDEX "InventoryBatch_status_idx" ON "InventoryBatch"("status");

-- CreateIndex
CREATE INDEX "InventoryBatch_expiryDate_idx" ON "InventoryBatch"("expiryDate");

-- CreateIndex
CREATE INDEX "InventoryBatch_productId_warehouseId_idx" ON "InventoryBatch"("productId", "warehouseId");

-- CreateIndex
CREATE UNIQUE INDEX "POSReceipt_saleId_key" ON "POSReceipt"("saleId");

-- CreateIndex
CREATE UNIQUE INDEX "POSReceipt_receiptNumber_key" ON "POSReceipt"("receiptNumber");

-- CreateIndex
CREATE INDEX "POSReceipt_paymentMethod_idx" ON "POSReceipt"("paymentMethod");

-- CreateIndex
CREATE INDEX "POSReceipt_createdAt_idx" ON "POSReceipt"("createdAt");

-- CreateIndex
CREATE INDEX "POSReceipt_customerId_idx" ON "POSReceipt"("customerId");

-- CreateIndex
CREATE INDEX "POSReceipt_cashierId_idx" ON "POSReceipt"("cashierId");

-- CreateIndex
CREATE INDEX "POSReceipt_branchId_idx" ON "POSReceipt"("branchId");

-- CreateIndex
CREATE INDEX "POSReceipt_receiptNumber_idx" ON "POSReceipt"("receiptNumber");

-- CreateIndex
CREATE UNIQUE INDEX "POSSale_receiptNumber_key" ON "POSSale"("receiptNumber");

-- CreateIndex
CREATE INDEX "POSSale_branchId_paymentMethod_idx" ON "POSSale"("branchId", "paymentMethod");

-- CreateIndex
CREATE INDEX "POSSale_branchId_createdAt_idx" ON "POSSale"("branchId", "createdAt");

-- CreateIndex
CREATE INDEX "POSSale_paymentMethod_idx" ON "POSSale"("paymentMethod");

-- CreateIndex
CREATE INDEX "POSSale_createdAt_idx" ON "POSSale"("createdAt");

-- CreateIndex
CREATE INDEX "POSSale_receiptNumber_idx" ON "POSSale"("receiptNumber");

-- CreateIndex
CREATE INDEX "POSSale_branchId_idx" ON "POSSale"("branchId");

-- CreateIndex
CREATE INDEX "POSSaleItem_productId_idx" ON "POSSaleItem"("productId");

-- CreateIndex
CREATE INDEX "POSSaleItem_saleId_idx" ON "POSSaleItem"("saleId");

-- CreateIndex
CREATE UNIQUE INDEX "PasswordResetToken_token_key" ON "PasswordResetToken"("token");

-- CreateIndex
CREATE INDEX "idx_password_reset_expires" ON "PasswordResetToken"("expiresAt");

-- CreateIndex
CREATE INDEX "idx_password_reset_token" ON "PasswordResetToken"("token");

-- CreateIndex
CREATE INDEX "idx_password_reset_user" ON "PasswordResetToken"("userId");

-- CreateIndex
CREATE INDEX "idx_permission_action" ON "Permission"("action");

-- CreateIndex
CREATE INDEX "idx_permission_resource" ON "Permission"("resource");

-- CreateIndex
CREATE UNIQUE INDEX "unique_permission_resource_action" ON "Permission"("resource", "action");

-- CreateIndex
CREATE UNIQUE INDEX "Product_name_key" ON "Product"("name");

-- CreateIndex
CREATE INDEX "Product_createdAt_idx" ON "Product"("createdAt");

-- CreateIndex
CREATE INDEX "Product_category_status_idx" ON "Product"("category", "status");

-- CreateIndex
CREATE INDEX "Product_name_idx" ON "Product"("name");

-- CreateIndex
CREATE INDEX "Product_category_idx" ON "Product"("category");

-- CreateIndex
CREATE INDEX "Product_status_idx" ON "Product"("status");

-- CreateIndex
CREATE INDEX "ProductUOM_productId_idx" ON "ProductUOM"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "ProductUOM_productId_name_key" ON "ProductUOM"("productId", "name");

-- CreateIndex
CREATE INDEX "PromotionUsage_promotionCode_idx" ON "PromotionUsage"("promotionCode");

-- CreateIndex
CREATE INDEX "PromotionUsage_promotionName_idx" ON "PromotionUsage"("promotionName");

-- CreateIndex
CREATE INDEX "PromotionUsage_usageDate_idx" ON "PromotionUsage"("usageDate");

-- CreateIndex
CREATE INDEX "PromotionUsage_branchId_idx" ON "PromotionUsage"("branchId");

-- CreateIndex
CREATE INDEX "PromotionUsage_customerId_idx" ON "PromotionUsage"("customerId");

-- CreateIndex
CREATE INDEX "PromotionUsage_saleId_idx" ON "PromotionUsage"("saleId");

-- CreateIndex
CREATE UNIQUE INDEX "PurchaseOrder_poNumber_key" ON "PurchaseOrder"("poNumber");

-- CreateIndex
CREATE INDEX "PurchaseOrder_createdAt_idx" ON "PurchaseOrder"("createdAt");

-- CreateIndex
CREATE INDEX "PurchaseOrder_poNumber_idx" ON "PurchaseOrder"("poNumber");

-- CreateIndex
CREATE INDEX "PurchaseOrder_receivingStatus_idx" ON "PurchaseOrder"("receivingStatus");

-- CreateIndex
CREATE INDEX "PurchaseOrder_status_idx" ON "PurchaseOrder"("status");

-- CreateIndex
CREATE INDEX "PurchaseOrder_branchId_idx" ON "PurchaseOrder"("branchId");

-- CreateIndex
CREATE INDEX "PurchaseOrder_warehouseId_idx" ON "PurchaseOrder"("warehouseId");

-- CreateIndex
CREATE INDEX "PurchaseOrder_supplierId_idx" ON "PurchaseOrder"("supplierId");

-- CreateIndex
CREATE INDEX "PurchaseOrderItem_productId_idx" ON "PurchaseOrderItem"("productId");

-- CreateIndex
CREATE INDEX "PurchaseOrderItem_poId_idx" ON "PurchaseOrderItem"("poId");

-- CreateIndex
CREATE UNIQUE INDEX "ReceivingVoucher_rvNumber_key" ON "ReceivingVoucher"("rvNumber");

-- CreateIndex
CREATE INDEX "ReceivingVoucher_createdAt_idx" ON "ReceivingVoucher"("createdAt");

-- CreateIndex
CREATE INDEX "ReceivingVoucher_receivedDate_idx" ON "ReceivingVoucher"("receivedDate");

-- CreateIndex
CREATE INDEX "ReceivingVoucher_status_idx" ON "ReceivingVoucher"("status");

-- CreateIndex
CREATE INDEX "ReceivingVoucher_rvNumber_idx" ON "ReceivingVoucher"("rvNumber");

-- CreateIndex
CREATE INDEX "ReceivingVoucher_branchId_idx" ON "ReceivingVoucher"("branchId");

-- CreateIndex
CREATE INDEX "ReceivingVoucher_warehouseId_idx" ON "ReceivingVoucher"("warehouseId");

-- CreateIndex
CREATE INDEX "ReceivingVoucher_purchaseOrderId_idx" ON "ReceivingVoucher"("purchaseOrderId");

-- CreateIndex
CREATE INDEX "ReceivingVoucherItem_productId_idx" ON "ReceivingVoucherItem"("productId");

-- CreateIndex
CREATE INDEX "ReceivingVoucherItem_rvId_idx" ON "ReceivingVoucherItem"("rvId");

-- CreateIndex
CREATE INDEX "ReportExport_createdAt_idx" ON "ReportExport"("createdAt");

-- CreateIndex
CREATE INDEX "ReportExport_requestedBy_idx" ON "ReportExport"("requestedBy");

-- CreateIndex
CREATE INDEX "ReportExport_status_idx" ON "ReportExport"("status");

-- CreateIndex
CREATE INDEX "ReportExport_reportType_idx" ON "ReportExport"("reportType");

-- CreateIndex
CREATE INDEX "ReportTemplate_isDefault_idx" ON "ReportTemplate"("isDefault");

-- CreateIndex
CREATE INDEX "ReportTemplate_isActive_idx" ON "ReportTemplate"("isActive");

-- CreateIndex
CREATE INDEX "ReportTemplate_type_idx" ON "ReportTemplate"("type");

-- CreateIndex
CREATE UNIQUE INDEX "Role_name_key" ON "Role"("name");

-- CreateIndex
CREATE INDEX "idx_role_is_system" ON "Role"("isSystem");

-- CreateIndex
CREATE INDEX "idx_role_name" ON "Role"("name");

-- CreateIndex
CREATE INDEX "idx_role_permission_permission" ON "RolePermission"("permissionId");

-- CreateIndex
CREATE INDEX "idx_role_permission_role" ON "RolePermission"("roleId");

-- CreateIndex
CREATE UNIQUE INDEX "unique_role_permission" ON "RolePermission"("roleId", "permissionId");

-- CreateIndex
CREATE UNIQUE INDEX "SalesOrder_orderNumber_key" ON "SalesOrder"("orderNumber");

-- CreateIndex
CREATE INDEX "SalesOrder_createdAt_idx" ON "SalesOrder"("createdAt");

-- CreateIndex
CREATE INDEX "SalesOrder_orderNumber_idx" ON "SalesOrder"("orderNumber");

-- CreateIndex
CREATE INDEX "SalesOrder_salesOrderStatus_idx" ON "SalesOrder"("salesOrderStatus");

-- CreateIndex
CREATE INDEX "SalesOrder_status_idx" ON "SalesOrder"("status");

-- CreateIndex
CREATE INDEX "SalesOrder_branchId_idx" ON "SalesOrder"("branchId");

-- CreateIndex
CREATE INDEX "SalesOrder_warehouseId_idx" ON "SalesOrder"("warehouseId");

-- CreateIndex
CREATE INDEX "SalesOrder_customerId_idx" ON "SalesOrder"("customerId");

-- CreateIndex
CREATE INDEX "SalesOrderItem_productId_idx" ON "SalesOrderItem"("productId");

-- CreateIndex
CREATE INDEX "SalesOrderItem_soId_idx" ON "SalesOrderItem"("soId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_token_key" ON "Session"("token");

-- CreateIndex
CREATE INDEX "idx_session_expires" ON "Session"("expiresAt");

-- CreateIndex
CREATE INDEX "idx_session_token" ON "Session"("token");

-- CreateIndex
CREATE INDEX "idx_session_user" ON "Session"("userId");

-- CreateIndex
CREATE INDEX "StockMovement_createdAt_idx" ON "StockMovement"("createdAt");

-- CreateIndex
CREATE INDEX "StockMovement_referenceId_referenceType_idx" ON "StockMovement"("referenceId", "referenceType");

-- CreateIndex
CREATE INDEX "StockMovement_batchId_idx" ON "StockMovement"("batchId");

-- CreateIndex
CREATE INDEX "Supplier_companyName_idx" ON "Supplier"("companyName");

-- CreateIndex
CREATE INDEX "Supplier_status_idx" ON "Supplier"("status");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "idx_user_email_verified" ON "User"("emailVerified");

-- CreateIndex
CREATE INDEX "idx_user_status" ON "User"("status");

-- CreateIndex
CREATE INDEX "idx_user_branch" ON "User"("branchId");

-- CreateIndex
CREATE INDEX "idx_user_role" ON "User"("roleId");

-- CreateIndex
CREATE INDEX "idx_user_email" ON "User"("email");

-- CreateIndex
CREATE INDEX "idx_user_branch_access_branch" ON "UserBranchAccess"("branchId");

-- CreateIndex
CREATE INDEX "idx_user_branch_access_user" ON "UserBranchAccess"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "unique_user_branch_access" ON "UserBranchAccess"("userId", "branchId");

-- CreateIndex
CREATE INDEX "Warehouse_branchId_name_idx" ON "Warehouse"("branchId", "name");

-- CreateIndex
CREATE INDEX "Warehouse_branchId_idx" ON "Warehouse"("branchId");

-- CreateIndex
CREATE UNIQUE INDEX "ProductCategory_name_key" ON "ProductCategory"("name");

-- CreateIndex
CREATE UNIQUE INDEX "ProductCategory_code_key" ON "ProductCategory"("code");

-- CreateIndex
CREATE INDEX "ProductCategory_status_idx" ON "ProductCategory"("status");

-- CreateIndex
CREATE INDEX "ProductCategory_displayOrder_idx" ON "ProductCategory"("displayOrder");

-- CreateIndex
CREATE UNIQUE INDEX "ExpenseCategory_name_key" ON "ExpenseCategory"("name");

-- CreateIndex
CREATE UNIQUE INDEX "ExpenseCategory_code_key" ON "ExpenseCategory"("code");

-- CreateIndex
CREATE INDEX "ExpenseCategory_status_idx" ON "ExpenseCategory"("status");

-- CreateIndex
CREATE INDEX "ExpenseCategory_displayOrder_idx" ON "ExpenseCategory"("displayOrder");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentMethod_name_key" ON "PaymentMethod"("name");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentMethod_code_key" ON "PaymentMethod"("code");

-- CreateIndex
CREATE INDEX "PaymentMethod_status_idx" ON "PaymentMethod"("status");

-- CreateIndex
CREATE INDEX "PaymentMethod_displayOrder_idx" ON "PaymentMethod"("displayOrder");

-- CreateIndex
CREATE UNIQUE INDEX "UnitOfMeasure_name_key" ON "UnitOfMeasure"("name");

-- CreateIndex
CREATE UNIQUE INDEX "UnitOfMeasure_code_key" ON "UnitOfMeasure"("code");

-- CreateIndex
CREATE INDEX "UnitOfMeasure_status_idx" ON "UnitOfMeasure"("status");

-- CreateIndex
CREATE INDEX "UnitOfMeasure_displayOrder_idx" ON "UnitOfMeasure"("displayOrder");

-- CreateIndex
CREATE UNIQUE INDEX "ExpenseVendor_name_key" ON "ExpenseVendor"("name");

-- CreateIndex
CREATE INDEX "ExpenseVendor_status_idx" ON "ExpenseVendor"("status");

-- CreateIndex
CREATE INDEX "ExpenseVendor_name_idx" ON "ExpenseVendor"("name");

-- CreateIndex
CREATE INDEX "ExpenseVendor_usageCount_idx" ON "ExpenseVendor"("usageCount");
