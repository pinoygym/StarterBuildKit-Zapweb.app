-- AlterEnum
ALTER TYPE "PermissionResource" ADD VALUE 'JOB_ORDERS';

-- DropIndex
DROP INDEX "JobOrder_status_idx";

-- AlterTable
ALTER TABLE "APPayment" ADD COLUMN     "fundSourceId" TEXT;

-- AlterTable
ALTER TABLE "ARPayment" ADD COLUMN     "fundSourceId" TEXT;

-- AlterTable
ALTER TABLE "AccountsPayable" ADD COLUMN     "discountAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "otherCharges" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "rebates" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "salesDiscount" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "taxAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "taxExemption" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "withholdingTax" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "CompanySettings" ADD COLUMN     "approvalRules" TEXT NOT NULL DEFAULT '{}';

-- AlterTable
ALTER TABLE "Customer" ADD COLUMN     "createdById" TEXT,
ADD COLUMN     "updatedById" TEXT;

-- AlterTable
ALTER TABLE "Expense" ADD COLUMN     "fundSourceId" TEXT;

-- AlterTable
ALTER TABLE "POSSale" ADD COLUMN     "customerId" TEXT,
ADD COLUMN     "customerName" TEXT;

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "createdById" TEXT,
ADD COLUMN     "productCategoryId" TEXT,
ADD COLUMN     "supplierId" TEXT,
ADD COLUMN     "updatedById" TEXT;

-- AlterTable
ALTER TABLE "PurchaseOrder" ADD COLUMN     "createdById" TEXT,
ADD COLUMN     "discountAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "otherCharges" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "taxAmount" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "ReceivingVoucher" ADD COLUMN     "createdById" TEXT;

-- AlterTable
ALTER TABLE "SalesOrder" ADD COLUMN     "ciNumber" TEXT,
ADD COLUMN     "createdById" TEXT;

-- AlterTable
ALTER TABLE "StockMovement" ADD COLUMN     "conversionFactor" DOUBLE PRECISION,
ADD COLUMN     "uom" TEXT;

-- AlterTable
ALTER TABLE "Supplier" ADD COLUMN     "createdById" TEXT,
ADD COLUMN     "taxId" TEXT,
ADD COLUMN     "updatedById" TEXT;

