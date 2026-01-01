
-- Delete duplicate inventory adjustment items, keeping one (arbitrarily the one with the 'greater' id string)
DELETE FROM "InventoryAdjustmentItem" a
USING "InventoryAdjustmentItem" b
WHERE a.id < b.id
  AND a."adjustmentId" = b."adjustmentId"
  AND a."productId" = b."productId";
