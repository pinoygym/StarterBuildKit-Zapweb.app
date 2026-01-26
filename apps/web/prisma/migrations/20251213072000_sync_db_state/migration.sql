-- CreateEnum
CREATE TYPE "DeviceType" AS ENUM ('DESKTOP', 'LAPTOP', 'PRINTER', 'MONITOR', 'PROJECTOR', 'CHARGER', 'UPS', 'OTHER');

-- CreateEnum
CREATE TYPE "JobPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "JobStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- CreateTable
CREATE TABLE "JobComment" (
    "id" TEXT NOT NULL,
    "jobOrderId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "commentText" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "JobComment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JobImage" (
    "id" TEXT NOT NULL,
    "jobOrderId" TEXT NOT NULL,
    "uploadedById" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "thumbnailUrl" TEXT,
    "caption" TEXT,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "JobImage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JobOrder" (
    "id" TEXT NOT NULL,
    "refNo" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "customerId" TEXT,
    "createdById" TEXT NOT NULL,
    "assignedToId" TEXT,
    "priority" "JobPriority" NOT NULL DEFAULT 'MEDIUM',
    "location" JSONB,
    "scheduledAt" TIMESTAMP(3),
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "status" "JobStatus" NOT NULL DEFAULT 'PENDING',
    "estimatedCost" DOUBLE PRECISION,
    "actualCost" DOUBLE PRECISION,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deviceType" "DeviceType",
    "serialNumber" TEXT,
    "deviceBrand" TEXT,
    "deviceModel" TEXT,
    "dateReceived" TIMESTAMP(3),
    "dateReleased" TIMESTAMP(3),
    "contactPerson" TEXT,
    "branch" TEXT,
    "problemReported" TEXT,
    "commonCauses" JSONB,
    "issueResolved" BOOLEAN NOT NULL DEFAULT false,
    "recommendation" TEXT,
    "technicianName" TEXT,
    "technicianSignature" TEXT,
    "customerSignature" TEXT,

    CONSTRAINT "JobOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JobPerformed" (
    "id" TEXT NOT NULL,
    "jobOrderId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "taskName" TEXT NOT NULL,
    "status" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "JobPerformed_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PartsReplacement" (
    "id" TEXT NOT NULL,
    "jobOrderId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "serialNumber" TEXT,
    "quantity" DOUBLE PRECISION NOT NULL,
    "unitPrice" DOUBLE PRECISION NOT NULL,
    "lineTotal" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PartsReplacement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "JobComment_createdAt_idx" ON "JobComment"("createdAt");
CREATE INDEX "JobComment_jobOrderId_idx" ON "JobComment"("jobOrderId");
CREATE INDEX "JobComment_userId_idx" ON "JobComment"("userId");

-- CreateIndex
CREATE INDEX "JobImage_jobOrderId_idx" ON "JobImage"("jobOrderId");
CREATE INDEX "JobImage_uploadedAt_idx" ON "JobImage"("uploadedAt");
CREATE INDEX "JobImage_uploadedById_idx" ON "JobImage"("uploadedById");

-- CreateIndex
CREATE UNIQUE INDEX "JobOrder_refNo_key" ON "JobOrder"("refNo");
CREATE INDEX "JobOrder_assignedToId_idx" ON "JobOrder"("assignedToId");
CREATE INDEX "JobOrder_assignedToId_status_idx" ON "JobOrder"("assignedToId", "status");
CREATE INDEX "JobOrder_createdAt_idx" ON "JobOrder"("createdAt");
CREATE INDEX "JobOrder_customerId_idx" ON "JobOrder"("customerId");
CREATE INDEX "JobOrder_dateReceived_idx" ON "JobOrder"("dateReceived");
CREATE INDEX "JobOrder_deviceType_idx" ON "JobOrder"("deviceType");
CREATE INDEX "JobOrder_scheduledAt_idx" ON "JobOrder"("scheduledAt");
CREATE INDEX "JobOrder_status_createdAt_idx" ON "JobOrder"("status", "createdAt");
CREATE INDEX "JobOrder_status_idx" ON "JobOrder"("status");

-- CreateIndex
CREATE INDEX "JobPerformed_category_idx" ON "JobPerformed"("category");
CREATE INDEX "JobPerformed_jobOrderId_idx" ON "JobPerformed"("jobOrderId");

-- CreateIndex
CREATE INDEX "PartsReplacement_jobOrderId_idx" ON "PartsReplacement"("jobOrderId");

-- AddForeignKey
ALTER TABLE "JobComment" ADD CONSTRAINT "JobComment_jobOrderId_fkey" FOREIGN KEY ("jobOrderId") REFERENCES "JobOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "JobComment" ADD CONSTRAINT "JobComment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobImage" ADD CONSTRAINT "JobImage_jobOrderId_fkey" FOREIGN KEY ("jobOrderId") REFERENCES "JobOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "JobImage" ADD CONSTRAINT "JobImage_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobOrder" ADD CONSTRAINT "JobOrder_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "JobOrder" ADD CONSTRAINT "JobOrder_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "JobOrder" ADD CONSTRAINT "JobOrder_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobPerformed" ADD CONSTRAINT "JobPerformed_jobOrderId_fkey" FOREIGN KEY ("jobOrderId") REFERENCES "JobOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PartsReplacement" ADD CONSTRAINT "PartsReplacement_jobOrderId_fkey" FOREIGN KEY ("jobOrderId") REFERENCES "JobOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;
