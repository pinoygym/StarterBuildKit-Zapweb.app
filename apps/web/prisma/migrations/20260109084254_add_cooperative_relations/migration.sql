/*
  Warnings:

  - You are about to drop the column `recordedById` on the `MemberContribution` table. All the data in the column will be lost.
  - You are about to drop the column `isSystemDefined` on the `MembershipType` table. All the data in the column will be lost.
  - You are about to drop the column `monthlyDues` on the `MembershipType` table. All the data in the column will be lost.
  - You are about to drop the column `requiredShareCapital` on the `MembershipType` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "MemberContribution" DROP CONSTRAINT "MemberContribution_recordedById_fkey";

-- DropIndex
DROP INDEX "MemberContribution_memberId_contributionDate_idx";

-- DropIndex
DROP INDEX "MemberContribution_recordedById_idx";

-- AlterTable
ALTER TABLE "MemberContribution" DROP COLUMN "recordedById",
ADD COLUMN     "createdById" TEXT;

-- AlterTable
ALTER TABLE "MembershipType" DROP COLUMN "isSystemDefined",
DROP COLUMN "monthlyDues",
DROP COLUMN "requiredShareCapital",
ADD COLUMN     "minimumShareCapital" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "monthlyFee" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "registrationFee" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "requirements" TEXT;

-- CreateTable
CREATE TABLE "Tenant" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "shortName" TEXT NOT NULL,
    "description" TEXT,
    "version" TEXT NOT NULL DEFAULT '1.0.0',
    "enabledFeatures" JSONB NOT NULL DEFAULT '[]',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Tenant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CooperativeInitiative" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "priority" TEXT NOT NULL DEFAULT 'medium',
    "targetDate" TIMESTAMP(3),
    "budget" DOUBLE PRECISION,
    "progress" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "leadMemberId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CooperativeInitiative_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CooperativeProposal" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "proposedById" TEXT NOT NULL,
    "votingStartDate" TIMESTAMP(3),
    "votingEndDate" TIMESTAMP(3),
    "requiredVotes" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CooperativeProposal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProposalVote" (
    "id" TEXT NOT NULL,
    "proposalId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "voteType" TEXT NOT NULL,
    "comment" TEXT,
    "votedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProposalVote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CooperativeTask" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'open',
    "priority" TEXT NOT NULL DEFAULT 'medium',
    "xpReward" INTEGER NOT NULL DEFAULT 10,
    "badgeReward" TEXT,
    "dueDate" TIMESTAMP(3),
    "initiativeId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CooperativeTask_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaskAssignment" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'assigned',
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "xpEarned" INTEGER,

    CONSTRAINT "TaskAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MemberEngagementScore" (
    "id" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "totalXp" INTEGER NOT NULL DEFAULT 0,
    "tasksCompleted" INTEGER NOT NULL DEFAULT 0,
    "proposalsVoted" INTEGER NOT NULL DEFAULT 0,
    "badgesEarned" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "rank" INTEGER,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MemberEngagementScore_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MemberWallet" (
    "id" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "walletBalance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "shareCapital" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "savingsBalance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MemberWallet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WalletTransaction" (
    "id" TEXT NOT NULL,
    "walletId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "description" TEXT,
    "referenceNumber" TEXT,
    "status" TEXT NOT NULL DEFAULT 'completed',
    "balanceBefore" DOUBLE PRECISION NOT NULL,
    "balanceAfter" DOUBLE PRECISION NOT NULL,
    "transactionDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WalletTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CooperativeFarm" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "sizeHectares" DOUBLE PRECISION NOT NULL,
    "cropType" TEXT NOT NULL,
    "lastHarvest" TIMESTAMP(3),
    "nextHarvestEst" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'active',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CooperativeFarm_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IDCardTemplate" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "orientation" TEXT NOT NULL DEFAULT 'landscape',
    "primaryColor" TEXT NOT NULL DEFAULT '#004d20',
    "secondaryColor" TEXT NOT NULL DEFAULT '#004d20',
    "textColor" TEXT NOT NULL DEFAULT '#d4af37',
    "accentColor" TEXT NOT NULL DEFAULT '#d4af37',
    "pattern" TEXT NOT NULL DEFAULT 'logo',
    "patternSize" INTEGER NOT NULL DEFAULT 400,
    "patternOpacity" INTEGER NOT NULL DEFAULT 10,
    "borderRadius" INTEGER NOT NULL DEFAULT 8,
    "layout" TEXT NOT NULL DEFAULT 'standard',
    "fontFamily" TEXT NOT NULL DEFAULT 'Inter',
    "backPrimaryColor" TEXT,
    "backTextColor" TEXT,
    "showProfileImage" BOOLEAN NOT NULL DEFAULT true,
    "showBackQr" BOOLEAN NOT NULL DEFAULT true,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IDCardTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Tenant_slug_key" ON "Tenant"("slug");

-- CreateIndex
CREATE INDEX "Tenant_slug_idx" ON "Tenant"("slug");

-- CreateIndex
CREATE INDEX "CooperativeInitiative_status_idx" ON "CooperativeInitiative"("status");

-- CreateIndex
CREATE INDEX "CooperativeInitiative_category_idx" ON "CooperativeInitiative"("category");

-- CreateIndex
CREATE INDEX "CooperativeInitiative_leadMemberId_idx" ON "CooperativeInitiative"("leadMemberId");

-- CreateIndex
CREATE INDEX "CooperativeProposal_status_idx" ON "CooperativeProposal"("status");

-- CreateIndex
CREATE INDEX "CooperativeProposal_proposedById_idx" ON "CooperativeProposal"("proposedById");

-- CreateIndex
CREATE INDEX "CooperativeProposal_votingEndDate_idx" ON "CooperativeProposal"("votingEndDate");

-- CreateIndex
CREATE INDEX "ProposalVote_proposalId_idx" ON "ProposalVote"("proposalId");

-- CreateIndex
CREATE INDEX "ProposalVote_memberId_idx" ON "ProposalVote"("memberId");

-- CreateIndex
CREATE UNIQUE INDEX "ProposalVote_proposalId_memberId_key" ON "ProposalVote"("proposalId", "memberId");

-- CreateIndex
CREATE INDEX "CooperativeTask_status_idx" ON "CooperativeTask"("status");

-- CreateIndex
CREATE INDEX "CooperativeTask_initiativeId_idx" ON "CooperativeTask"("initiativeId");

-- CreateIndex
CREATE INDEX "CooperativeTask_dueDate_idx" ON "CooperativeTask"("dueDate");

-- CreateIndex
CREATE INDEX "TaskAssignment_taskId_idx" ON "TaskAssignment"("taskId");

-- CreateIndex
CREATE INDEX "TaskAssignment_memberId_idx" ON "TaskAssignment"("memberId");

-- CreateIndex
CREATE INDEX "TaskAssignment_status_idx" ON "TaskAssignment"("status");

-- CreateIndex
CREATE UNIQUE INDEX "TaskAssignment_taskId_memberId_key" ON "TaskAssignment"("taskId", "memberId");

-- CreateIndex
CREATE UNIQUE INDEX "MemberEngagementScore_memberId_key" ON "MemberEngagementScore"("memberId");

-- CreateIndex
CREATE INDEX "MemberEngagementScore_totalXp_idx" ON "MemberEngagementScore"("totalXp");

-- CreateIndex
CREATE INDEX "MemberEngagementScore_rank_idx" ON "MemberEngagementScore"("rank");

-- CreateIndex
CREATE UNIQUE INDEX "MemberWallet_memberId_key" ON "MemberWallet"("memberId");

-- CreateIndex
CREATE INDEX "MemberWallet_memberId_idx" ON "MemberWallet"("memberId");

-- CreateIndex
CREATE INDEX "MemberWallet_status_idx" ON "MemberWallet"("status");

-- CreateIndex
CREATE INDEX "WalletTransaction_walletId_idx" ON "WalletTransaction"("walletId");

-- CreateIndex
CREATE INDEX "WalletTransaction_type_idx" ON "WalletTransaction"("type");

-- CreateIndex
CREATE INDEX "WalletTransaction_transactionDate_idx" ON "WalletTransaction"("transactionDate");

-- CreateIndex
CREATE INDEX "CooperativeFarm_memberId_idx" ON "CooperativeFarm"("memberId");

-- CreateIndex
CREATE INDEX "CooperativeFarm_status_idx" ON "CooperativeFarm"("status");

-- CreateIndex
CREATE INDEX "CooperativeFarm_cropType_idx" ON "CooperativeFarm"("cropType");

-- CreateIndex
CREATE INDEX "IDCardTemplate_isDefault_idx" ON "IDCardTemplate"("isDefault");

-- CreateIndex
CREATE INDEX "JobOrder_status_idx" ON "JobOrder"("status");

-- CreateIndex
CREATE INDEX "MemberContribution_createdById_idx" ON "MemberContribution"("createdById");

-- CreateIndex
CREATE INDEX "MembershipType_code_idx" ON "MembershipType"("code");

-- AddForeignKey
ALTER TABLE "MemberContribution" ADD CONSTRAINT "MemberContribution_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CooperativeInitiative" ADD CONSTRAINT "CooperativeInitiative_leadMemberId_fkey" FOREIGN KEY ("leadMemberId") REFERENCES "CooperativeMember"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CooperativeProposal" ADD CONSTRAINT "CooperativeProposal_proposedById_fkey" FOREIGN KEY ("proposedById") REFERENCES "CooperativeMember"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProposalVote" ADD CONSTRAINT "ProposalVote_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "CooperativeMember"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProposalVote" ADD CONSTRAINT "ProposalVote_proposalId_fkey" FOREIGN KEY ("proposalId") REFERENCES "CooperativeProposal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CooperativeTask" ADD CONSTRAINT "CooperativeTask_initiativeId_fkey" FOREIGN KEY ("initiativeId") REFERENCES "CooperativeInitiative"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskAssignment" ADD CONSTRAINT "TaskAssignment_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "CooperativeMember"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskAssignment" ADD CONSTRAINT "TaskAssignment_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "CooperativeTask"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MemberEngagementScore" ADD CONSTRAINT "MemberEngagementScore_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "CooperativeMember"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MemberWallet" ADD CONSTRAINT "MemberWallet_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "CooperativeMember"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WalletTransaction" ADD CONSTRAINT "WalletTransaction_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "MemberWallet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CooperativeFarm" ADD CONSTRAINT "CooperativeFarm_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "CooperativeMember"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
