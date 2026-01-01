-- AlterTable
ALTER TABLE "POSSale" ADD COLUMN     "salesAgentId" TEXT;

-- CreateTable
CREATE TABLE "SalesAgent" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "contactPerson" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SalesAgent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SalesAgent_name_key" ON "SalesAgent"("name");

-- CreateIndex
CREATE UNIQUE INDEX "SalesAgent_code_key" ON "SalesAgent"("code");

-- CreateIndex
CREATE INDEX "SalesAgent_status_idx" ON "SalesAgent"("status");

-- CreateIndex
CREATE INDEX "SalesAgent_name_idx" ON "SalesAgent"("name");

-- CreateIndex
CREATE INDEX "POSSale_salesAgentId_idx" ON "POSSale"("salesAgentId");

-- AddForeignKey
ALTER TABLE "POSSale" ADD CONSTRAINT "POSSale_salesAgentId_fkey" FOREIGN KEY ("salesAgentId") REFERENCES "SalesAgent"("id") ON DELETE SET NULL ON UPDATE CASCADE;
