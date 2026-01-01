-- =============================================================================
-- RESET INVENTORY FROM ADJUSTMENTS
-- =============================================================================
-- This script clears the effects of adjustments from product history/stock
-- WITHOUT deleting the adjustment records themselves.
--
-- What it does:
-- 1. Deletes StockMovement records created by adjustments (clears Transaction History)
-- 2. Resets Inventory quantities to 0 (clears current stock)
--
-- What it preserves:
-- - InventoryAdjustment records (the adjustment documents)
-- - InventoryAdjustmentItem records (the items in each adjustment)
--
-- RUN THIS WITH CAUTION - This will reset ALL inventory quantities to 0!
-- =============================================================================

-- Start a transaction so we can rollback if needed
BEGIN;

-- Step 1: Show current counts (for verification)
SELECT 'Before Reset' AS status;
SELECT COUNT(*) AS stock_movement_count FROM "StockMovement" WHERE type = 'adjustment';
SELECT COUNT(*) AS inventory_records FROM "Inventory" WHERE quantity > 0;
SELECT COUNT(*) AS adjustment_count FROM "InventoryAdjustment";
SELECT COUNT(*) AS adjustment_items_count FROM "InventoryAdjustmentItem";

-- Step 2: Delete stock movements created by adjustments
-- These are the records that appear in the Transaction History
DELETE FROM "StockMovement" 
WHERE type = 'adjustment' 
   OR "referenceType" = 'adjustment'
   OR "referenceType" = 'InventoryAdjustment';

-- Step 3: Reset all inventory quantities to 0
-- This clears the current stock so products start with zero
UPDATE "Inventory" SET quantity = 0, "updatedAt" = NOW();

-- Step 4: Show counts after reset (for verification)
SELECT 'After Reset' AS status;
SELECT COUNT(*) AS stock_movement_count FROM "StockMovement" WHERE type = 'adjustment';
SELECT COUNT(*) AS inventory_records_with_stock FROM "Inventory" WHERE quantity > 0;
SELECT COUNT(*) AS adjustment_count FROM "InventoryAdjustment";
SELECT COUNT(*) AS adjustment_items_count FROM "InventoryAdjustmentItem";

-- Commit the transaction
COMMIT;

-- =============================================================================
-- OPTIONAL: If you only want to reset specific products, use this instead:
-- =============================================================================
-- 
-- -- Delete stock movements for specific products
-- DELETE FROM "StockMovement" 
-- WHERE productId IN ('product-id-1', 'product-id-2')
--   AND (type = 'adjustment' OR "referenceType" = 'InventoryAdjustment');
--
-- -- Reset inventory for specific products
-- UPDATE "Inventory" 
-- SET quantity = 0, "updatedAt" = NOW()
-- WHERE productId IN ('product-id-1', 'product-id-2');
--
-- =============================================================================
