-- AlterTable
ALTER TABLE "PurchaseOrder" ADD COLUMN     "receivingStatus" TEXT DEFAULT 'pending';

-- AlterTable
ALTER TABLE "PurchaseOrderItem" ADD COLUMN     "receivedQuantity" DECIMAL(10,2) NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "ReceivingVoucher" (
    "id" TEXT NOT NULL,
    "rvNumber" TEXT NOT NULL,
    "purchaseOrderId" TEXT NOT NULL,
    "warehouseId" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "receiverName" TEXT NOT NULL,
    "deliveryNotes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'complete',
    "totalOrderedAmount" DECIMAL(10,2) NOT NULL,
    "totalReceivedAmount" DECIMAL(10,2) NOT NULL,
    "varianceAmount" DECIMAL(10,2) NOT NULL,
    "receivedDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReceivingVoucher_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReceivingVoucherItem" (
    "id" TEXT NOT NULL,
    "rvId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "orderedQuantity" DECIMAL(10,2) NOT NULL,
    "receivedQuantity" DECIMAL(10,2) NOT NULL,
    "varianceQuantity" DECIMAL(10,2) NOT NULL,
    "variancePercentage" DECIMAL(5,2) NOT NULL,
    "varianceReason" TEXT,
    "unitPrice" DECIMAL(10,2) NOT NULL,
    "lineTotal" DECIMAL(10,2) NOT NULL,

    CONSTRAINT "ReceivingVoucherItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ReceivingVoucher_rvNumber_key" ON "ReceivingVoucher"("rvNumber");

-- CreateIndex
CREATE INDEX "ReceivingVoucher_purchaseOrderId_idx" ON "ReceivingVoucher"("purchaseOrderId");

-- CreateIndex
CREATE INDEX "ReceivingVoucher_warehouseId_idx" ON "ReceivingVoucher"("warehouseId");

-- CreateIndex
CREATE INDEX "ReceivingVoucher_branchId_idx" ON "ReceivingVoucher"("branchId");

-- CreateIndex
CREATE INDEX "ReceivingVoucher_rvNumber_idx" ON "ReceivingVoucher"("rvNumber");

-- CreateIndex
CREATE INDEX "ReceivingVoucher_status_idx" ON "ReceivingVoucher"("status");

-- CreateIndex
CREATE INDEX "ReceivingVoucher_receivedDate_idx" ON "ReceivingVoucher"("receivedDate");

-- CreateIndex
CREATE INDEX "ReceivingVoucher_createdAt_idx" ON "ReceivingVoucher"("createdAt");

-- CreateIndex
CREATE INDEX "ReceivingVoucherItem_rvId_idx" ON "ReceivingVoucherItem"("rvId");

-- CreateIndex
CREATE INDEX "ReceivingVoucherItem_productId_idx" ON "ReceivingVoucherItem"("productId");

-- CreateIndex
CREATE INDEX "PurchaseOrder_receivingStatus_idx" ON "PurchaseOrder"("receivingStatus");

-- AddForeignKey
ALTER TABLE "ReceivingVoucher" ADD CONSTRAINT "ReceivingVoucher_purchaseOrderId_fkey" FOREIGN KEY ("purchaseOrderId") REFERENCES "PurchaseOrder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReceivingVoucher" ADD CONSTRAINT "ReceivingVoucher_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "Warehouse"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReceivingVoucher" ADD CONSTRAINT "ReceivingVoucher_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReceivingVoucherItem" ADD CONSTRAINT "ReceivingVoucherItem_rvId_fkey" FOREIGN KEY ("rvId") REFERENCES "ReceivingVoucher"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReceivingVoucherItem" ADD CONSTRAINT "ReceivingVoucherItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
