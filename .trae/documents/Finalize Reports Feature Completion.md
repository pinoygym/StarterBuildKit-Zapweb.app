## Current Coverage

* Inventory: `Stock Level Report` and `Inventory Valuation Report` are implemented (`app/(dashboard)/reports/page.tsx:184–229`, `232–280`).

* Sales: `Top 10 Best Selling Products` and `Sales Summary Report` are implemented (`page.tsx:286–330`, `333–377`).

* Financial: `Profit & Loss Statement` is implemented (`page.tsx:382–439`).

* Analytics: `Discount & Promotion Analytics` is implemented (`page.tsx:442–493`).

* Templates/Batch: `ReportTemplateManager` and `BatchPrintManager` are present (`page.tsx:496–503`).

## Missing Reports (available but not shown)

* Inventory: `Inventory Movement` (`components/reports/inventory-movement-report.tsx`), `Receiving Variance` (`app/api/reports/receiving-variance/route.ts`).

* Sales: `Daily Sales Summary` (`components/reports/daily-sales-summary-report.tsx`), `Employee Performance` (`components/reports/employee-sales-performance-report.tsx` or `employee-performance-dashboard.tsx`), `Customer Purchase History` (`components/reports/customer-purchase-history-report.tsx`).

* Financial: `Balance Sheet` (`app/api/reports/balance-sheet/route.ts`), `Cash Flow` (`app/api/reports/cash-flow/route.ts`).

* POS: `POS Receipt` hook exists (`hooks/use-reports.ts:222–256`) with template components (`components/reports/pos-receipt-template.tsx`, `comprehensive-pos-receipt.tsx`) but no UI section.

## Implementation Plan

### Add Inventory Sections

* Add `Inventory Movement` card to `inventory` tab using `components/reports/inventory-movement-report.tsx`; fetch via new hook (or inline fetch) to `/api/reports/inventory-movement` if available, otherwise reuse existing movement data source.

* Add `Receiving Variance` card listing voucher discrepancies; wire to `/api/reports/receiving-variance` and include `ExportDropdown`.

### Add Sales Sections

* Add `Daily Sales Summary` card using `useDailySalesSummary` (`hooks/use-reports.ts:258–293`); render via `components/reports/daily-sales-summary-report.tsx` and add export.

* Add `Employee Performance` card using `useEmployeePerformance` (`hooks/use-reports.ts:295–330`); render via `employee-sales-performance-report.tsx` or `employee-performance-dashboard.tsx` depending on design; add export.

* Add `Customer Purchase History` card using `useCustomerPurchaseHistory` (`hooks/use-reports.ts:332–368`), with branch/date filters; add export.

### Add Financial Sections

* Add `Balance Sheet` card; fetch via `/api/reports/balance-sheet` and present assets/liabilities/equity with totals; add export.

* Add `Cash Flow` card; fetch via `/api/reports/cash-flow` and present operating/investing/financing flows; add export.

### POS Receipt Preview (Optional)

* Add a small `POS Receipt` preview/lookup by receipt number using `usePOSReceipt`; render with `pos-receipt-template.tsx` or `comprehensive-pos-receipt.tsx`; include print/export.

### Export Integration

* For each new card, integrate `ExportDropdown` with `handleExport` mappings in `page.tsx` (extend `typeKey` cases for new datasets) to support CSV/XLSX/PDF.

### Verification

* Type-check and lint; ensure no unused imports remain.

* Build to verify no webpack/module errors.

* Manually QA each tab: loading states, empty states, badge/status styling, export output correctness.

## Outcome

* All available report APIs and hooks are surfaced in the Reports UI under appropriate tabs, with consistent export and styling, matching existing patterns in `page.tsx`.

