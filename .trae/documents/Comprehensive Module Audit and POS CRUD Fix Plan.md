## Scope Overview
- Audit and verify all backend modules and UI flows: Auth, Users, Roles/Permissions, Branches/Warehouses, Products/UOM, Inventory (batches/movements/transfers), Sales Orders, Purchase Orders, Receiving Vouchers, POS Sales, AR/AP, Suppliers/Customers, Dashboard KPIs, Alerts, Uploads.
- Confirm CRUD correctness, Prisma relation consistency, response shape stability, and validations.

## Current Endpoints (Discovered)
- API routes present under `app/api/**` include: auth (login/me/register/verify/logout/change-password), users, roles, permissions, branches, warehouses, suppliers, customers, products, POS (products/sales/pending-orders/today-summary), inventory (list/add/deduct/transfer/stock-levels/movements/adjust/[id]), sales-orders (list/pending/[id]/cancel), purchase-orders (list/[id]/cancel/[id]/receive/[id]/receiving-vouchers), receiving-vouchers (list/[id]), reports (KPIs, top-products, warehouse-utilization, branch-comparison, best-sellers, inventory-value, balance-sheet, profit-loss, cash-flow, receiving-variance), AR/AP (list, [id], payment, aging-report), alerts, upload, dev seed.

## Issues Typically Found
- Prisma relation name mismatches (lowercase vs capitalized relation fields) causing 500s.
- Response shapes not matching client expectations (e.g., mapping `POSSaleItem` to `items`, `Product` to `product`).
- Missing required timestamps/IDs (`updatedAt`, nested creates without `id`).
- Validation gaps leading to 400/500s; inconsistent error messages.

## Plan to Check and Fix All Modules
### 1. Auth & Users
- Verify login/me/register/verify/logout/change-password endpoints.
- Ensure JWT cookie set and read, rate limiting in place, `User.status` string handling.
- Tests: invalid/valid login, me after cookie, change-password.

### 2. Roles & Permissions
- Verify roles list, permission mapping to `resource:action` strings.
- Confirm `RolePermission` include/shape.
- Tests: roles/permissions listing and mapping.

### 3. Branches & Warehouses
- Ensure includes use `Branch`, `InventoryBatch` and client shape.
- Tests: list/detail, utilization metrics.

### 4. Products & UOM
- Confirm CRUD (create/update/delete/status) and nested `ProductUOM` create IDs.
- Tests: create product, invalid payload 400, get list/filter by category, get by id/404, update UOM.

### 5. Inventory (Batches/Movements/Transfers)
- Check includes (`Product`, `Warehouse`), mapping back to `product`/`warehouse` for client.
- Validate add/deduct/transfer/adjust endpoints update stock correctly.
- Tests: list, stock-levels, add/deduct flow, transfer.

### 6. Sales Orders
- Ensure includes use `SalesOrderItem` with `Product`, `Warehouse`, `Branch`; cancel/ pending working.
- Tests: list/pending, by id, cancel.

### 7. Purchase Orders & Receiving Vouchers
- Verify PO list/by id/cancel/receive links; RV includes `ReceivingVoucherItem` with `Product`.
- Tests: list/by id, receive creates RV; RV by id.

### 8. POS Sales (Critical)
- Confirm `POST /api/pos/sales` validates items, computes totals/COGS, persists `POSSale` and `POSSaleItem` and deducts inventory.
- Ensure product grid source `GET /api/pos/products` uses `InventoryBatch` and alternate UOMs.
- Tests: cash sale success, list sales, today-summary.

### 9. AR/AP
- Includes and mapping (`Branch`, `Supplier`, payments) and aging-report endpoints.
- Tests: list/by id, payment creation.

### 10. Dashboard & Reports
- Validate KPI endpoints and report endpoints against corrected relations.
- Tests: KPIs, warehouse-utilization, branch-comparison.

### 11. Alerts & Uploads
- Smoke test alerts counts and upload flow.

### 12. Dev Seed
- Expand seed to ensure demo coverage: suppliers, products, warehouses, batches, roles/permissions; ensure unique constraints and required fields adhered to.

## Implementation Steps (After Approval)
- Sweep repositories/services for any remaining lowercase includes; standardize to schema relation names and map responses to client shape.
- Fix any nested creates requiring explicit IDs (`ProductUOM`, `RolePermission`) and timestamps.
- Add/extend integration tests (Vitest) for all critical endpoints above; use dynamic `BASE_URL`.
- Run server on a stable port (3004) and run the integration suite; fix failing cases iteratively.
- For POS save issue: trace `POST /api/pos/sales` end-to-end, ensure inventory deduction and validations align with client payload; add a test to cover a cash sale and confirm persistence.

## Deliverables
- Updated code for repositories/services with consistent Prisma relations and response shapes.
- Rich dev seed endpoint ensuring coverage for POS and core flows.
- Integration test suite passing locally.
- Short report summarizing fixes and coverage.

## Validation
- Run integration tests and manual smoke checks via browser on `http://localhost:3004`.
- Confirm no 500s across key CRUD endpoints.

Please confirm this plan. Upon approval, I will implement the changes, expand tests, and verify POS save works 100% along with other CRUD flows.