-- CreateTable
CREATE TABLE "RoadmapItem" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PLANNED',
    "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
    "tags" TEXT[],
    "targetDate" TIMESTAMP(3),
    "authorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RoadmapItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RoadmapComment" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "roadmapItemId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RoadmapComment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApprovalRequest" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "data" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "requestedId" TEXT NOT NULL,
    "reviewedId" TEXT,
    "reason" TEXT,
    "reviewNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ApprovalRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "link" TEXT,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "userId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InventoryAdjustment" (
    "id" TEXT NOT NULL,
    "adjustmentNumber" TEXT NOT NULL,
    "warehouseId" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "referenceNumber" TEXT,
    "adjustmentDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT NOT NULL,
    "postedById" TEXT,
    "updatedById" TEXT,

    CONSTRAINT "InventoryAdjustment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InventoryAdjustmentItem" (
    "id" TEXT NOT NULL,
    "adjustmentId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "uom" TEXT NOT NULL,
    "systemQuantity" DOUBLE PRECISION,
    "actualQuantity" DOUBLE PRECISION,
    "type" TEXT NOT NULL DEFAULT 'RELATIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InventoryAdjustmentItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InventoryTransfer" (
    "id" TEXT NOT NULL,
    "transferNumber" TEXT NOT NULL,
    "sourceWarehouseId" TEXT NOT NULL,
    "destinationWarehouseId" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "reason" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "transferDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT NOT NULL,

    CONSTRAINT "InventoryTransfer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InventoryTransferItem" (
    "id" TEXT NOT NULL,
    "transferId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "uom" TEXT NOT NULL,

    CONSTRAINT "InventoryTransferItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FundSource" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "branchId" TEXT,
    "bankName" TEXT,
    "accountNumber" TEXT,
    "accountHolder" TEXT,
    "description" TEXT,
    "openingBalance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "currentBalance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'PHP',
    "status" TEXT NOT NULL DEFAULT 'active',
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FundSource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FundTransaction" (
    "id" TEXT NOT NULL,
    "fundSourceId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "runningBalance" DOUBLE PRECISION NOT NULL,
    "referenceType" TEXT,
    "referenceId" TEXT,
    "description" TEXT,
    "transactionDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FundTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FundTransfer" (
    "id" TEXT NOT NULL,
    "transferNumber" TEXT NOT NULL,
    "fromFundSourceId" TEXT NOT NULL,
    "toFundSourceId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "transferFee" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "netAmount" DOUBLE PRECISION NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'completed',
    "transferDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FundTransfer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CooperativeMember" (
    "id" TEXT NOT NULL,
    "memberCode" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "middleName" TEXT,
    "dateOfBirth" TIMESTAMP(3) NOT NULL,
    "gender" TEXT NOT NULL,
    "civilStatus" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT NOT NULL,
    "alternatePhone" TEXT,
    "address" TEXT NOT NULL,
    "city" TEXT,
    "region" TEXT,
    "postalCode" TEXT,
    "membershipTypeId" TEXT NOT NULL,
    "membershipDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'active',
    "emergencyContactName" TEXT,
    "emergencyContactPhone" TEXT,
    "emergencyContactRelation" TEXT,
    "tinNumber" TEXT,
    "sssNumber" TEXT,
    "photoUrl" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT,
    "updatedById" TEXT,

    CONSTRAINT "CooperativeMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MembershipType" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "requiredShareCapital" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "monthlyDues" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "benefits" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "isSystemDefined" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MembershipType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MemberContribution" (
    "id" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "contributionType" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "contributionDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "referenceNumber" TEXT,
    "paymentMethod" TEXT NOT NULL,
    "notes" TEXT,
    "recordedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MemberContribution_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MemberBeneficiary" (
    "id" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "relationship" TEXT NOT NULL,
    "dateOfBirth" TIMESTAMP(3),
    "phone" TEXT,
    "percentage" DOUBLE PRECISION,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MemberBeneficiary_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RoadmapItem_status_idx" ON "RoadmapItem"("status");

-- CreateIndex
CREATE INDEX "RoadmapItem_priority_idx" ON "RoadmapItem"("priority");

-- CreateIndex
CREATE INDEX "RoadmapItem_authorId_idx" ON "RoadmapItem"("authorId");

-- CreateIndex
CREATE INDEX "RoadmapItem_createdAt_idx" ON "RoadmapItem"("createdAt");

-- CreateIndex
CREATE INDEX "RoadmapComment_roadmapItemId_idx" ON "RoadmapComment"("roadmapItemId");

-- CreateIndex
CREATE INDEX "RoadmapComment_userId_idx" ON "RoadmapComment"("userId");

-- CreateIndex
CREATE INDEX "ApprovalRequest_requestedId_idx" ON "ApprovalRequest"("requestedId");

-- CreateIndex
CREATE INDEX "ApprovalRequest_reviewedId_idx" ON "ApprovalRequest"("reviewedId");

-- CreateIndex
CREATE INDEX "ApprovalRequest_status_idx" ON "ApprovalRequest"("status");

-- CreateIndex
CREATE INDEX "ApprovalRequest_type_idx" ON "ApprovalRequest"("type");

-- CreateIndex
CREATE INDEX "Notification_userId_idx" ON "Notification"("userId");

-- CreateIndex
CREATE INDEX "Notification_isRead_idx" ON "Notification"("isRead");

-- CreateIndex
CREATE INDEX "Notification_createdAt_idx" ON "Notification"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "InventoryAdjustment_adjustmentNumber_key" ON "InventoryAdjustment"("adjustmentNumber");

-- CreateIndex
CREATE INDEX "InventoryAdjustment_warehouseId_idx" ON "InventoryAdjustment"("warehouseId");

-- CreateIndex
CREATE INDEX "InventoryAdjustment_status_idx" ON "InventoryAdjustment"("status");

-- CreateIndex
CREATE INDEX "InventoryAdjustment_adjustmentDate_idx" ON "InventoryAdjustment"("adjustmentDate");

-- CreateIndex
CREATE INDEX "InventoryAdjustmentItem_adjustmentId_idx" ON "InventoryAdjustmentItem"("adjustmentId");

-- CreateIndex
CREATE INDEX "InventoryAdjustmentItem_productId_idx" ON "InventoryAdjustmentItem"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "InventoryAdjustmentItem_adjustmentId_productId_key" ON "InventoryAdjustmentItem"("adjustmentId", "productId");

-- CreateIndex
CREATE UNIQUE INDEX "InventoryTransfer_transferNumber_key" ON "InventoryTransfer"("transferNumber");

-- CreateIndex
CREATE INDEX "InventoryTransfer_sourceWarehouseId_idx" ON "InventoryTransfer"("sourceWarehouseId");

-- CreateIndex
CREATE INDEX "InventoryTransfer_destinationWarehouseId_idx" ON "InventoryTransfer"("destinationWarehouseId");

-- CreateIndex
CREATE INDEX "InventoryTransfer_status_idx" ON "InventoryTransfer"("status");

-- CreateIndex
CREATE INDEX "InventoryTransfer_transferDate_idx" ON "InventoryTransfer"("transferDate");

-- CreateIndex
CREATE INDEX "InventoryTransferItem_transferId_idx" ON "InventoryTransferItem"("transferId");

-- CreateIndex
CREATE INDEX "InventoryTransferItem_productId_idx" ON "InventoryTransferItem"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "InventoryTransferItem_transferId_productId_key" ON "InventoryTransferItem"("transferId", "productId");

-- CreateIndex
CREATE UNIQUE INDEX "FundSource_code_key" ON "FundSource"("code");

-- CreateIndex
CREATE INDEX "FundSource_branchId_idx" ON "FundSource"("branchId");

-- CreateIndex
CREATE INDEX "FundSource_code_idx" ON "FundSource"("code");

-- CreateIndex
CREATE INDEX "FundSource_status_idx" ON "FundSource"("status");

-- CreateIndex
CREATE INDEX "FundTransaction_fundSourceId_idx" ON "FundTransaction"("fundSourceId");

-- CreateIndex
CREATE INDEX "FundTransaction_createdById_idx" ON "FundTransaction"("createdById");

-- CreateIndex
CREATE INDEX "FundTransaction_transactionDate_idx" ON "FundTransaction"("transactionDate");

-- CreateIndex
CREATE UNIQUE INDEX "FundTransfer_transferNumber_key" ON "FundTransfer"("transferNumber");

-- CreateIndex
CREATE INDEX "FundTransfer_fromFundSourceId_idx" ON "FundTransfer"("fromFundSourceId");

-- CreateIndex
CREATE INDEX "FundTransfer_toFundSourceId_idx" ON "FundTransfer"("toFundSourceId");

-- CreateIndex
CREATE INDEX "FundTransfer_transferNumber_idx" ON "FundTransfer"("transferNumber");

-- CreateIndex
CREATE UNIQUE INDEX "CooperativeMember_memberCode_key" ON "CooperativeMember"("memberCode");

-- CreateIndex
CREATE UNIQUE INDEX "CooperativeMember_email_key" ON "CooperativeMember"("email");

-- CreateIndex
CREATE INDEX "CooperativeMember_memberCode_idx" ON "CooperativeMember"("memberCode");

-- CreateIndex
CREATE INDEX "CooperativeMember_email_idx" ON "CooperativeMember"("email");

-- CreateIndex
CREATE INDEX "CooperativeMember_status_idx" ON "CooperativeMember"("status");

-- CreateIndex
CREATE INDEX "CooperativeMember_membershipTypeId_idx" ON "CooperativeMember"("membershipTypeId");

-- CreateIndex
CREATE INDEX "CooperativeMember_firstName_idx" ON "CooperativeMember"("firstName");

-- CreateIndex
CREATE INDEX "CooperativeMember_lastName_idx" ON "CooperativeMember"("lastName");

-- CreateIndex
CREATE INDEX "CooperativeMember_phone_idx" ON "CooperativeMember"("phone");

-- CreateIndex
CREATE INDEX "CooperativeMember_status_membershipTypeId_idx" ON "CooperativeMember"("status", "membershipTypeId");

-- CreateIndex
CREATE INDEX "CooperativeMember_createdAt_idx" ON "CooperativeMember"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "MembershipType_name_key" ON "MembershipType"("name");

-- CreateIndex
CREATE UNIQUE INDEX "MembershipType_code_key" ON "MembershipType"("code");

-- CreateIndex
CREATE INDEX "MembershipType_status_idx" ON "MembershipType"("status");

-- CreateIndex
CREATE INDEX "MembershipType_displayOrder_idx" ON "MembershipType"("displayOrder");

-- CreateIndex
CREATE INDEX "MemberContribution_memberId_idx" ON "MemberContribution"("memberId");

-- CreateIndex
CREATE INDEX "MemberContribution_contributionType_idx" ON "MemberContribution"("contributionType");

-- CreateIndex
CREATE INDEX "MemberContribution_contributionDate_idx" ON "MemberContribution"("contributionDate");

-- CreateIndex
CREATE INDEX "MemberContribution_recordedById_idx" ON "MemberContribution"("recordedById");

-- CreateIndex
CREATE INDEX "MemberContribution_memberId_contributionDate_idx" ON "MemberContribution"("memberId", "contributionDate");

-- CreateIndex
CREATE INDEX "MemberBeneficiary_memberId_idx" ON "MemberBeneficiary"("memberId");

-- CreateIndex
CREATE INDEX "MemberBeneficiary_isPrimary_idx" ON "MemberBeneficiary"("isPrimary");

-- CreateIndex
CREATE INDEX "APPayment_fundSourceId_idx" ON "APPayment"("fundSourceId");

-- CreateIndex
CREATE INDEX "ARPayment_fundSourceId_idx" ON "ARPayment"("fundSourceId");

-- CreateIndex
CREATE INDEX "Expense_fundSourceId_idx" ON "Expense"("fundSourceId");

-- CreateIndex
CREATE INDEX "POSSale_customerId_idx" ON "POSSale"("customerId");

-- CreateIndex
CREATE INDEX "Product_supplierId_idx" ON "Product"("supplierId");

-- CreateIndex
CREATE INDEX "Product_productCategoryId_idx" ON "Product"("productCategoryId");

-- AddForeignKey
ALTER TABLE "APPayment" ADD CONSTRAINT "APPayment_fundSourceId_fkey" FOREIGN KEY ("fundSourceId") REFERENCES "FundSource"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ARPayment" ADD CONSTRAINT "ARPayment_fundSourceId_fkey" FOREIGN KEY ("fundSourceId") REFERENCES "FundSource"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Customer" ADD CONSTRAINT "Customer_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Customer" ADD CONSTRAINT "Customer_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_fundSourceId_fkey" FOREIGN KEY ("fundSourceId") REFERENCES "FundSource"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "POSSale" ADD CONSTRAINT "POSSale_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_productCategoryId_fkey" FOREIGN KEY ("productCategoryId") REFERENCES "ProductCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseOrder" ADD CONSTRAINT "PurchaseOrder_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReceivingVoucher" ADD CONSTRAINT "ReceivingVoucher_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoadmapItem" ADD CONSTRAINT "RoadmapItem_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoadmapComment" ADD CONSTRAINT "RoadmapComment_roadmapItemId_fkey" FOREIGN KEY ("roadmapItemId") REFERENCES "RoadmapItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoadmapComment" ADD CONSTRAINT "RoadmapComment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesOrder" ADD CONSTRAINT "SalesOrder_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Supplier" ADD CONSTRAINT "Supplier_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Supplier" ADD CONSTRAINT "Supplier_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApprovalRequest" ADD CONSTRAINT "ApprovalRequest_requestedId_fkey" FOREIGN KEY ("requestedId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApprovalRequest" ADD CONSTRAINT "ApprovalRequest_reviewedId_fkey" FOREIGN KEY ("reviewedId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryAdjustment" ADD CONSTRAINT "InventoryAdjustment_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryAdjustment" ADD CONSTRAINT "InventoryAdjustment_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryAdjustment" ADD CONSTRAINT "InventoryAdjustment_postedById_fkey" FOREIGN KEY ("postedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryAdjustment" ADD CONSTRAINT "InventoryAdjustment_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryAdjustment" ADD CONSTRAINT "InventoryAdjustment_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "Warehouse"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryAdjustmentItem" ADD CONSTRAINT "InventoryAdjustmentItem_adjustmentId_fkey" FOREIGN KEY ("adjustmentId") REFERENCES "InventoryAdjustment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryAdjustmentItem" ADD CONSTRAINT "InventoryAdjustmentItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryTransfer" ADD CONSTRAINT "InventoryTransfer_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryTransfer" ADD CONSTRAINT "InventoryTransfer_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryTransfer" ADD CONSTRAINT "InventoryTransfer_destinationWarehouseId_fkey" FOREIGN KEY ("destinationWarehouseId") REFERENCES "Warehouse"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryTransfer" ADD CONSTRAINT "InventoryTransfer_sourceWarehouseId_fkey" FOREIGN KEY ("sourceWarehouseId") REFERENCES "Warehouse"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryTransferItem" ADD CONSTRAINT "InventoryTransferItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryTransferItem" ADD CONSTRAINT "InventoryTransferItem_transferId_fkey" FOREIGN KEY ("transferId") REFERENCES "InventoryTransfer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FundSource" ADD CONSTRAINT "FundSource_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FundTransaction" ADD CONSTRAINT "FundTransaction_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FundTransaction" ADD CONSTRAINT "FundTransaction_fundSourceId_fkey" FOREIGN KEY ("fundSourceId") REFERENCES "FundSource"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FundTransfer" ADD CONSTRAINT "FundTransfer_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FundTransfer" ADD CONSTRAINT "FundTransfer_fromFundSourceId_fkey" FOREIGN KEY ("fromFundSourceId") REFERENCES "FundSource"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FundTransfer" ADD CONSTRAINT "FundTransfer_toFundSourceId_fkey" FOREIGN KEY ("toFundSourceId") REFERENCES "FundSource"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CooperativeMember" ADD CONSTRAINT "CooperativeMember_membershipTypeId_fkey" FOREIGN KEY ("membershipTypeId") REFERENCES "MembershipType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CooperativeMember" ADD CONSTRAINT "CooperativeMember_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CooperativeMember" ADD CONSTRAINT "CooperativeMember_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MemberContribution" ADD CONSTRAINT "MemberContribution_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "CooperativeMember"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MemberContribution" ADD CONSTRAINT "MemberContribution_recordedById_fkey" FOREIGN KEY ("recordedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MemberBeneficiary" ADD CONSTRAINT "MemberBeneficiary_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "CooperativeMember"("id") ON DELETE CASCADE ON UPDATE CASCADE;
