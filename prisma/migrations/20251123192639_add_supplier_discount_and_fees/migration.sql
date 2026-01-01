-- AlterTable
ALTER TABLE "ReceivingVoucher" ADD COLUMN     "additionalFees" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "additionalFeesDescription" TEXT,
ADD COLUMN     "netAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "recomputeAverageCost" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "supplierDiscount" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "supplierDiscountType" TEXT;
