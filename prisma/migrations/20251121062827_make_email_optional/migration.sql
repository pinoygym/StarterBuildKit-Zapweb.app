-- AlterTable
ALTER TABLE "Customer" ALTER COLUMN "email" DROP NOT NULL;

-- AlterTable
ALTER TABLE "SalesOrder" ALTER COLUMN "customerEmail" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Supplier" ALTER COLUMN "email" DROP NOT NULL;
