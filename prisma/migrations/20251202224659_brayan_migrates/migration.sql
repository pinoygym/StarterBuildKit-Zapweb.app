-- DropIndex
DROP INDEX "AccountsPayable_status_idx";

-- DropIndex
DROP INDEX "AccountsReceivable_status_idx";

-- CreateIndex
CREATE INDEX "AccountsPayable_purchaseOrderId_idx" ON "AccountsPayable"("purchaseOrderId");

-- CreateIndex
CREATE INDEX "AccountsReceivable_salesOrderId_idx" ON "AccountsReceivable"("salesOrderId");

-- CreateIndex
CREATE INDEX "Customer_customerType_status_idx" ON "Customer"("customerType", "status");

-- CreateIndex
CREATE INDEX "Customer_status_createdAt_idx" ON "Customer"("status", "createdAt");

-- CreateIndex
CREATE INDEX "POSSaleItem_saleId_productId_idx" ON "POSSaleItem"("saleId", "productId");

-- CreateIndex
CREATE INDEX "PurchaseOrder_status_createdAt_idx" ON "PurchaseOrder"("status", "createdAt");

-- CreateIndex
CREATE INDEX "PurchaseOrder_branchId_status_createdAt_idx" ON "PurchaseOrder"("branchId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "PurchaseOrderItem_poId_productId_idx" ON "PurchaseOrderItem"("poId", "productId");

-- CreateIndex
CREATE INDEX "ReceivingVoucher_status_createdAt_idx" ON "ReceivingVoucher"("status", "createdAt");

-- CreateIndex
CREATE INDEX "ReceivingVoucher_branchId_status_createdAt_idx" ON "ReceivingVoucher"("branchId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "ReceivingVoucherItem_rvId_productId_idx" ON "ReceivingVoucherItem"("rvId", "productId");

-- CreateIndex
CREATE INDEX "SalesOrder_status_createdAt_idx" ON "SalesOrder"("status", "createdAt");

-- CreateIndex
CREATE INDEX "SalesOrder_branchId_status_createdAt_idx" ON "SalesOrder"("branchId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "SalesOrderItem_soId_productId_idx" ON "SalesOrderItem"("soId", "productId");

-- CreateIndex
CREATE INDEX "StockMovement_type_createdAt_idx" ON "StockMovement"("type", "createdAt");

-- CreateIndex
CREATE INDEX "StockMovement_warehouseId_createdAt_idx" ON "StockMovement"("warehouseId", "createdAt");

-- CreateIndex
CREATE INDEX "StockMovement_referenceId_referenceType_createdAt_idx" ON "StockMovement"("referenceId", "referenceType", "createdAt");

-- CreateIndex
CREATE INDEX "User_roleId_status_idx" ON "User"("roleId", "status");

-- CreateIndex
CREATE INDEX "User_branchId_status_idx" ON "User"("branchId", "status");
