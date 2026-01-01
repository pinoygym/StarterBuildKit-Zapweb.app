## Goals
- Ensure POS save works reliably for cash and credit sales and inventory updates are correct.
- Verify and fix CRUD across Auth, Products/UOM, Inventory, Warehouses, Sales Orders, Purchase Orders, Receiving Vouchers, POS Sales, AR/AP, Customers/Suppliers, Dashboard endpoints.

## Investigation & Fixes
- Review POS validation and payload mapping:
  - Confirm `amountReceived >= totalAmount` for `cash` and `customerId/customerName` for `credit` in `lib/validations/pos.validation.ts`.
  - Verify `POSPayment` UI composes payloads that match the schema, including totals and item fields.
- Ensure inventory deduction and COGS:
  - Use `convertToBaseUOM` to convert sale quantities for COGS and stock deduction.
  - Deduct stock via FIFO batches and record `OUT` movements with references.
  - Confirm weighted average cost computation and no divide-by-zero when no batches.
- Verify receipt uniqueness and generation:
  - Generate `RCP-YYYYMMDD-XXXX` receipts and check for duplicates before saving.
- Map repository includes to client shape:
  - Use `POSSaleItem` with nested `Product`, include `Branch`, and return `items` with `product`.

## Seed & Test Enhancements
- Enrich dev seed data to support end-to-end flows:
  - Branches, warehouses, products with batches; suppliers and permissions.
- Add integration tests (Vitest) to lock behavior:
  - Auth: invalid/valid login and `me` with cookie
  - Products/UOM: create, list, filter, get by id, update UOM
  - Inventory: list and stock-levels
  - Warehouses: list
  - POS: cash sale success; today-summary and listing
  - AR/AP: basic list and payment flow

## Execution Steps
1. Sweep remaining repositories/services for Prisma relation name mismatches and response shape mapping (standardize includes like `InventoryBatch`, `POSSaleItem`, `RolePermission`).
2. Fix any nested create paths needing explicit IDs/timestamps (e.g., `ProductUOM`, `RolePermission`).
3. Expand seed data and ensure it adheres to unique constraints and required fields (`updatedAt`, IDs).
4. Implement/extend integration tests; set `BASE_URL` to `http://localhost:3004`.
5. Run dev server on `3004` and execute the integration suite; iterate on failures until green.
6. Validate POS save manually in UI and via tests; verify inventory movements and resulting stock.

## Deliverables
- Updated code for repositories/services fixing relation names and mapping.
- Seed endpoint and test suite covering core flows.
- Verified POS save with receipt generation and stock deduction.
- Short summary of fixes applied and tests passing.

Please confirm; once approved, I will implement changes, run tests, and verify POS save and CRUD flows end-to-end.