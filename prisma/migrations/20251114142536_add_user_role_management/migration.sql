-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "PermissionResource" AS ENUM ('USERS', 'ROLES', 'PRODUCTS', 'INVENTORY', 'SALES', 'PURCHASES', 'ACCOUNTING', 'REPORTS', 'BRANCHES', 'SETTINGS');

-- CreateEnum
CREATE TYPE "PermissionAction" AS ENUM ('READ', 'CREATE', 'UPDATE', 'DELETE', 'MANAGE');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "phone" TEXT,
    "roleId" TEXT NOT NULL,
    "branchId" TEXT,
    "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "lastLoginAt" TIMESTAMP(3),
    "passwordChangedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Role" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Permission" (
    "id" TEXT NOT NULL,
    "resource" "PermissionResource" NOT NULL,
    "action" "PermissionAction" NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Permission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RolePermission" (
    "id" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "permissionId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RolePermission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "ipAddress" TEXT,
    "userAgent" VARCHAR(500),
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "action" VARCHAR(100) NOT NULL,
    "resource" VARCHAR(100) NOT NULL,
    "resourceId" TEXT,
    "details" JSONB,
    "ipAddress" TEXT,
    "userAgent" VARCHAR(500),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserBranchAccess" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserBranchAccess_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PasswordResetToken" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "used" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PasswordResetToken_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "idx_user_email" ON "User"("email");

-- CreateIndex
CREATE INDEX "idx_user_role" ON "User"("roleId");

-- CreateIndex
CREATE INDEX "idx_user_branch" ON "User"("branchId");

-- CreateIndex
CREATE INDEX "idx_user_status" ON "User"("status");

-- CreateIndex
CREATE INDEX "idx_user_email_verified" ON "User"("emailVerified");

-- CreateIndex
CREATE UNIQUE INDEX "Role_name_key" ON "Role"("name");

-- CreateIndex
CREATE INDEX "idx_role_name" ON "Role"("name");

-- CreateIndex
CREATE INDEX "idx_role_is_system" ON "Role"("isSystem");

-- CreateIndex
CREATE INDEX "idx_permission_resource" ON "Permission"("resource");

-- CreateIndex
CREATE INDEX "idx_permission_action" ON "Permission"("action");

-- CreateIndex
CREATE UNIQUE INDEX "unique_permission_resource_action" ON "Permission"("resource", "action");

-- CreateIndex
CREATE INDEX "idx_role_permission_role" ON "RolePermission"("roleId");

-- CreateIndex
CREATE INDEX "idx_role_permission_permission" ON "RolePermission"("permissionId");

-- CreateIndex
CREATE UNIQUE INDEX "unique_role_permission" ON "RolePermission"("roleId", "permissionId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_token_key" ON "Session"("token");

-- CreateIndex
CREATE INDEX "idx_session_user" ON "Session"("userId");

-- CreateIndex
CREATE INDEX "idx_session_token" ON "Session"("token");

-- CreateIndex
CREATE INDEX "idx_session_expires" ON "Session"("expiresAt");

-- CreateIndex
CREATE INDEX "idx_audit_log_user" ON "AuditLog"("userId");

-- CreateIndex
CREATE INDEX "idx_audit_log_resource" ON "AuditLog"("resource");

-- CreateIndex
CREATE INDEX "idx_audit_log_resource_id" ON "AuditLog"("resourceId");

-- CreateIndex
CREATE INDEX "idx_audit_log_created" ON "AuditLog"("createdAt");

-- CreateIndex
CREATE INDEX "idx_audit_log_action" ON "AuditLog"("action");

-- CreateIndex
CREATE INDEX "idx_user_branch_access_user" ON "UserBranchAccess"("userId");

-- CreateIndex
CREATE INDEX "idx_user_branch_access_branch" ON "UserBranchAccess"("branchId");

-- CreateIndex
CREATE UNIQUE INDEX "unique_user_branch_access" ON "UserBranchAccess"("userId", "branchId");

-- CreateIndex
CREATE UNIQUE INDEX "PasswordResetToken_token_key" ON "PasswordResetToken"("token");

-- CreateIndex
CREATE INDEX "idx_password_reset_user" ON "PasswordResetToken"("userId");

-- CreateIndex
CREATE INDEX "idx_password_reset_token" ON "PasswordResetToken"("token");

-- CreateIndex
CREATE INDEX "idx_password_reset_expires" ON "PasswordResetToken"("expiresAt");

-- CreateIndex
CREATE INDEX "AccountsPayable_branchId_status_idx" ON "AccountsPayable"("branchId", "status");

-- CreateIndex
CREATE INDEX "AccountsPayable_supplierId_status_idx" ON "AccountsPayable"("supplierId", "status");

-- CreateIndex
CREATE INDEX "AccountsPayable_status_dueDate_idx" ON "AccountsPayable"("status", "dueDate");

-- CreateIndex
CREATE INDEX "AccountsReceivable_branchId_status_idx" ON "AccountsReceivable"("branchId", "status");

-- CreateIndex
CREATE INDEX "AccountsReceivable_status_dueDate_idx" ON "AccountsReceivable"("status", "dueDate");

-- CreateIndex
CREATE INDEX "AccountsReceivable_customerName_idx" ON "AccountsReceivable"("customerName");

-- CreateIndex
CREATE INDEX "Branch_createdAt_idx" ON "Branch"("createdAt");

-- CreateIndex
CREATE INDEX "Expense_branchId_category_idx" ON "Expense"("branchId", "category");

-- CreateIndex
CREATE INDEX "Expense_branchId_expenseDate_idx" ON "Expense"("branchId", "expenseDate");

-- CreateIndex
CREATE INDEX "Expense_category_expenseDate_idx" ON "Expense"("category", "expenseDate");

-- CreateIndex
CREATE INDEX "InventoryBatch_productId_status_idx" ON "InventoryBatch"("productId", "status");

-- CreateIndex
CREATE INDEX "InventoryBatch_warehouseId_status_idx" ON "InventoryBatch"("warehouseId", "status");

-- CreateIndex
CREATE INDEX "InventoryBatch_expiryDate_status_idx" ON "InventoryBatch"("expiryDate", "status");

-- CreateIndex
CREATE INDEX "POSSale_branchId_createdAt_idx" ON "POSSale"("branchId", "createdAt");

-- CreateIndex
CREATE INDEX "POSSale_branchId_paymentMethod_idx" ON "POSSale"("branchId", "paymentMethod");

-- CreateIndex
CREATE INDEX "Product_category_status_idx" ON "Product"("category", "status");

-- CreateIndex
CREATE INDEX "Product_createdAt_idx" ON "Product"("createdAt");

-- CreateIndex
CREATE INDEX "Warehouse_branchId_name_idx" ON "Warehouse"("branchId", "name");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RolePermission" ADD CONSTRAINT "RolePermission_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RolePermission" ADD CONSTRAINT "RolePermission_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "Permission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserBranchAccess" ADD CONSTRAINT "UserBranchAccess_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserBranchAccess" ADD CONSTRAINT "UserBranchAccess_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PasswordResetToken" ADD CONSTRAINT "PasswordResetToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
