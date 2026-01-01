/*
  Warnings:

  - Added the required column `originalPrice` to the `POSSaleItem` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "CompanySettings" ADD COLUMN     "discountApprovalThreshold" DOUBLE PRECISION NOT NULL DEFAULT 20.0,
ADD COLUMN     "maxDiscountPercentage" DOUBLE PRECISION NOT NULL DEFAULT 50.0,
ADD COLUMN     "requireDiscountApproval" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "taxInclusive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "vatEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "vatRate" DOUBLE PRECISION NOT NULL DEFAULT 12.0,
ADD COLUMN     "vatRegistrationNumber" TEXT;

-- AlterTable
ALTER TABLE "POSSale" ADD COLUMN     "discount" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "discountReason" TEXT,
ADD COLUMN     "discountType" TEXT,
ADD COLUMN     "discountValue" DOUBLE PRECISION,
ALTER COLUMN "tax" SET DEFAULT 0;

-- AlterTable
ALTER TABLE "POSSaleItem" ADD COLUMN     "discount" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "discountType" TEXT,
ADD COLUMN     "discountValue" DOUBLE PRECISION,
ADD COLUMN     "originalPrice" DOUBLE PRECISION;

-- Data migration: Set originalPrice to unitPrice for existing records
UPDATE "POSSaleItem" SET "originalPrice" = "unitPrice" WHERE "originalPrice" IS NULL;
