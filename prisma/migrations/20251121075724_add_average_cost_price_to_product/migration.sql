-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "averageCostPrice" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "PurchaseOrderItem" ALTER COLUMN "uom" DROP DEFAULT;
