-- DropForeignKey
ALTER TABLE "InventoryBatch" DROP CONSTRAINT "InventoryBatch_productId_fkey";
ALTER TABLE "InventoryBatch" DROP CONSTRAINT "InventoryBatch_warehouseId_fkey";

-- DropForeignKey
ALTER TABLE "StockMovement" DROP CONSTRAINT "StockMovement_batchId_fkey";

-- DropTable
DROP TABLE "InventoryBatch";

-- AlterTable
ALTER TABLE "User" ADD COLUMN "isSuperMegaAdmin" BOOLEAN NOT NULL DEFAULT false;

-- DropIndex
DROP INDEX "StockMovement_batchId_idx";

-- AlterTable
ALTER TABLE "StockMovement" DROP COLUMN "batchId",
ADD COLUMN     "productId" TEXT NOT NULL,
ADD COLUMN     "warehouseId" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "StockMovement_productId_idx" ON "StockMovement"("productId");

-- CreateIndex
CREATE INDEX "StockMovement_warehouseId_idx" ON "StockMovement"("warehouseId");

-- AddForeignKey
ALTER TABLE "StockMovement" ADD CONSTRAINT "StockMovement_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockMovement" ADD CONSTRAINT "StockMovement_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "Warehouse"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
