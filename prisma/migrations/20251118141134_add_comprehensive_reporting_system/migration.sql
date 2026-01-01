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
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
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
    CONSTRAINT "POSReceipt_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "POSReceipt_cashierId_fkey" FOREIGN KEY ("cashierId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "POSReceipt_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "POSReceipt_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "POSSale" ("id") ON DELETE CASCADE ON UPDATE CASCADE
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
    CONSTRAINT "EmployeePerformance_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "EmployeePerformance_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch" ("id") ON DELETE CASCADE ON UPDATE CASCADE
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
    CONSTRAINT "CustomerPurchaseHistory_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "CustomerPurchaseHistory_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "CustomerPurchaseHistory_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "POSSale" ("id") ON DELETE CASCADE ON UPDATE CASCADE
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
    CONSTRAINT "PromotionUsage_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "POSSale" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "PromotionUsage_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "PromotionUsage_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Expense" (
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
INSERT INTO "new_Expense" ("amount", "branchId", "category", "createdAt", "description", "expenseDate", "id", "paymentMethod", "receiptUrl", "updatedAt", "vendor") SELECT "amount", "branchId", "category", "createdAt", "description", "expenseDate", "id", "paymentMethod", "receiptUrl", "updatedAt", "vendor" FROM "Expense";
DROP TABLE "Expense";
ALTER TABLE "new_Expense" RENAME TO "Expense";
CREATE INDEX "Expense_branchId_idx" ON "Expense"("branchId");
CREATE INDEX "Expense_category_idx" ON "Expense"("category");
CREATE INDEX "Expense_expenseDate_idx" ON "Expense"("expenseDate");
CREATE INDEX "Expense_createdAt_idx" ON "Expense"("createdAt");
CREATE INDEX "Expense_branchId_category_idx" ON "Expense"("branchId", "category");
CREATE INDEX "Expense_branchId_expenseDate_idx" ON "Expense"("branchId", "expenseDate");
CREATE INDEX "Expense_category_expenseDate_idx" ON "Expense"("category", "expenseDate");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "ReportTemplate_type_idx" ON "ReportTemplate"("type");

-- CreateIndex
CREATE INDEX "ReportTemplate_isActive_idx" ON "ReportTemplate"("isActive");

-- CreateIndex
CREATE INDEX "ReportTemplate_isDefault_idx" ON "ReportTemplate"("isDefault");

-- CreateIndex
CREATE INDEX "ReportExport_reportType_idx" ON "ReportExport"("reportType");

-- CreateIndex
CREATE INDEX "ReportExport_status_idx" ON "ReportExport"("status");

-- CreateIndex
CREATE INDEX "ReportExport_requestedBy_idx" ON "ReportExport"("requestedBy");

-- CreateIndex
CREATE INDEX "ReportExport_createdAt_idx" ON "ReportExport"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "POSReceipt_saleId_key" ON "POSReceipt"("saleId");

-- CreateIndex
CREATE UNIQUE INDEX "POSReceipt_receiptNumber_key" ON "POSReceipt"("receiptNumber");

-- CreateIndex
CREATE INDEX "POSReceipt_receiptNumber_idx" ON "POSReceipt"("receiptNumber");

-- CreateIndex
CREATE INDEX "POSReceipt_branchId_idx" ON "POSReceipt"("branchId");

-- CreateIndex
CREATE INDEX "POSReceipt_cashierId_idx" ON "POSReceipt"("cashierId");

-- CreateIndex
CREATE INDEX "POSReceipt_customerId_idx" ON "POSReceipt"("customerId");

-- CreateIndex
CREATE INDEX "POSReceipt_createdAt_idx" ON "POSReceipt"("createdAt");

-- CreateIndex
CREATE INDEX "POSReceipt_paymentMethod_idx" ON "POSReceipt"("paymentMethod");

-- CreateIndex
CREATE INDEX "DailySalesSummary_branchId_idx" ON "DailySalesSummary"("branchId");

-- CreateIndex
CREATE INDEX "DailySalesSummary_date_idx" ON "DailySalesSummary"("date");

-- CreateIndex
CREATE INDEX "DailySalesSummary_branchId_date_idx" ON "DailySalesSummary"("branchId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "DailySalesSummary_branchId_date_key" ON "DailySalesSummary"("branchId", "date");

-- CreateIndex
CREATE INDEX "EmployeePerformance_userId_idx" ON "EmployeePerformance"("userId");

-- CreateIndex
CREATE INDEX "EmployeePerformance_branchId_idx" ON "EmployeePerformance"("branchId");

-- CreateIndex
CREATE INDEX "EmployeePerformance_date_idx" ON "EmployeePerformance"("date");

-- CreateIndex
CREATE INDEX "EmployeePerformance_userId_date_idx" ON "EmployeePerformance"("userId", "date");

-- CreateIndex
CREATE INDEX "EmployeePerformance_branchId_date_idx" ON "EmployeePerformance"("branchId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "EmployeePerformance_userId_branchId_date_key" ON "EmployeePerformance"("userId", "branchId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "CustomerPurchaseHistory_saleId_key" ON "CustomerPurchaseHistory"("saleId");

-- CreateIndex
CREATE INDEX "CustomerPurchaseHistory_customerId_idx" ON "CustomerPurchaseHistory"("customerId");

-- CreateIndex
CREATE INDEX "CustomerPurchaseHistory_branchId_idx" ON "CustomerPurchaseHistory"("branchId");

-- CreateIndex
CREATE INDEX "CustomerPurchaseHistory_purchaseDate_idx" ON "CustomerPurchaseHistory"("purchaseDate");

-- CreateIndex
CREATE INDEX "CustomerPurchaseHistory_customerId_purchaseDate_idx" ON "CustomerPurchaseHistory"("customerId", "purchaseDate");

-- CreateIndex
CREATE INDEX "CustomerPurchaseHistory_paymentMethod_idx" ON "CustomerPurchaseHistory"("paymentMethod");

-- CreateIndex
CREATE INDEX "PromotionUsage_saleId_idx" ON "PromotionUsage"("saleId");

-- CreateIndex
CREATE INDEX "PromotionUsage_customerId_idx" ON "PromotionUsage"("customerId");

-- CreateIndex
CREATE INDEX "PromotionUsage_branchId_idx" ON "PromotionUsage"("branchId");

-- CreateIndex
CREATE INDEX "PromotionUsage_usageDate_idx" ON "PromotionUsage"("usageDate");

-- CreateIndex
CREATE INDEX "PromotionUsage_promotionName_idx" ON "PromotionUsage"("promotionName");

-- CreateIndex
CREATE INDEX "PromotionUsage_promotionCode_idx" ON "PromotionUsage"("promotionCode");
