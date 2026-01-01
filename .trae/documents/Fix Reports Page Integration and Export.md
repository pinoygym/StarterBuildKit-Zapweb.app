## Issues Found
- Missing imports in `app/(dashboard)/reports/page.tsx` for `ExportDropdown`, `ReportTemplateManager`, and export utilities
- Undefined `promotionLoading` because `usePromotionUsage` hook return values aren’t wired
- `handleExport` signature and implementation don’t match current `ExportDropdown` usage
- Inconsistent export UI (a plain `Button` used for Stock Levels vs `ExportDropdown` elsewhere)
- Unused imports (`POSReceiptTemplate`, `DailySalesSummaryReport`) increase noise

## Changes to Implement
### 1) Update Imports in `app/(dashboard)/reports/page.tsx`
- Add: `import { ExportDropdown } from '@/components/ui/export-dropdown'`
- Add: `import { ReportTemplateManager } from '@/components/reports/report-template-manager'`
- Add: `import { exportData, prepareSalesDataForExport, prepareInventoryDataForExport } from '@/lib/export-utils'`
- Remove unused imports: `POSReceiptTemplate`, `DailySalesSummaryReport` (unless needed)

### 2) Wire Up Promotion Analytics Hook
- Add: `const { data: promotionData, loading: promotionLoading } = usePromotionUsage({ branchId: selectedBranch?.id, fromDate: dateRange.fromDate, toDate: dateRange.toDate });`

### 3) Implement Robust `handleExport`
- Update signature: `handleExport(reportName: string, format: ExportFormat, rawData: any[], typeKey: string)`
- Build `TableData` per `typeKey`:
  - `sales`: use `prepareSalesDataForExport(rawData)`
  - `stock-levels`: use `prepareInventoryDataForExport(rawData)`
  - `best-sellers`: headers: `['Rank','Product','Category','Qty Sold','Revenue','Profit']` and map rows accordingly
  - `inventory-value`: headers: `['Product','Quantity','Avg Cost','Total Value']` and map rows accordingly
- Call `exportData(tableData, { format, filename: <derived from reportName>, title: reportName, dateRange, filters: { branch: selectedBranch?.name } })`

### 4) Standardize Export UI
- Replace Stock Levels `Button` with `ExportDropdown` and wire `onExport={(format) => handleExport('Stock Level', format, stockLevels, 'stock-levels')}`
- Ensure existing `ExportDropdown`s for Best Sellers, Sales Summary, Inventory Valuation pass correct `rawData` and `typeKey`

### 5) Integrate Analytics Content
- Replace placeholder in Analytics tab with a minimal table or, if preferred, integrate `DiscountAndPromotionAnalyticsReport` component using `promotionData`
- Provide `ExportDropdown` to export analytics summary as CSV/Excel/PDF (simple headers for `promotionData`)

### 6) Cleanup & Consistency
- Remove unused imports
- Keep currency formatting via existing `formatCurrency`
- Ensure Tabs render without undefined variables

## Verification
- Run dev server and navigate to `/dashboard/reports`
- Confirm no runtime errors and all tabs render
- Trigger export for Stock Levels, Inventory Valuation, Best Sellers, Sales Summary; verify files download and content is correct
- Check analytics tab loading state vs data display
- Validate styling for `Badge` variants used

Confirm this plan and I’ll implement the changes and test end-to-end.