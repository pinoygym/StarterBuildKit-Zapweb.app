# Inventory Adjustments

The Inventory Adjustment module allows users to correct stock levels manually. This is typically used for reconciling physical counts, handling damaged goods, or correcting entry errors.

## Key Features

- **Draft Workflow**: Adjustments start as drafts and must be "Posted" to affect actual inventory.
- **Adjustment Types**:
    - **Relative**: Add or subtract a specific quantity from current stock (e.g., +10 or -5).
    - **Absolute**: Set the stock level to an exact quantity (e.g., set to 100 regardless of current stock).
- **Auto-generated Numbers**: Each adjustment gets a unique identifier like `ADJ-YYYYMMDD-XXXX`.
- **Reversals**: Posted adjustments can be reversed, which automatically creates and posts a counter-adjustment.
- **Copying**: Easily duplicate existing adjustments to create new drafts.
- **Audit Logging**: All actions (create, update, post, reverse, copy) are logged with user and timestamp details.

## API Endpoints

- `GET /api/inventory/adjustments`: List and filter adjustments.
- `POST /api/inventory/adjustments`: Create a new draft adjustment.
- `GET /api/inventory/adjustments/[id]`: Get details of a specific adjustment.
- `PATCH /api/inventory/adjustments/[id]`: Update a draft or cancel an adjustment.
- `POST /api/inventory/adjustments/[id]/post`: Apply the adjustment to inventory.
- `POST /api/inventory/adjustments/[id]/reverse`: Reverse a posted adjustment.
- `POST /api/inventory/adjustments/[id]/copy`: Create a draft copy of an adjustment.

## Technical Details

- **Service**: `InventoryAdjustmentService` in `services/inventory-adjustment.service.ts`.
- **Repository**: Uses the Prisma client directly for complex transactions.
- **Inventory Integration**: Uses `InventoryService.adjustStockBatch` to ensure consistency with stock movements and average costing.
