# InventoryPro - Complete Product Requirements Document & Implementation Plan

## Executive Overview

### Project Vision
InventoryPro is a comprehensive, production-ready inventory management and Point of Sale system specifically designed for soft drinks wholesale delivery companies in the Philippines. The system enables multi-branch operations with real-time inventory tracking, financial management, and integrated POS capabilities.

### Current Status Assessment
The project is approximately 70% complete with all core operational modules fully functional. The remaining 30% consists of critical business intelligence modules including Dashboard Analytics, Alert System, Accounts Receivable/Payable UI, Expense Management UI, and Comprehensive Reporting.

### Implementation Strategy
This document provides a complete end-to-end implementation plan to bring the system to 100% production readiness without breaking existing functionality. The approach focuses on:
- Completing remaining modules following established architectural patterns
- Enhancing existing modules with missing features
- Ensuring seamless integration across all components
- Maintaining data consistency and business rule integrity

---

## Part 1: System Architecture & Technical Foundation

### Technology Stack

| Category | Technology | Version | Purpose |
|----------|-----------|---------|---------|
| Framework | Next.js | 15 | App Router, Server Components, API Routes |
| UI Library | React | 19 | Component rendering, hooks |
| Language | TypeScript | 5.3+ | Type safety, developer experience |
| Database | Neon PostgreSQL | Latest | Serverless, auto-scaling data persistence |
| ORM | Prisma | 5.x | Type-safe database operations |
| Styling | Tailwind CSS | v4 | Utility-first styling |
| Components | shadcn/ui | Latest | Accessible, customizable UI components |
| State Management | React Query + Zustand | Latest | Server state caching, client state |
| Forms | React Hook Form + Zod | Latest | Form handling, validation |
| Charts | Recharts | Latest | Data visualization |
| Icons | Lucide React | Latest | Icon library |
| Deployment | Vercel | N/A | Hosting, CI/CD |

### Architectural Layers

```
graph TB
    subgraph "Presentation Layer"
        A[Next.js Pages - Server Components]
        B[Client Components - Interactive UI]
        C[shadcn/ui Components]
    end
    
    subgraph "API Layer"
        D[API Routes - /api/*]
        E[Server Actions]
    end
    
    subgraph "Business Logic Layer"
        F[Service Layer]
        G[Validation Layer - Zod Schemas]
    end
    
    subgraph "Data Access Layer"
        H[Repository Layer]
        I[Prisma ORM]
    end
    
    subgraph "Persistence Layer"
        J[Neon PostgreSQL Database]
    end
    
    A --> D
    B --> D
    B --> E
    D --> F
    E --> F
    F --> G
    F --> H
    H --> I
    I --> J
```

### Data Flow Pattern

All modules follow this consistent pattern:

1. User interacts with UI Component
2. Component calls API Route or Server Action
3. API Route validates input using Zod Schema
4. API Route delegates to Service Layer
5. Service Layer applies business rules and orchestrates operations
6. Service Layer calls Repository for data operations
7. Repository uses Prisma to execute database queries
8. Results flow back through the layers
9. UI updates with new data or error messages

---

## Part 2: Data Model & Database Design

### Core Entity Relationships

```
erDiagram
    Branch ||--o{ Warehouse : "owns"
    Branch ||--o{ PurchaseOrder : "processes"
    Branch ||--o{ SalesOrder : "handles"
    Branch ||--o{ POSSale : "records"
    Branch ||--o{ AccountsReceivable : "tracks"
    Branch ||--o{ AccountsPayable : "manages"
    Branch ||--o{ Expense : "incurs"
    
    Product ||--o{ ProductUOM : "has"
    Product ||--o{ InventoryBatch : "stored_as"
    Product ||--o{ PurchaseOrderItem : "ordered_in"
    Product ||--o{ SalesOrderItem : "sold_in"
    Product ||--o{ POSSaleItem : "sold_as"
    
    Warehouse ||--o{ InventoryBatch : "stores"
    Warehouse ||--o{ PurchaseOrder : "receives"
    Warehouse ||--o{ SalesOrder : "fulfills"
    
    InventoryBatch ||--o{ StockMovement : "generates"
    
    Supplier ||--o{ PurchaseOrder : "supplies"
    Supplier ||--o{ AccountsPayable : "receives_payment"
    
    PurchaseOrder ||--o{ PurchaseOrderItem : "contains"
    PurchaseOrder ||--o| AccountsPayable : "creates"
    
    SalesOrder ||--o{ SalesOrderItem : "contains"
    SalesOrder ||--o| POSSale : "converts_to"
    SalesOrder ||--o| AccountsReceivable : "creates"
    
    POSSale ||--o{ POSSaleItem : "includes"
    
    AccountsReceivable ||--o{ ARPayment : "receives"
    AccountsPayable ||--o{ APPayment : "makes"
```

### Key Database Tables

#### Branch
Represents business locations with separate transaction recording

| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| name | String | Branch name |
| code | String | Unique branch code |
| location | String | Physical address |
| manager | String | Manager name |
| phone | String | Contact number |
| status | String | active / inactive |
| createdAt | DateTime | Creation timestamp |
| updatedAt | DateTime | Last update timestamp |

#### Product
Product catalog with multi-UOM support

| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| name | String | Product name (unique) |
| description | String | Product description |
| category | String | Product category |
| imageUrl | String | Product image URL |
| basePrice | Decimal | Selling price in base UOM |
| baseUOM | String | Base unit of measure |
| minStockLevel | Integer | Minimum stock threshold |
| shelfLifeDays | Integer | Days until expiration |
| status | String | active / inactive |

#### InventoryBatch
Batch-level inventory tracking with expiration dates

| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| batchNumber | String | Unique batch identifier |
| productId | UUID | Foreign key to Product |
| warehouseId | UUID | Foreign key to Warehouse |
| quantity | Decimal | Current quantity in base UOM |
| unitCost | Decimal | Cost per base UOM unit |
| expiryDate | DateTime | Expiration date |
| receivedDate | DateTime | Date received |
| status | String | active / expired |

#### StockMovement
Audit trail of all inventory changes

| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| batchId | UUID | Foreign key to InventoryBatch |
| type | String | IN / OUT / TRANSFER / ADJUSTMENT |
| quantity | Decimal | Movement quantity |
| reason | String | Movement reason |
| referenceId | UUID | Related transaction ID |
| referenceType | String | PO / SO / POS / TRANSFER |
| createdAt | DateTime | Movement timestamp |

---

## Part 3: Business Logic Requirements

### Weighted Average Cost Calculation

**Purpose**: Calculate inventory valuation using weighted average costing method

**Algorithm**:
```
For each product in each warehouse:
1. Retrieve all active batches with quantity > 0
2. Calculate total cost = SUM(batch.quantity × batch.unitCost)
3. Calculate total quantity = SUM(batch.quantity)
4. Weighted average cost = total cost ÷ total quantity
5. If no batches exist, return 0
```

**Usage**: Used for COGS calculation in POS sales and inventory valuation reports

### FIFO Stock Deduction

**Purpose**: Deduct inventory prioritizing earliest expiration dates to minimize waste

**Algorithm**:
```
When deducting stock:
1. Convert requested quantity to base UOM
2. Fetch active batches ordered by expiryDate ASC
3. Loop through batches:
   a. Calculate deduction from current batch (min of batch quantity and remaining needed)
   b. Update batch quantity
   c. Record stock movement
   d. Subtract deducted amount from remaining needed
4. If insufficient stock after all batches, throw error
5. Return success
```

### UOM Conversion Logic

**Purpose**: Convert quantities between different units of measure

**Algorithm**:
```
Convert to Base UOM:
1. If UOM equals product.baseUOM, return quantity as-is
2. Find ProductUOM record matching the UOM name
3. If not found, throw "UOM not found" error
4. Return quantity × conversionFactor

Convert from Base UOM:
1. Find ProductUOM record
2. Return quantity ÷ conversionFactor
```

**Example**: 
- Product: Coca-Cola, Base UOM: bottle
- Alternate UOM: carton, Conversion Factor: 24
- Converting 2 cartons to base: 2 × 24 = 48 bottles

### Purchase Order Receiving Workflow

**Purpose**: Automatically create inventory batches and accounts payable when PO is received

**Steps**:
1. Validate PO status is "ordered"
2. Begin database transaction
3. For each PO item:
   - Generate unique batch number
   - Calculate expiry date = receivedDate + product.shelfLifeDays
   - Create InventoryBatch with PO unit cost
   - Record StockMovement (type: IN, reference: PO)
4. Update PO status to "received" and set actualDeliveryDate
5. Calculate due date based on supplier payment terms
6. Create AccountsPayable record
7. Commit transaction
8. Return created batches

### POS Sale Processing

**Purpose**: Process point-of-sale transactions with inventory deduction and COGS calculation

**Steps**:
1. Begin database transaction
2. Validate stock availability for all items
3. For each cart item:
   - Get weighted average cost for product/warehouse
   - Convert quantity to base UOM
   - Calculate COGS = weighted average cost × base quantity
   - Deduct inventory using FIFO logic
4. Calculate subtotal = SUM(item quantities × UOM selling prices)
5. Calculate tax = subtotal × 0.12
6. Calculate total = subtotal + tax
7. Create POSSale record with generated receipt number
8. Create POSSaleItem records with COGS
9. If converting from sales order, update SO status and link
10. Commit transaction
11. Return sale with receipt number

---

## Part 4: Module-by-Module Requirements

### Module 1: Dashboard & Analytics (0% Complete - HIGH PRIORITY)

#### Business Purpose
Provide real-time visibility into key business metrics for operational decision-making

#### Functional Requirements

##### KPI Cards
Display the following metrics in card format:

| KPI | Calculation | Format |
|-----|-------------|--------|
| Total Products | COUNT(Product WHERE status = active) | Number |
| Total Stock Units | SUM(InventoryBatch.quantity in base UOM) | Number with commas |
| Inventory Value | SUM(quantity × weighted average cost) | ₱ X,XXX.XX |
| Active Sales Orders | COUNT(SalesOrder WHERE status != cancelled) | Number |
| Today's POS Revenue | SUM(POSSale.totalAmount WHERE createdAt = today) | ₱ X,XXX.XX |
| Today's Transactions | COUNT(POSSale WHERE createdAt = today) | Number |
| Low Stock Alerts | COUNT(Products WHERE current stock < minStockLevel) | Number with badge |
| Expiring Soon | COUNT(Batches WHERE expiryDate <= today + 30 days) | Number with badge |
| Outstanding AR | SUM(AccountsReceivable.balance) | ₱ X,XXX.XX |
| Outstanding AP | SUM(AccountsPayable.balance) | ₱ X,XXX.XX |
| Current Month Expenses | SUM(Expense.amount WHERE month = current) | ₱ X,XXX.XX |
| Overdue Receivables | COUNT(AR WHERE dueDate < today AND balance > 0) | Number with badge |

##### Top Selling Products Widget
- Display top 5 products by revenue for selected date range
- Show product name, quantity sold, revenue
- Include small bar chart visualization
- Default to last 30 days

##### Warehouse Utilization Chart
- Bar chart showing utilization percentage per warehouse
- Color coding: green (< 60%), yellow (60-79%), red (≥ 80%)
- Show capacity and current stock for each warehouse

##### Branch Comparison Widget
- Table comparing branches by revenue, expenses, and profit
- Date range selector
- Sort by any column
- Highlight best and worst performers

##### Recent Activity Feed
- Show last 10 transactions across all modules
- Include: POS sales, purchase orders received, sales orders created
- Timestamp and amount for each activity
- Click to view details

#### Technical Implementation

**Service Layer**: `dashboard.service.ts`
- `getKPIs(branchId?: string): Promise<DashboardKPIs>`
- `getTopSellingProducts(branchId?: string, dateRange: DateRange): Promise<TopProduct[]>`
- `getWarehouseUtilization(branchId?: string): Promise<WarehouseUtil[]>`
- `getBranchComparison(dateRange: DateRange): Promise<BranchMetrics[]>`
- `getRecentActivity(limit: number): Promise<Activity[]>`

**API Routes**:
- `GET /api/dashboard/kpis?branchId={id}` - Fetch all KPIs
- `GET /api/dashboard/top-products?branchId={id}&from={date}&to={date}` - Top selling products
- `GET /api/dashboard/warehouse-utilization?branchId={id}` - Warehouse utilization
- `GET /api/dashboard/branch-comparison?from={date}&to={date}` - Branch metrics
- `GET /api/dashboard/activity?limit={n}` - Recent activity

**UI Components**:
- `KPICard` - Reusable card for metrics with icon, value, and trend
- `TopProductsWidget` - Table with bar chart
- `WarehouseUtilizationChart` - Bar chart using Recharts
- `BranchComparisonTable` - Sortable table
- `ActivityFeed` - List of recent activities

**Page**: `/app/(dashboard)/dashboard/page.tsx`

---

### Module 2: Alert Monitoring System (0% Complete - HIGH PRIORITY)

#### Business Purpose
Proactively notify warehouse managers of low stock and expiring products to prevent stockouts and waste

#### Functional Requirements

##### Alert Types

| Type | Trigger Condition | Severity | Action |
|------|------------------|----------|--------|
| Low Stock | current stock < minStockLevel | Warning | Reorder product |
| Expiring Soon | expiryDate <= today + 30 days | Warning | Discount or rotate stock |
| Expired | expiryDate < today | Critical | Remove from warehouse |
| Overdue AR | AR balance > 0 AND dueDate < today | Warning | Contact customer |
| Overdue AP | AP balance > 0 AND dueDate < today | Critical | Make payment |
| Warehouse Capacity | utilization >= 80% | Warning | Transfer or expand |

##### Alert List Page
- Table showing all active alerts
- Columns: Type, Product/Customer/Supplier, Details, Warehouse, Severity, Created Date
- Filter by: Type, Severity, Warehouse, Branch
- Sort by: Date, Severity
- Action buttons per alert:
  - Low Stock: "Create Purchase Order"
  - Expiring Soon: "View Batches"
  - Expired: "Remove Batch"
  - Overdue AR/AP: "Record Payment"
- Dismiss alert functionality

##### Alert Counts in Navigation
- Display badge with count on Alerts navigation item
- Update in real-time when new alerts are generated
- Color coding: red for critical, yellow for warning

##### Alert Generation Logic
- Generate alerts dynamically on page load (no storage needed)
- Calculate counts for dashboard KPIs
- Refresh when underlying data changes

#### Technical Implementation

**Type Definitions**: `types/alert.types.ts`
```
interface Alert {
  id: string
  type: 'LOW_STOCK' | 'EXPIRING_SOON' | 'EXPIRED' | 'OVERDUE_AR' | 'OVERDUE_AP' | 'WAREHOUSE_CAPACITY'
  severity: 'warning' | 'critical'
  productId?: string
  productName?: string
  warehouseId?: string
  warehouseName?: string
  branchId?: string
  customerId?: string
  supplierId?: string
  batchId?: string
  currentQuantity?: number
  minStockLevel?: number
  shortage?: number
  expiryDate?: DateTime
  daysUntilExpiry?: number
  balance?: number
  dueDate?: DateTime
  createdAt: DateTime
}
```

**Service Layer**: `alert.service.ts`
- `getLowStockAlerts(branchId?: string): Promise<Alert[]>` - Products below min stock
- `getExpiringSoonAlerts(branchId?: string): Promise<Alert[]>` - Batches expiring in 30 days
- `getExpiredAlerts(branchId?: string): Promise<Alert[]>` - Expired batches
- `getOverdueARAlerts(branchId?: string): Promise<Alert[]>` - Overdue receivables
- `getOverdueAPAlerts(branchId?: string): Promise<Alert[]>` - Overdue payables
- `getWarehouseCapacityAlerts(branchId?: string): Promise<Alert[]>` - Warehouses at 80%+
- `getAllAlerts(branchId?: string): Promise<Alert[]>` - All alerts combined
- `getAlertCounts(branchId?: string): Promise<AlertCounts>` - Count by type

**API Routes**:
- `GET /api/alerts?branchId={id}&type={type}&severity={severity}` - Fetch alerts with filters
- `GET /api/alerts/counts?branchId={id}` - Alert counts by type

**UI Components**:
- `AlertTable` - Sortable, filterable table
- `AlertBadge` - Badge showing severity with color
- `AlertActionButton` - Action button with icon
- `AlertFilterBar` - Filter controls

**Page**: `/app/(dashboard)/alerts/page.tsx`

---

### Module 3: Accounts Receivable UI (Backend 100%, Frontend 0%)

#### Business Purpose
Manage customer invoices and track payments to improve cash flow

#### Functional Requirements

##### AR List Page
- Table displaying all AR records
- Columns: Customer Name, Sales Order #, Invoice Date, Total Amount, Paid Amount, Balance, Due Date, Status, Age (days)
- Status badges: Pending (blue), Partial (yellow), Paid (green), Overdue (red)
- Aging color coding:
  - 0-30 days: green
  - 31-60 days: yellow
  - 61-90 days: orange
  - 90+ days: red
- Filters: Status, Date Range, Branch, Customer Name
- Sort by any column
- Action buttons: View Details, Record Payment
- Total outstanding balance displayed at top

##### Record Payment Modal
- Fields: Payment Amount, Payment Method, Reference Number, Payment Date
- Validation: Amount must not exceed balance
- Support for partial payments
- Display remaining balance after payment
- Auto-update AR status after payment
- Show payment history for the AR record

##### AR Aging Report
- Group AR records by aging buckets
- Display totals per bucket
- Show customer breakdown within each bucket
- Export to CSV functionality
- Print-friendly layout

#### Technical Implementation

**API Routes** (Already exist):
- `GET /api/ar` - Fetch all AR records
- `GET /api/ar/[id]` - Fetch single AR with payment history
- `POST /api/ar/[id]/payment` - Record payment
- `GET /api/ar/aging-report` - Generate aging report

**UI Components**:
- `ARTable` - Main AR listing table
- `RecordPaymentModal` - Payment recording form
- `ARAgingReport` - Aging report component
- `ARStatusBadge` - Status badge with color
- `PaymentHistoryTable` - List of payments for AR record

**Hooks**: `hooks/use-ar.ts`
- `useARList(filters)` - Fetch AR records with filters
- `useARDetail(id)` - Fetch single AR
- `useRecordPayment()` - Mutation for recording payment
- `useAgingReport(dateRange)` - Fetch aging report

**Page**: `/app/(dashboard)/ar-ap/page.tsx` (combined AR/AP page with tabs)

---

### Module 4: Accounts Payable UI (Backend 100%, Frontend 0%)

#### Business Purpose
Track supplier invoices and manage payment obligations

#### Functional Requirements

##### AP List Page
- Table displaying all AP records
- Columns: Supplier Name, PO #, Invoice Date, Total Amount, Paid Amount, Balance, Due Date, Payment Terms, Status, Age
- Status badges: Pending (blue), Partial (yellow), Paid (green), Overdue (red)
- Aging color coding (same as AR)
- Filters: Status, Date Range, Branch, Supplier Name
- Sort by any column
- Action buttons: View Details, Record Payment
- Total outstanding balance displayed at top

##### Record Payment Modal
- Fields: Payment Amount, Payment Method, Reference Number, Payment Date
- Validation: Amount must not exceed balance
- Support for partial payments
- Display remaining balance after payment
- Auto-update AP status after payment
- Show payment history for the AP record

##### AP Aging Report
- Group AP records by aging buckets
- Display totals per bucket
- Show supplier breakdown within each bucket
- Export to CSV functionality
- Print-friendly layout

#### Technical Implementation

**API Routes** (Already exist):
- `GET /api/ap` - Fetch all AP records
- `GET /api/ap/[id]` - Fetch single AP with payment history
- `POST /api/ap/[id]/payment` - Record payment
- `GET /api/ap/aging-report` - Generate aging report

**UI Components**:
- `APTable` - Main AP listing table
- `RecordAPPaymentModal` - Payment recording form
- `APAgingReport` - Aging report component
- `APStatusBadge` - Status badge with color
- `APPaymentHistoryTable` - List of payments for AP record

**Hooks**: `hooks/use-ap.ts`
- `useAPList(filters)` - Fetch AP records with filters
- `useAPDetail(id)` - Fetch single AP
- `useRecordAPPayment()` - Mutation for recording payment
- `useAPAgingReport(dateRange)` - Fetch aging report

**Page**: `/app/(dashboard)/ar-ap/page.tsx` (combined page with AR and AP tabs)

---

### Module 5: Expense Management UI (Backend 100%, Frontend 0%)

#### Business Purpose
Track and categorize business expenses for cost analysis and profitability monitoring

#### Functional Requirements

##### Expense List Page
- Table displaying all expense records
- Columns: Expense Date, Category, Amount, Vendor, Payment Method, Description, Branch
- Filters: Category, Date Range, Payment Method, Branch, Vendor
- Sort by any column
- Action buttons: Edit, Delete
- Monthly expense summary at top
- Category breakdown widget (pie chart or bar chart)

##### Create/Edit Expense Form
- Fields: Expense Date, Category (dropdown), Amount, Vendor, Payment Method, Description, Branch, Receipt Upload (optional)
- Categories: Utilities, Rent, Salaries, Transportation, Marketing, Maintenance, Other
- Payment Methods: Cash, Card, Check, Online Transfer
- Validation: Amount > 0, all required fields
- Receipt image upload with preview

##### Expense Reports
- Report by Category: Total expenses per category for date range
- Report by Vendor: Total expenses per vendor for date range
- Monthly Trends: Line chart showing expenses over months
- Export to CSV functionality

#### Technical Implementation

**API Routes** (Already exist):
- `GET /api/expenses` - Fetch all expenses
- `GET /api/expenses/[id]` - Fetch single expense
- `POST /api/expenses` - Create expense
- `PUT /api/expenses/[id]` - Update expense
- `DELETE /api/expenses/[id]` - Delete expense
- `GET /api/expenses/reports/by-category` - Category report
- `GET /api/expenses/reports/by-vendor` - Vendor report

**UI Components**:
- `ExpenseTable` - Main expense listing table
- `ExpenseForm` - Create/edit form modal
- `ExpenseCategoryChart` - Pie or bar chart by category
- `ExpenseTrendsChart` - Line chart over time
- `ReceiptUpload` - File upload component

**Hooks**: `hooks/use-expenses.ts`
- `useExpenseList(filters)` - Fetch expenses with filters
- `useExpenseDetail(id)` - Fetch single expense
- `useCreateExpense()` - Mutation for creating expense
- `useUpdateExpense()` - Mutation for updating expense
- `useDeleteExpense()` - Mutation for deleting expense
- `useCategoryReport(dateRange)` - Fetch category report
- `useVendorReport(dateRange)` - Fetch vendor report

**Page**: `/app/(dashboard)/expenses/page.tsx`

---

### Module 6: Comprehensive Reporting (0% Complete - HIGH PRIORITY)

#### Business Purpose
Provide comprehensive business intelligence and financial reporting for decision-making

#### Functional Requirements

##### Report Categories

###### Inventory Reports
- **Stock Level Report**: Current stock by product, warehouse, and branch in base UOM
- **Inventory Valuation Report**: Value of inventory using weighted average cost
- **Batch Tracking Report**: All batches with expiry dates, quantities, and status
- **Stock Movement History**: Complete audit trail of all inventory movements
- **Warehouse Utilization Report**: Capacity usage by warehouse

###### Sales Reports
- **POS Sales Summary**: Total sales by date range, payment method, branch
- **Sales by Product**: Revenue and quantity sold per product
- **Sales by Category**: Revenue breakdown by product category
- **Best Selling Products**: Top N products by revenue or quantity
- **Sales Order Fulfillment**: Conversion rates from sales orders to POS

###### Procurement Reports
- **Purchase Order Summary**: PO status distribution, total value
- **Supplier Performance**: On-time delivery rate, average cost by supplier
- **Cost Analysis by Supplier**: Comparison of supplier pricing

###### Financial Reports
- **Profit & Loss Statement**: Revenue, COGS, Gross Profit, Expenses, Net Profit
- **Cash Flow Statement**: Inflows (sales, AR payments), Outflows (expenses, AP payments), Net Cash Flow
- **Balance Sheet**: Assets (inventory value, AR), Liabilities (AP), Equity
- **AR Aging Report**: Customer balances by aging buckets
- **AP Aging Report**: Supplier balances by aging buckets
- **Expense Summary**: Total expenses by category and vendor

##### Report Features
- Date range selection for all reports
- Branch filtering (single branch or all branches)
- Export to CSV for all reports
- Print-friendly layouts
- Visual charts where appropriate (Recharts)
- Column sorting and filtering in tables

#### Technical Implementation

**Service Layer**: `report.service.ts`
- `generateInventoryReport(filters): Promise<InventoryReport>`
- `generateSalesReport(filters): Promise<SalesReport>`
- `generateProcurementReport(filters): Promise<ProcurementReport>`
- `generateProfitLossStatement(filters): Promise<PLStatement>`
- `generateCashFlowStatement(filters): Promise<CashFlowStatement>`
- `generateBalanceSheet(filters): Promise<BalanceSheet>`

**API Routes**:
- `GET /api/reports/inventory/stock-level` - Stock level report
- `GET /api/reports/inventory/valuation` - Inventory valuation
- `GET /api/reports/inventory/batches` - Batch tracking
- `GET /api/reports/inventory/movements` - Stock movements
- `GET /api/reports/sales/summary` - Sales summary
- `GET /api/reports/sales/by-product` - Sales by product
- `GET /api/reports/sales/by-category` - Sales by category
- `GET /api/reports/procurement/summary` - PO summary
- `GET /api/reports/procurement/supplier-performance` - Supplier metrics
- `GET /api/reports/financial/profit-loss` - P&L statement
- `GET /api/reports/financial/cash-flow` - Cash flow
- `GET /api/reports/financial/balance-sheet` - Balance sheet

**UI Components**:
- `ReportFilters` - Reusable filter bar with date range, branch selection
- `InventoryStockLevelReport` - Stock level table
- `SalesSummaryReport` - Sales summary with charts
- `ProfitLossStatement` - P&L financial statement
- `CashFlowStatement` - Cash flow statement
- `BalanceSheet` - Balance sheet
- `ExportButton` - CSV export functionality

**Page**: `/app/(dashboard)/reports/page.tsx` with tabbed interface

---

### Module 7: Purchase Order to Receiving Voucher Conversion (NEW FEATURE - HIGH PRIORITY)

#### Business Purpose
Enable accurate inventory receiving by tracking actual received quantities versus ordered quantities, providing variance analysis and flexible inventory updates based on what was actually delivered.

#### Current Status
Current PO receiving workflow automatically creates inventory batches for full ordered quantities without allowing verification of actual received amounts. This new feature adds a Receiving Voucher intermediate step.

#### Functional Requirements

##### Receiving Voucher Workflow

**Step 1: Create Receiving Voucher from PO**
- When user clicks "Receive" on an ordered PO, open Receiving Voucher creation dialog
- Pre-populate voucher with PO details and items
- Allow editing of received quantities per item
- Display ordered quantity vs received quantity comparison
- Calculate variances (quantity difference and percentage)
- Support partial receiving (some items fully received, others partial or not received)
- Add delivery notes and receiver name fields
- Generate unique Receiving Voucher Number (RV-YYYYMMDD-XXXX)

**Step 2: Quantity Verification**
- For each PO item, display:
  - Product name and description
  - Ordered quantity in base UOM
  - Editable received quantity field
  - Variance: (Received - Ordered) with color coding
    - Green: Exact match (variance = 0)
    - Yellow: Under-delivery (variance < 0)
    - Red: Over-delivery (variance > 0)
  - Variance percentage: ((Received - Ordered) / Ordered) × 100
- Allow reasons for variances:
  - Damaged items
  - Expired items
  - Supplier shortage
  - Over-shipment
  - Wrong items delivered

**Step 3: Save and Process Receiving Voucher**
- Validate that at least one item has received quantity > 0
- Create ReceivingVoucher record in database
- Create ReceivingVoucherItem records for each line
- Create inventory batches ONLY for received quantities (not ordered quantities)
- Record stock movements with reference to Receiving Voucher
- Update PO status based on receiving completion:
  - "fully_received": All items received in full
  - "partially_received": Some items received or partial quantities
  - "ordered": No items received yet
- Create AP record based on received amount, not ordered amount
- Calculate AP amount: SUM(received quantity × unit price)

##### Receiving Voucher Management

**Receiving Voucher List**
- Table showing all receiving vouchers
- Columns: RV Number, PO Number, Supplier, Warehouse, Total Items, Received Items, Total Amount, Status, Created Date
- Filters: Date range, Supplier, Warehouse, Branch, Status
- Search by RV number or PO number
- Status badges:
  - Complete: All items fully received
  - Partial: Some variances exist
  - Pending: Awaiting approval
- Action buttons: View Details, Print, Approve (if pending)

**Receiving Voucher Detail View**
- Display RV header information:
  - RV Number, Date, Receiver Name
  - Related PO Number with link
  - Supplier details
  - Warehouse and Branch
  - Delivery notes
- Items table with columns:
  - Product Name
  - Ordered Qty
  - Received Qty
  - Variance (Qty & %)
  - Unit Price
  - Line Total (Received Qty × Unit Price)
  - Variance Reason
- Summary section:
  - Total Ordered Amount
  - Total Received Amount
  - Overall Variance Amount
  - Items Fully Received / Total Items
- Print functionality for warehouse documentation

##### Variance Reporting

**Variance Analysis Report**
- Summary by supplier showing:
  - Total POs received
  - Average variance percentage
  - Over-delivery count
  - Under-delivery count
  - Exact match count
- Detail report by item showing:
  - Product name
  - Total ordered quantity across all RVs
  - Total received quantity
  - Total variance
  - Frequency of variance
- Filter by date range, supplier, product category
- Export to CSV for supplier performance analysis

##### Integration with Existing Modules

**Purchase Order Updates**
- Add new status: "partially_received"
- Track total received quantity per PO item
- Display receiving history on PO detail page
- Show list of related receiving vouchers
- Calculate PO completion percentage

**Inventory Updates**
- Create batches based on actual received quantities
- Link batches to Receiving Voucher ID in referenceId
- Set referenceType to "RV" instead of "PO"
- Maintain audit trail with RV reference

**Accounts Payable Updates**
- Create AP based on received amount, not ordered amount
- Link AP to Receiving Voucher for variance tracking
- Allow AP adjustments if additional items received later

#### Technical Implementation

**Database Schema Enhancement**

Add new tables:

```
model ReceivingVoucher {
  id                String   @id @default(uuid())
  rvNumber          String   @unique
  purchaseOrderId   String
  warehouseId       String
  branchId          String
  receiverName      String
  deliveryNotes     String?
  status            String   @default("complete")
  totalOrderedAmount Decimal @db.Decimal(10, 2)
  totalReceivedAmount Decimal @db.Decimal(10, 2)
  varianceAmount    Decimal  @db.Decimal(10, 2)
  receivedDate      DateTime @default(now())
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  
  purchaseOrder     PurchaseOrder @relation(fields: [purchaseOrderId], references: [id])
  warehouse         Warehouse @relation(fields: [warehouseId], references: [id])
  branch            Branch @relation(fields: [branchId], references: [id])
  items             ReceivingVoucherItem[]
}

model ReceivingVoucherItem {
  id                String   @id @default(uuid())
  rvId              String
  productId         String
  orderedQuantity   Decimal  @db.Decimal(10, 2)
  receivedQuantity  Decimal  @db.Decimal(10, 2)
  varianceQuantity  Decimal  @db.Decimal(10, 2)
  variancePercentage Decimal @db.Decimal(5, 2)
  varianceReason    String?
  unitPrice         Decimal  @db.Decimal(10, 2)
  lineTotal         Decimal  @db.Decimal(10, 2)
  
  receivingVoucher  ReceivingVoucher @relation(fields: [rvId], references: [id], onDelete: Cascade)
  product           Product @relation(fields: [productId], references: [id])
}
```

Update PurchaseOrder model:
```
model PurchaseOrder {
  // ... existing fields
  receivingStatus   String?  @default("pending") // pending, partially_received, fully_received
  
  receivingVouchers ReceivingVoucher[]
}
```

Update PurchaseOrderItem model:
```
model PurchaseOrderItem {
  // ... existing fields
  receivedQuantity  Decimal  @db.Decimal(10, 2) @default(0)
}
```

**Service Layer**: `receiving-voucher.service.ts`

Methods:
- `createReceivingVoucher(data: CreateRVInput): Promise<ReceivingVoucher>` - Create RV from PO
- `getReceivingVoucherById(id: string): Promise<RVWithDetails>` - Fetch single RV with items
- `listReceivingVouchers(filters: RVFilters): Promise<ReceivingVoucher[]>` - List with filters
- `generateRVNumber(): Promise<string>` - Generate unique RV-YYYYMMDD-XXXX
- `calculateVariances(items: RVItemInput[]): RVItemWithVariance[]` - Calculate variances
- `processReceiving(rvId: string): Promise<void>` - Process inventory and AP creation
- `getVarianceReport(filters: DateRange): Promise<VarianceReport>` - Generate variance report

**Processing Logic**:
```
When creating Receiving Voucher:
1. Validate PO exists and status is "ordered"
2. Validate at least one item has receivedQuantity > 0
3. Begin database transaction
4. Generate unique RV number
5. For each item:
   a. Calculate variance: receivedQuantity - orderedQuantity
   b. Calculate variance percentage: (variance / orderedQuantity) × 100
   c. Calculate line total: receivedQuantity × unitPrice
6. Calculate totals:
   a. totalOrderedAmount = SUM(orderedQuantity × unitPrice)
   b. totalReceivedAmount = SUM(receivedQuantity × unitPrice)
   c. varianceAmount = totalReceivedAmount - totalOrderedAmount
7. Create ReceivingVoucher record
8. Create ReceivingVoucherItem records
9. For each item with receivedQuantity > 0:
   a. Create inventory batch with receivedQuantity
   b. Set referenceId to RV.id and referenceType to "RV"
   c. Record stock movement
   d. Update PurchaseOrderItem.receivedQuantity
10. Update PO status:
    a. If all items fully received: "fully_received"
    b. If some items received: "partially_received"
    c. Else: remain "ordered"
11. Create AccountsPayable with totalReceivedAmount
12. Commit transaction
13. Return created RV
```

**API Routes**:
- `POST /api/receiving-vouchers` - Create receiving voucher from PO
- `GET /api/receiving-vouchers` - List all receiving vouchers with filters
- `GET /api/receiving-vouchers/[id]` - Get single RV with details
- `GET /api/purchase-orders/[id]/receiving-vouchers` - Get RVs for a PO
- `POST /api/receiving-vouchers/[id]/approve` - Approve pending RV
- `GET /api/reports/receiving-variance` - Generate variance report

**Validation Schema**: `lib/validations/receiving-voucher.validation.ts`

```
const receivingVoucherItemSchema = z.object({
  productId: z.string().uuid(),
  orderedQuantity: z.number().positive(),
  receivedQuantity: z.number().min(0),
  varianceReason: z.string().optional(),
  unitPrice: z.number().positive(),
});

const createReceivingVoucherSchema = z.object({
  purchaseOrderId: z.string().uuid(),
  receiverName: z.string().min(1, "Receiver name is required"),
  deliveryNotes: z.string().optional(),
  items: z.array(receivingVoucherItemSchema)
    .min(1, "At least one item is required")
    .refine(
      (items) => items.some(item => item.receivedQuantity > 0),
      "At least one item must have received quantity greater than zero"
    ),
});
```

**UI Components**:
- `ReceivingVoucherDialog` - Modal for creating RV from PO
- `ReceivingVoucherItemsTable` - Editable table with quantity inputs
- `VarianceIndicator` - Color-coded variance display
- `ReceivingVoucherList` - Table of all RVs
- `ReceivingVoucherDetail` - Detail view with print
- `VarianceReportTable` - Variance analysis report

**Hooks**: `hooks/use-receiving-vouchers.ts`
- `useCreateReceivingVoucher()` - Mutation for creating RV
- `useReceivingVouchers(filters)` - Fetch RVs with filters
- `useReceivingVoucherDetail(id)` - Fetch single RV
- `usePOReceivingVouchers(poId)` - Fetch RVs for a PO
- `useVarianceReport(dateRange)` - Fetch variance report

**Page**: `/app/(dashboard)/receiving-vouchers/page.tsx`

##### User Interface Flow

**Creating Receiving Voucher from PO**:
1. User navigates to PO detail page
2. Clicks "Receive" button (for status = "ordered")
3. Opens Receiving Voucher Dialog with:
   - Pre-filled PO details (read-only)
   - Receiver Name input
   - Delivery Notes textarea
   - Items table with columns:
     - Product Name (read-only)
     - Ordered Qty (read-only)
     - Received Qty (editable number input)
     - Variance (calculated, color-coded)
     - Variance % (calculated)
     - Variance Reason (dropdown: Damaged, Expired, Shortage, Over-shipment, Wrong Item, Other)
     - Unit Price (read-only)
     - Line Total (calculated)
4. User enters received quantities for each item
5. System calculates variances in real-time
6. Summary section shows:
   - Total Ordered: ₱ X,XXX.XX
   - Total Received: ₱ X,XXX.XX
   - Variance: ₱ X,XXX.XX (red if negative, green if positive)
7. User clicks "Save & Process"
8. System validates and creates RV
9. Success message: "Receiving Voucher RV-YYYYMMDD-XXXX created successfully. X inventory batches created."
10. Option to print RV or view details

**Benefits**:
- Accurate inventory tracking based on actual receipts
- Variance analysis for supplier performance evaluation
- Proper AP amount calculation (pay only for what was received)
- Audit trail for all receiving activities
- Support for partial deliveries and multiple shipments per PO
- Better inventory accuracy and cost control

---

### Module 8: Sales Order Conversion (Incomplete Feature)

#### Business Purpose
Streamline order fulfillment by converting sales orders to POS transactions

#### Current Status
Backend logic exists but frontend conversion feature is incomplete

#### Functional Requirements

##### Pending Orders Panel in POS
- Collapsible panel showing pending sales orders
- Table with: Order #, Customer Name, Total, Delivery Date, Items Count
- Checkbox selection for bulk conversion
- "Convert to POS" button for single order
- "Bulk Convert" button for selected orders

##### Conversion Process
- On click "Convert":
  - Pre-populate POS cart with order items (product, quantity, UOM)
  - Display customer info section (name, phone, email, address)
  - Allow editing of quantities before checkout
  - Link POS sale to sales order via `convertedFromOrderId`
  - Update sales order status to "converted"
  - Set `convertedToSaleId` on sales order

##### Bulk Conversion
- Select multiple pending orders using checkboxes
- Process each order sequentially
- Show progress indicator
- Display success/error for each order
- Refresh pending orders list after completion

#### Technical Implementation

**Service Layer Enhancement**: `pos.service.ts`
- `convertSalesOrderToPOS(salesOrderId: string): Promise<POSSale>` (already exists)
- `bulkConvertSalesOrders(orderIds: string[]): Promise<BulkConversionResult>` (new)

**API Routes**:
- `GET /api/pos/pending-orders?branchId={id}` (already exists)
- `POST /api/pos/convert-order` - Single order conversion (already exists)
- `POST /api/pos/bulk-convert` - Bulk conversion (new)

**UI Components**:
- `PendingOrdersPanel` - Collapsible panel in POS page
- `PendingOrdersTable` - Table with checkbox selection
- `ConvertOrderButton` - Single conversion button
- `BulkConvertButton` - Bulk conversion with progress
- `CustomerInfoSection` - Display customer details during conversion

**Page Enhancement**: `/app/(dashboard)/pos/page.tsx`

---

## Part 5: Implementation Roadmap

### Phase 1: Critical Business Intelligence (Weeks 1-2)

#### Week 1: Dashboard & Alerts
| Task | Priority | Estimated Hours | Dependencies |
|------|----------|----------------|--------------|
| Create dashboard service layer | Critical | 8h | None |
| Implement dashboard API routes | Critical | 4h | Dashboard service |
| Build KPI cards component | Critical | 6h | API routes |
| Create warehouse utilization chart | High | 4h | API routes |
| Build top products widget | High | 4h | API routes |
| Implement branch comparison widget | High | 4h | API routes |
| Create alert service layer | Critical | 6h | None |
| Implement alert API routes | Critical | 3h | Alert service |
| Build alert list page | Critical | 8h | Alert API |
| Add alert badges to navigation | High | 2h | Alert API |

**Total: 49 hours**

#### Week 2: AR/AP/Expense UI
| Task | Priority | Estimated Hours | Dependencies |
|------|----------|----------------|--------------|
| Build AR list page | Critical | 6h | Existing AR API |
| Create record AR payment modal | Critical | 4h | AR API |
| Implement AR aging report | High | 4h | AR API |
| Build AP list page | Critical | 6h | Existing AP API |
| Create record AP payment modal | Critical | 4h | AP API |
| Implement AP aging report | High | 4h | AP API |
| Create combined AR/AP page with tabs | Critical | 3h | AR/AP components |
| Build expense list page | High | 6h | Existing Expense API |
| Create expense form modal | High | 5h | Expense API |
| Implement expense charts | Medium | 4h | Expense API |

**Total: 46 hours**

### Phase 2: Comprehensive Reporting (Week 3)

| Task | Priority | Estimated Hours | Dependencies |
|------|----------|----------------|--------------|
| Create report service layer | Critical | 10h | None |
| Implement inventory report APIs | Critical | 6h | Report service |
| Implement sales report APIs | Critical | 6h | Report service |
| Implement financial report APIs | Critical | 8h | Report service |
| Build report page with tabs | Critical | 6h | Report APIs |
| Create inventory reports UI | High | 8h | Report APIs |
| Create sales reports UI | High | 8h | Report APIs |
| Create financial reports UI | High | 10h | Report APIs |
| Implement CSV export functionality | High | 4h | Report components |
| Add print-friendly layouts | Medium | 4h | Report components |

**Total: 70 hours**

### Phase 2.5: Receiving Voucher Module (Week 3.5 - NEW FEATURE)

| Task | Priority | Estimated Hours | Dependencies |
|------|----------|----------------|--------------|  
| Create database migration for RV tables | Critical | 2h | None |
| Create RV types and interfaces | Critical | 3h | Database schema |
| Create RV validation schema (Zod) | Critical | 2h | RV types |
| Create RV repository | Critical | 4h | Database migration |
| Create RV service with variance logic | Critical | 8h | RV repository |
| Implement RV API routes | Critical | 5h | RV service |
| Build Receiving Voucher Dialog UI | Critical | 8h | RV API |
| Create RV items editable table | Critical | 6h | RV Dialog |
| Implement variance calculation UI | High | 4h | RV items table |
| Build RV list page | High | 6h | RV API |
| Create RV detail view with print | High | 5h | RV API |
| Update PO detail page for RV | High | 3h | RV Dialog |
| Implement variance report | Medium | 5h | RV API |
| Create RV hooks | High | 3h | RV API |
| Test RV workflow end-to-end | Critical | 6h | All RV components |

**Total: 70 hours**

### Phase 3: Feature Completion & Enhancement (Week 4)

| Task | Priority | Estimated Hours | Dependencies |
|------|----------|----------------|--------------|
| Build pending orders panel in POS | High | 6h | Existing POS page |
| Implement single order conversion UI | High | 4h | POS API |
| Create bulk conversion feature | Medium | 6h | POS API |
| Add bulk conversion API endpoint | Medium | 3h | POS service |
| Enhance dashboard with recent activity | Medium | 4h | Dashboard APIs |
| Add receipt upload to expense form | Low | 3h | Expense form |
| Implement warehouse capacity alerts | Medium | 3h | Alert service |
| Add overdue AR/AP alerts | Medium | 3h | Alert service |
| Create alert action buttons | Medium | 4h | Alert page |
| Test and refine all modules | Critical | 10h | All phases |

**Total: 46 hours**

### Phase 4: Testing, Polish & Documentation (Week 5)

| Task | Priority | Estimated Hours | Dependencies |
|------|----------|----------------|--------------|
| End-to-end testing of all modules | Critical | 12h | All features |
| Test Receiving Voucher workflow | Critical | 6h | RV module |
| Fix bugs and edge cases | Critical | 10h | Testing |
| Performance optimization | High | 6h | Testing |
| UI/UX refinements | High | 6h | Testing |
| Add loading states and error handling | High | 6h | All modules |
| Update user documentation | Medium | 4h | All features |
| Create RV user guide | Medium | 3h | RV module |
| Create admin guide | Medium | 4h | All features |
| Final integration testing | Critical | 6h | All fixes |

**Total: 63 hours**

**REVISED TOTAL PROJECT EFFORT**: 344 hours (approximately 43 working days or 8-9 weeks with one developer)

---

## Part 6: Detailed Implementation Specifications

### Dashboard Service Implementation

**File**: `services/dashboard.service.ts`

**Methods**:

```
getKPIs(branchId?: string): Promise<DashboardKPIs>
- Aggregate total active products
- Sum total stock units across warehouses
- Calculate inventory value using weighted average cost
- Count active sales orders
- Sum today's POS revenue and transactions
- Count low stock alerts (stock < minStockLevel)
- Count expiring soon items (expiryDate <= today + 30 days)
- Sum outstanding AR balance
- Sum outstanding AP balance
- Sum current month expenses
- Count overdue AR and AP
- Filter all metrics by branchId if provided

getTopSellingProducts(branchId?: string, dateRange: DateRange): Promise<TopProduct[]>
- Join POSSaleItem with Product
- Group by productId
- Sum quantities and revenue
- Filter by date range and branchId
- Order by revenue DESC
- Limit to 5 results

getWarehouseUtilization(branchId?: string): Promise<WarehouseUtilization[]>
- For each warehouse:
  - Sum total stock in base UOM
  - Calculate percentage: (total stock / maxCapacity) × 100
  - Determine color: green, yellow, or red
- Filter by branchId if provided

getBranchComparison(dateRange: DateRange): Promise<BranchMetrics[]>
- For each branch:
  - Sum POS revenue for date range
  - Sum expenses for date range
  - Calculate profit: revenue - expenses
- Return sorted by profit DESC

getRecentActivity(limit: number): Promise<Activity[]>
- Union of:
  - Recent POS sales
  - Recent purchase orders received
  - Recent sales orders created
- Order by timestamp DESC
- Limit to specified number
```

**Return Types**:

```
interface DashboardKPIs {
  totalProducts: number
  totalStockUnits: number
  inventoryValue: number
  activeSalesOrders: number
  todayRevenue: number
  todayTransactions: number
  lowStockAlerts: number
  expiringSoon: number
  outstandingAR: number
  outstandingAP: number
  currentMonthExpenses: number
  overdueAR: number
  overdueAP: number
}

interface TopProduct {
  productId: string
  productName: string
  quantitySold: number
  revenue: number
}

interface WarehouseUtilization {
  warehouseId: string
  warehouseName: string
  maxCapacity: number
  currentStock: number
  utilizationPercent: number
  utilizationColor: 'green' | 'yellow' | 'red'
}

interface BranchMetrics {
  branchId: string
  branchName: string
  revenue: number
  expenses: number
  profit: number
}

interface Activity {
  id: string
  type: 'POS_SALE' | 'PO_RECEIVED' | 'SO_CREATED'
  description: string
  amount?: number
  timestamp: DateTime
  link: string
}
```

### Alert Service Implementation

**File**: `services/alert.service.ts`

**Methods**:

```
getLowStockAlerts(branchId?: string): Promise<Alert[]>
- Join Product with InventoryBatch
- Group by productId and warehouseId
- Sum current stock in base UOM
- Compare with minStockLevel
- Filter WHERE current stock < minStockLevel
- Calculate shortage amount
- Filter by branchId if provided

getExpiringSoonAlerts(branchId?: string): Promise<Alert[]>
- Select from InventoryBatch
- WHERE expiryDate <= today + 30 days AND expiryDate > today
- Calculate days until expiry
- Filter by branchId if provided

getExpiredAlerts(branchId?: string): Promise<Alert[]>
- Select from InventoryBatch
- WHERE expiryDate < today AND status = 'active'
- Filter by branchId if provided

getOverdueARAlerts(branchId?: string): Promise<Alert[]>
- Select from AccountsReceivable
- WHERE dueDate < today AND balance > 0
- Filter by branchId if provided

getOverdueAPAlerts(branchId?: string): Promise<Alert[]>
- Select from AccountsPayable
- WHERE dueDate < today AND balance > 0
- Filter by branchId if provided

getWarehouseCapacityAlerts(branchId?: string): Promise<Alert[]>
- For each warehouse:
  - Calculate utilization percentage
  - Filter WHERE utilization >= 80%
- Filter by branchId if provided

getAllAlerts(branchId?: string): Promise<Alert[]>
- Combine all alert types
- Sort by severity (critical first) then date

getAlertCounts(branchId?: string): Promise<AlertCounts>
- Count each alert type separately
- Return object with counts
```

### Report Service Implementation

**File**: `services/report.service.ts`

**Key Report Methods**:

```
generateProfitLossStatement(filters: ReportFilters): Promise<PLStatement>
Calculations:
- Total Revenue = SUM(POSSale.totalAmount) for date range
- Cost of Goods Sold = SUM(POSSaleItem.costOfGoodsSold) for date range
- Gross Profit = Total Revenue - COGS
- Gross Profit Margin = (Gross Profit / Total Revenue) × 100
- Total Expenses = SUM(Expense.amount) for date range
- Net Profit = Gross Profit - Total Expenses
- Net Profit Margin = (Net Profit / Total Revenue) × 100
Filter by branchId if provided

generateCashFlowStatement(filters: ReportFilters): Promise<CashFlowStatement>
Calculations:
Cash Inflows:
  - Sales Revenue = SUM(POSSale.totalAmount) for date range
  - AR Payments Received = SUM(ARPayment.amount) for date range
  - Total Inflows = Sales Revenue + AR Payments
Cash Outflows:
  - Expenses = SUM(Expense.amount) for date range
  - AP Payments Made = SUM(APPayment.amount) for date range
  - Total Outflows = Expenses + AP Payments
Net Cash Flow = Total Inflows - Total Outflows
Filter by branchId if provided

generateBalanceSheet(filters: ReportFilters): Promise<BalanceSheet>
Calculations:
Assets:
  - Inventory Value = SUM(InventoryBatch.quantity × weighted average cost)
  - Accounts Receivable = SUM(AccountsReceivable.balance)
  - Total Assets = Inventory Value + AR
Liabilities:
  - Accounts Payable = SUM(AccountsPayable.balance)
  - Total Liabilities = AP
Equity:
  - Equity = Total Assets - Total Liabilities
Filter by branchId if provided

generateInventoryValuationReport(filters: ReportFilters): Promise<InventoryValuation[]>
- For each product in each warehouse:
  - Calculate weighted average cost
  - Multiply by current quantity
  - Aggregate totals
- Filter by warehouse and branch if provided

generateSalesSummaryReport(filters: ReportFilters): Promise<SalesSummary>
- Aggregate POS sales by date range
- Group by payment method
- Calculate totals and averages
- Include top selling products
- Filter by branch if provided
```

---

## Part 7: Quality Assurance & Testing Strategy

### Testing Approach

#### Unit Testing
- Test service layer methods in isolation
- Mock Prisma calls
- Verify business logic calculations (weighted average, FIFO, etc.)
- Use Vitest for unit tests

#### Integration Testing
- Test API routes with real database
- Verify complete workflows (PO receiving, POS sale, payment recording)
- Test data consistency across transactions
- Use test database separate from development

#### End-to-End Testing
- Test complete user workflows in browser
- Verify UI interactions and data flow
- Use Playwright for E2E tests
- Test critical paths:
  - Create product → Add stock → Process POS sale
  - Create PO → Receive PO → Verify inventory and AP
  - Record AR payment → Verify balance update
  - Generate reports → Verify calculations

### Test Coverage Goals

| Layer | Target Coverage | Priority Tests |
|-------|----------------|----------------|
| Service Layer | 80%+ | Business logic, calculations |
| Repository Layer | 70%+ | CRUD operations, complex queries |
| API Routes | 90%+ | All endpoints, error cases |
| UI Components | 60%+ | Critical user interactions |

### Edge Cases to Test

1. **Inventory**:
   - Deducting more stock than available
   - Transferring between warehouses when destination is at capacity
   - Adding stock with negative quantities
   - FIFO deduction with multiple batches

2. **Financial**:
   - Recording payment exceeding balance
   - Partial payments
   - Overdue calculations
   - Aging bucket boundaries

3. **POS**:
   - Empty cart checkout
   - Converting already-converted sales order
   - Cash payment with insufficient amount received
   - Stock availability changes during checkout

4. **Reports**:
   - Empty data sets
   - Very large date ranges
   - Division by zero in calculations
   - Null values in aggregations

---

## Part 8: Deployment & Production Readiness

### Pre-Deployment Checklist

#### Database
- [ ] All migrations applied
- [ ] Indexes created for performance
- [ ] Seed data loaded for demo
- [ ] Backup strategy configured
- [ ] Connection pooling optimized

#### Code Quality
- [ ] No TypeScript errors
- [ ] ESLint passing
- [ ] All console.logs removed
- [ ] Environment variables documented
- [ ] Error handling comprehensive

#### Performance
- [ ] Large lists paginated
- [ ] Images optimized
- [ ] Code splitting implemented
- [ ] API response times < 500ms
- [ ] Database query optimization

#### Security
- [ ] Input validation on all forms
- [ ] SQL injection prevention (Prisma)
- [ ] XSS prevention
- [ ] CSRF protection
- [ ] Sensitive data not exposed in logs

#### User Experience
- [ ] Loading states on all async operations
- [ ] Error messages user-friendly
- [ ] Success confirmations
- [ ] Empty states handled
- [ ] Mobile responsive

### Environment Variables

Required for production:

```
DATABASE_URL=postgresql://user:password@host:5432/inventorypro?sslmode=require
NEXT_PUBLIC_STACK_PROJECT_ID=your_project_id
NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY=your_client_key
STACK_SECRET_SERVER_KEY=your_server_key
NODE_ENV=production
```

### Deployment Steps

1. Build application: `npm run build`
2. Run database migrations: `npx prisma migrate deploy`
3. Generate Prisma client: `npx prisma generate`
4. Deploy to Vercel or hosting platform
5. Set environment variables in platform
6. Run smoke tests on production URL
7. Monitor error logs for first 24 hours

---

## Part 9: Future Enhancements (Post-MVP)

### Phase 2 Features (3-6 Months)

#### User Management & Authentication
- User registration and login
- Role-based access control (Admin, Manager, Operator)
- Permission management
- Audit logs for all actions

#### Advanced Inventory Features
- Barcode scanning for products
- Automatic reorder point suggestions
- Inventory forecasting based on sales trends
- Serial number tracking for high-value items

#### Customer Management
- Customer database with purchase history
- Loyalty points program
- Customer credit limits
- SMS/Email notifications for orders

#### Advanced Reporting
- Customizable report builder
- Scheduled report generation
- Email report delivery
- Interactive dashboards with drill-down

#### Mobile Application
- Mobile POS app for field sales
- Mobile inventory counting
- Push notifications for alerts
- Offline mode with sync

#### Integrations
- Accounting software integration (QuickBooks, Xero)
- Payment gateway integration (PayMongo, GCash)
- E-commerce platform integration
- SMS gateway for notifications

---

## Part 10: Implementation Execution Plan

### How I Will Implement This

#### Step 1: Set Up Development Environment (30 minutes)
1. Review existing codebase structure
2. Verify all dependencies are installed
3. Run database migrations
4. Test existing modules to understand patterns
5. Create feature branches for each module

#### Step 2: Implement Dashboard Module (Day 1-2)
1. Create `services/dashboard.service.ts` with all KPI methods
2. Implement API routes for each dashboard endpoint
3. Build reusable `KPICard` component
4. Create dashboard page with all widgets
5. Test data accuracy against database
6. Add loading and error states
7. Ensure responsive design

#### Step 3: Implement Alert System (Day 2-3)
1. Define alert types in `types/alert.types.ts`
2. Create `services/alert.service.ts` with alert generation logic
3. Implement API routes for alerts
4. Build alert table with filters
5. Add alert badges to navigation
6. Create action buttons for each alert type
7. Test all alert conditions

#### Step 4: Build AR/AP UI (Day 3-4)
1. Create AR list page using existing hooks
2. Build record payment modal
3. Implement AR aging report
4. Repeat for AP module
5. Combine into tabbed interface
6. Test payment recording and balance updates
7. Verify aging calculations

#### Step 5: Build Expense Management UI (Day 4-5)
1. Create expense list page
2. Build expense form modal with validation
3. Implement expense charts
4. Add receipt upload functionality
5. Test CRUD operations
6. Verify category and vendor reports

#### Step 6: Implement Reporting Module (Day 5-7)
1. Create `services/report.service.ts`
2. Implement inventory report APIs
3. Implement sales report APIs
4. Implement financial report APIs
5. Build report page with tabs
6. Create report components for each type
7. Add CSV export functionality
8. Test all calculations for accuracy
9. Verify filters work correctly

#### Step 7: Complete Sales Order Conversion (Day 7-8)
1. Build pending orders panel in POS
2. Implement single conversion UI
3. Create bulk conversion feature
4. Add bulk conversion API
5. Test conversion workflow
6. Verify sales order status updates

#### Step 8: Testing & Refinement (Day 8-10)
1. End-to-end testing of all new modules
2. Integration testing across modules
3. Performance testing with large datasets
4. UI/UX refinements based on testing
5. Bug fixes and edge case handling
6. Documentation updates

#### Step 9: Deployment Preparation (Day 10)
1. Code review and cleanup
2. Performance optimization
3. Security audit
4. Environment configuration
5. Production deployment
6. Post-deployment monitoring

### Key Implementation Principles

1. **Follow Existing Patterns**: Use the same architectural patterns as existing modules (service → repository → Prisma)

2. **Reuse Components**: Leverage existing shadcn/ui components and shared components

3. **Maintain Consistency**: Match existing UI/UX design, naming conventions, and code style

4. **Incremental Development**: Build and test each module independently before integration

5. **Data Integrity**: Ensure all calculations match business requirements exactly

6. **Error Handling**: Implement comprehensive error handling with user-friendly messages

7. **Performance**: Optimize database queries and paginate large datasets

8. **Testing**: Test each feature thoroughly before moving to the next

### Confidence Assessment

**Confidence Level**: High (85%)

**Confidence Basis**:
- Clear architectural patterns already established in codebase
- Backend services mostly complete, reducing implementation risk
- Well-defined requirements and specifications
- Proven technology stack
- Realistic timeline with buffer for testing

**Risks**:
- Complexity of financial calculations (mitigated by thorough testing)
- Integration complexity between modules (mitigated by incremental approach)
- Performance with large datasets (mitigated by pagination and optimization)

---

## Conclusion

This comprehensive PRD provides a complete roadmap to bring InventoryPro from 70% to 100% completion with an enhanced PO receiving workflow. The implementation focuses on:

1. **Critical Business Intelligence**: Dashboard and alerts for operational visibility
2. **Financial Management**: Complete AR/AP/Expense UI for cash flow management
3. **Comprehensive Reporting**: Full business analytics and financial statements
4. **Enhanced Receiving Process**: NEW Receiving Voucher module for accurate inventory receiving with variance tracking
5. **Feature Completion**: Sales order conversion and other incomplete features

The modular approach ensures existing functionality remains intact while systematically adding missing components. All new modules follow established architectural patterns, ensuring consistency and maintainability.

### Key Enhancements with Receiving Voucher Module

The new Receiving Voucher feature provides:
- **Accurate Inventory Recording**: Track actual received quantities vs. ordered quantities
- **Variance Analysis**: Identify discrepancies for supplier performance evaluation
- **Proper Cost Control**: Create AP based on actual receipts, not estimates
- **Audit Trail**: Complete documentation of all receiving activities
- **Flexible Receiving**: Support partial deliveries and multiple shipments per PO
- **Better Decision Making**: Variance reports help identify supplier issues and improve procurement

**Revised Total Effort**: 344 hours (approximately 43 working days or 8-9 weeks with one developer)

**Expected Outcome**: A fully functional, production-ready inventory management and POS system with comprehensive business intelligence capabilities and industry-standard receiving processes that ensure inventory accuracy and proper financial controls.

---

## IMPLEMENTATION GUIDE: Receiving Voucher Module

### Step-by-Step Implementation Instructions

This section provides complete, ready-to-implement code and instructions for building the Receiving Voucher feature.

### Step 1: Database Schema Updates

**File**: `prisma/schema.prisma`

**Action**: Add the following changes to your Prisma schema:

```prisma
// 1. Update PurchaseOrder model - Add receivingStatus field and receivingVouchers relation
model PurchaseOrder {
  // ... existing fields
  receivingStatus      String?   @default("pending") // pending, partially_received, fully_received
  
  // ... existing relations
  receivingVouchers ReceivingVoucher[]
  
  // Add index
  @@index([receivingStatus])
}

// 2. Update PurchaseOrderItem model - Add receivedQuantity field
model PurchaseOrderItem {
  // ... existing fields
  receivedQuantity Decimal @default(0) @db.Decimal(10, 2)
}

// 3. Update Warehouse model - Add receivingVouchers relation
model Warehouse {
  // ... existing relations
  receivingVouchers ReceivingVoucher[]
}

// 4. Update Branch model - Add receivingVouchers relation
model Branch {
  // ... existing relations
  receivingVouchers ReceivingVoucher[]
}

// 5. Update Product model - Add receivingVoucherItems relation  
model Product {
  // ... existing relations
  receivingVoucherItems ReceivingVoucherItem[]
}

// 6. Add NEW ReceivingVoucher model
model ReceivingVoucher {
  id                  String   @id @default(uuid())
  rvNumber            String   @unique
  purchaseOrderId     String
  warehouseId         String
  branchId            String
  receiverName        String
  deliveryNotes       String?
  status              String   @default("complete")
  totalOrderedAmount  Decimal  @db.Decimal(10, 2)
  totalReceivedAmount Decimal  @db.Decimal(10, 2)
  varianceAmount      Decimal  @db.Decimal(10, 2)
  receivedDate        DateTime @default(now())
  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt

  purchaseOrder PurchaseOrder         @relation(fields: [purchaseOrderId], references: [id])
  warehouse     Warehouse             @relation(fields: [warehouseId], references: [id])
  branch        Branch                @relation(fields: [branchId], references: [id])
  items         ReceivingVoucherItem[]

  @@index([purchaseOrderId])
  @@index([warehouseId])
  @@index([branchId])
  @@index([rvNumber])
  @@index([status])
  @@index([receivedDate])
  @@index([createdAt])
}

// 7. Add NEW ReceivingVoucherItem model
model ReceivingVoucherItem {
  id                 String  @id @default(uuid())
  rvId               String
  productId          String
  orderedQuantity    Decimal @db.Decimal(10, 2)
  receivedQuantity   Decimal @db.Decimal(10, 2)
  varianceQuantity   Decimal @db.Decimal(10, 2)
  variancePercentage Decimal @db.Decimal(5, 2)
  varianceReason     String?
  unitPrice          Decimal @db.Decimal(10, 2)
  lineTotal          Decimal @db.Decimal(10, 2)

  receivingVoucher ReceivingVoucher @relation(fields: [rvId], references: [id], onDelete: Cascade)
  product          Product          @relation(fields: [productId], references: [id])

  @@index([rvId])
  @@index([productId])
}
```

**Commands to run**:
```bash
npx prisma format
npx prisma migrate dev --name add_receiving_voucher
npx prisma generate
```

### Step 2: Create Type Definitions

**File**: `types/receiving-voucher.types.ts`

```typescript
import { Prisma } from '@prisma/client';

export type ReceivingVoucher = Prisma.ReceivingVoucherGetPayload<{}>;

export type ReceivingVoucherItem = Prisma.ReceivingVoucherItemGetPayload<{}>;

export type ReceivingVoucherWithDetails = Prisma.ReceivingVoucherGetPayload<{
  include: {
    purchaseOrder: {
      include: {
        supplier: true;
      };
    };
    warehouse: true;
    branch: true;
    items: {
      include: {
        product: true;
      };
    };
  };
}>;

export interface CreateReceivingVoucherInput {
  purchaseOrderId: string;
  receiverName: string;
  deliveryNotes?: string;
  items: CreateReceivingVoucherItemInput[];
}

export interface CreateReceivingVoucherItemInput {
  productId: string;
  orderedQuantity: number;
  receivedQuantity: number;
  varianceReason?: string;
  unitPrice: number;
}

export interface ReceivingVoucherFilters {
  branchId?: string;
  warehouseId?: string;
  supplierId?: string;
  status?: string;
  startDate?: Date;
  endDate?: Date;
  rvNumber?: string;
  poNumber?: string;
}

export interface VarianceReport {
  supplierId: string;
  supplierName: string;
  totalPOs: number;
  averageVariancePercentage: number;
  overDeliveryCount: number;
  underDeliveryCount: number;
  exactMatchCount: number;
  products: ProductVariance[];
}

export interface ProductVariance {
  productId: string;
  productName: string;
  totalOrdered: number;
  totalReceived: number;
  totalVariance: number;
  varianceFrequency: number;
}

export interface BulkProcessResult {
  success: boolean;
  rvNumber?: string;
  error?: string;
}
```

### Step 3: Create Validation Schemas

**File**: `lib/validations/receiving-voucher.validation.ts`

```typescript
import { z } from 'zod';

export const receivingVoucherItemSchema = z.object({
  productId: z.string().uuid('Invalid product ID'),
  orderedQuantity: z.number().positive('Ordered quantity must be positive'),
  receivedQuantity: z.number().min(0, 'Received quantity cannot be negative'),
  varianceReason: z.string().optional(),
  unitPrice: z.number().positive('Unit price must be positive'),
});

export const createReceivingVoucherSchema = z.object({
  purchaseOrderId: z.string().uuid('Invalid purchase order ID'),
  receiverName: z.string().min(1, 'Receiver name is required').max(100, 'Receiver name too long'),
  deliveryNotes: z.string().max(500, 'Delivery notes too long').optional(),
  items: z
    .array(receivingVoucherItemSchema)
    .min(1, 'At least one item is required')
    .refine(
      (items) => items.some((item) => item.receivedQuantity > 0),
      'At least one item must have received quantity greater than zero'
    ),
});

export const receivingVoucherFiltersSchema = z.object({
  branchId: z.string().uuid().optional(),
  warehouseId: z.string().uuid().optional(),
  supplierId: z.string().uuid().optional(),
  status: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  rvNumber: z.string().optional(),
  poNumber: z.string().optional(),
});

export type CreateReceivingVoucherInput = z.infer<typeof createReceivingVoucherSchema>;
export type ReceivingVoucherFilters = z.infer<typeof receivingVoucherFiltersSchema>;
```

### Step 4: Create Repository Layer

**File**: `repositories/receiving-voucher.repository.ts`

```typescript
import { prisma } from '@/lib/prisma';
import {
  ReceivingVoucher,
  ReceivingVoucherWithDetails,
  ReceivingVoucherFilters,
} from '@/types/receiving-voucher.types';
import { Prisma } from '@prisma/client';

export class ReceivingVoucherRepository {
  async create(data: Prisma.ReceivingVoucherCreateInput): Promise<ReceivingVoucher> {
    return await prisma.receivingVoucher.create({
      data,
    });
  }

  async findById(id: string): Promise<ReceivingVoucherWithDetails | null> {
    return await prisma.receivingVoucher.findUnique({
      where: { id },
      include: {
        purchaseOrder: {
          include: {
            supplier: true,
          },
        },
        warehouse: true,
        branch: true,
        items: {
          include: {
            product: true,
          },
        },
      },
    });
  }

  async findByRVNumber(rvNumber: string): Promise<ReceivingVoucherWithDetails | null> {
    return await prisma.receivingVoucher.findUnique({
      where: { rvNumber },
      include: {
        purchaseOrder: {
          include: {
            supplier: true,
          },
        },
        warehouse: true,
        branch: true,
        items: {
          include: {
            product: true,
          },
        },
      },
    });
  }

  async findMany(filters: ReceivingVoucherFilters): Promise<ReceivingVoucherWithDetails[]> {
    const where: Prisma.ReceivingVoucherWhereInput = {};

    if (filters.branchId) {
      where.branchId = filters.branchId;
    }

    if (filters.warehouseId) {
      where.warehouseId = filters.warehouseId;
    }

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.rvNumber) {
      where.rvNumber = {
        contains: filters.rvNumber,
        mode: 'insensitive',
      };
    }

    if (filters.poNumber) {
      where.purchaseOrder = {
        poNumber: {
          contains: filters.poNumber,
          mode: 'insensitive',
        },
      };
    }

    if (filters.startDate || filters.endDate) {
      where.receivedDate = {};
      if (filters.startDate) {
        where.receivedDate.gte = filters.startDate;
      }
      if (filters.endDate) {
        where.receivedDate.lte = filters.endDate;
      }
    }

    return await prisma.receivingVoucher.findMany({
      where,
      include: {
        purchaseOrder: {
          include: {
            supplier: true,
          },
        },
        warehouse: true,
        branch: true,
        items: {
          include: {
            product: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findByPurchaseOrderId(poId: string): Promise<ReceivingVoucherWithDetails[]> {
    return await prisma.receivingVoucher.findMany({
      where: { purchaseOrderId: poId },
      include: {
        purchaseOrder: {
          include: {
            supplier: true,
          },
        },
        warehouse: true,
        branch: true,
        items: {
          include: {
            product: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async count(filters: ReceivingVoucherFilters): Promise<number> {
    const where: Prisma.ReceivingVoucherWhereInput = {};

    if (filters.branchId) {
      where.branchId = filters.branchId;
    }

    if (filters.status) {
      where.status = filters.status;
    }

    return await prisma.receivingVoucher.count({ where });
  }
}

export const receivingVoucherRepository = new ReceivingVoucherRepository();
```

### Step 5: Create Service Layer

**File**: `services/receiving-voucher.service.ts`

```typescript
import { prisma } from '@/lib/prisma';
import { receivingVoucherRepository } from '@/repositories/receiving-voucher.repository';
import { inventoryService } from '@/services/inventory.service';
import {
  CreateReceivingVoucherInput,
  ReceivingVoucherWithDetails,
  ReceivingVoucherFilters,
  VarianceReport,
} from '@/types/receiving-voucher.types';
import { NotFoundError, ValidationError } from '@/lib/errors';
import { format } from 'date-fns';

export class ReceivingVoucherService {
  /**
   * Generate unique RV number in format: RV-YYYYMMDD-XXXX
   */
  async generateRVNumber(): Promise<string> {
    const today = new Date();
    const dateStr = format(today, 'yyyyMMdd');
    const prefix = `RV-${dateStr}-`;

    // Find the last RV number for today
    const lastRV = await prisma.receivingVoucher.findFirst({
      where: {
        rvNumber: {
          startsWith: prefix,
        },
      },
      orderBy: {
        rvNumber: 'desc',
      },
    });

    let sequence = 1;
    if (lastRV) {
      const lastSequence = parseInt(lastRV.rvNumber.split('-')[2]);
      sequence = lastSequence + 1;
    }

    return `${prefix}${sequence.toString().padStart(4, '0')}`;
  }

  /**
   * Create receiving voucher from purchase order
   */
  async createReceivingVoucher(
    data: CreateReceivingVoucherInput
  ): Promise<ReceivingVoucherWithDetails> {
    return await prisma.$transaction(async (tx) => {
      // 1. Get PO with items and related data
      const po = await tx.purchaseOrder.findUnique({
        where: { id: data.purchaseOrderId },
        include: {
          items: {
            include: {
              product: true,
            },
          },
          supplier: true,
          warehouse: true,
          branch: true,
        },
      });

      if (!po) {
        throw new NotFoundError('Purchase Order');
      }

      // 2. Validate PO status
      if (po.status !== 'ordered') {
        throw new ValidationError('Invalid purchase order status', {
          status: 'Purchase order must be in ordered status',
        });
      }

      // 3. Validate at least one item has received quantity > 0
      const hasReceivedItems = data.items.some((item) => item.receivedQuantity > 0);
      if (!hasReceivedItems) {
        throw new ValidationError('No items received', {
          items: 'At least one item must have received quantity greater than zero',
        });
      }

      // 4. Generate RV number
      const rvNumber = await this.generateRVNumber();

      // 5. Calculate totals and variances
      let totalOrderedAmount = 0;
      let totalReceivedAmount = 0;

      const processedItems = data.items.map((item) => {
        const orderedQty = Number(item.orderedQuantity);
        const receivedQty = Number(item.receivedQuantity);
        const unitPrice = Number(item.unitPrice);

        const varianceQty = receivedQty - orderedQty;
        const variancePercentage =
          orderedQty > 0 ? (varianceQty / orderedQty) * 100 : 0;
        const lineTotal = receivedQty * unitPrice;

        totalOrderedAmount += orderedQty * unitPrice;
        totalReceivedAmount += lineTotal;

        return {
          productId: item.productId,
          orderedQuantity: orderedQty,
          receivedQuantity: receivedQty,
          varianceQuantity: varianceQty,
          variancePercentage: Number(variancePercentage.toFixed(2)),
          varianceReason: item.varianceReason || null,
          unitPrice: unitPrice,
          lineTotal: Number(lineTotal.toFixed(2)),
        };
      });

      const varianceAmount = totalReceivedAmount - totalOrderedAmount;

      // 6. Create ReceivingVoucher
      const rv = await tx.receivingVoucher.create({
        data: {
          rvNumber,
          purchaseOrderId: po.id,
          warehouseId: po.warehouseId,
          branchId: po.branchId,
          receiverName: data.receiverName,
          deliveryNotes: data.deliveryNotes,
          status: 'complete',
          totalOrderedAmount: Number(totalOrderedAmount.toFixed(2)),
          totalReceivedAmount: Number(totalReceivedAmount.toFixed(2)),
          varianceAmount: Number(varianceAmount.toFixed(2)),
          items: {
            create: processedItems,
          },
        },
        include: {
          items: true,
        },
      });

      // 7. Create inventory batches for received quantities
      for (const item of processedItems) {
        if (item.receivedQuantity > 0) {
          const product = po.items.find((p) => p.productId === item.productId)?.product;
          if (!product) continue;

          // Add stock using inventory service
          await inventoryService.addStock({
            productId: item.productId,
            warehouseId: po.warehouseId,
            quantity: item.receivedQuantity,
            uom: product.baseUOM,
            unitCost: item.unitPrice,
            referenceId: rv.id,
            referenceType: 'RV',
            reason: `Received from RV ${rvNumber} (PO ${po.poNumber})`,
          });

          // Update PO item received quantity
          const poItem = po.items.find((p) => p.productId === item.productId);
          if (poItem) {
            await tx.purchaseOrderItem.update({
              where: { id: poItem.id },
              data: {
                receivedQuantity: {
                  increment: item.receivedQuantity,
                },
              },
            });
          }
        }
      }

      // 8. Update PO receiving status
      const updatedPOItems = await tx.purchaseOrderItem.findMany({
        where: { poId: po.id },
      });

      const allItemsFullyReceived = updatedPOItems.every(
        (item) => Number(item.receivedQuantity) >= Number(item.quantity)
      );
      const someItemsReceived = updatedPOItems.some(
        (item) => Number(item.receivedQuantity) > 0
      );

      let receivingStatus = 'pending';
      if (allItemsFullyReceived) {
        receivingStatus = 'fully_received';
      } else if (someItemsReceived) {
        receivingStatus = 'partially_received';
      }

      await tx.purchaseOrder.update({
        where: { id: po.id },
        data: {
          receivingStatus,
          status: allItemsFullyReceived ? 'received' : po.status,
          actualDeliveryDate: allItemsFullyReceived ? new Date() : po.actualDeliveryDate,
        },
      });

      // 9. Create Accounts Payable for received amount
      if (totalReceivedAmount > 0 && allItemsFullyReceived) {
        const dueDate = this.calculateDueDate(po.supplier.paymentTerms, new Date());

        await tx.accountsPayable.create({
          data: {
            branchId: po.branchId,
            supplierId: po.supplierId,
            purchaseOrderId: po.id,
            totalAmount: Number(totalReceivedAmount.toFixed(2)),
            paidAmount: 0,
            balance: Number(totalReceivedAmount.toFixed(2)),
            dueDate,
            status: 'pending',
          },
        });
      }

      // 10. Return created RV with details
      const createdRV = await tx.receivingVoucher.findUnique({
        where: { id: rv.id },
        include: {
          purchaseOrder: {
            include: {
              supplier: true,
            },
          },
          warehouse: true,
          branch: true,
          items: {
            include: {
              product: true,
            },
          },
        },
      });

      return createdRV!;
    });
  }

  /**
   * Calculate due date based on payment terms
   */
  private calculateDueDate(paymentTerms: string, fromDate: Date): Date {
    const dueDate = new Date(fromDate);

    switch (paymentTerms) {
      case 'Net 15':
        dueDate.setDate(dueDate.getDate() + 15);
        break;
      case 'Net 30':
        dueDate.setDate(dueDate.getDate() + 30);
        break;
      case 'Net 60':
        dueDate.setDate(dueDate.getDate() + 60);
        break;
      case 'COD':
        // Due immediately
        break;
      default:
        dueDate.setDate(dueDate.getDate() + 30);
    }

    return dueDate;
  }

  /**
   * Get receiving voucher by ID
   */
  async getReceivingVoucherById(id: string): Promise<ReceivingVoucherWithDetails> {
    const rv = await receivingVoucherRepository.findById(id);

    if (!rv) {
      throw new NotFoundError('Receiving Voucher');
    }

    return rv;
  }

  /**
   * Get receiving voucher by RV number
   */
  async getReceivingVoucherByNumber(rvNumber: string): Promise<ReceivingVoucherWithDetails> {
    const rv = await receivingVoucherRepository.findByRVNumber(rvNumber);

    if (!rv) {
      throw new NotFoundError('Receiving Voucher');
    }

    return rv;
  }

  /**
   * List receiving vouchers with filters
   */
  async listReceivingVouchers(
    filters: ReceivingVoucherFilters
  ): Promise<ReceivingVoucherWithDetails[]> {
    return await receivingVoucherRepository.findMany(filters);
  }

  /**
   * Get receiving vouchers for a purchase order
   */
  async getReceivingVouchersByPO(poId: string): Promise<ReceivingVoucherWithDetails[]> {
    return await receivingVoucherRepository.findByPurchaseOrderId(poId);
  }

  /**
   * Generate variance report
   */
  async generateVarianceReport(
    filters: Pick<ReceivingVoucherFilters, 'branchId' | 'startDate' | 'endDate'>
  ): Promise<VarianceReport[]> {
    const rvs = await receivingVoucherRepository.findMany(filters);

    // Group by supplier
    const supplierMap = new Map<string, VarianceReport>();

    for (const rv of rvs) {
      const supplierId = rv.purchaseOrder.supplier.id;
      const supplierName = rv.purchaseOrder.supplier.companyName;

      if (!supplierMap.has(supplierId)) {
        supplierMap.set(supplierId, {
          supplierId,
          supplierName,
          totalPOs: 0,
          averageVariancePercentage: 0,
          overDeliveryCount: 0,
          underDeliveryCount: 0,
          exactMatchCount: 0,
          products: [],
        });
      }

      const report = supplierMap.get(supplierId)!;
      report.totalPOs++;

      // Analyze variance
      for (const item of rv.items) {
        const variance = Number(item.varianceQuantity);

        if (variance > 0) {
          report.overDeliveryCount++;
        } else if (variance < 0) {
          report.underDeliveryCount++;
        } else {
          report.exactMatchCount++;
        }

        // Track product variances
        const existingProduct = report.products.find(
          (p) => p.productId === item.productId
        );

        if (existingProduct) {
          existingProduct.totalOrdered += Number(item.orderedQuantity);
          existingProduct.totalReceived += Number(item.receivedQuantity);
          existingProduct.totalVariance += variance;
          existingProduct.varianceFrequency++;
        } else {
          report.products.push({
            productId: item.productId,
            productName: item.product.name,
            totalOrdered: Number(item.orderedQuantity),
            totalReceived: Number(item.receivedQuantity),
            totalVariance: variance,
            varianceFrequency: 1,
          });
        }
      }
    }

    // Calculate average variance percentage per supplier
    const reports = Array.from(supplierMap.values());
    for (const report of reports) {
      const totalItems =
        report.overDeliveryCount + report.underDeliveryCount + report.exactMatchCount;
      const totalVarianceItems = report.overDeliveryCount + report.underDeliveryCount;

      report.averageVariancePercentage =
        totalItems > 0 ? Number(((totalVarianceItems / totalItems) * 100).toFixed(2)) : 0;
    }

    return reports;
  }
}

export const receivingVoucherService = new ReceivingVoucherService();
```

### Step 6: Create API Routes

**File 1**: `app/api/receiving-vouchers/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { receivingVoucherService } from '@/services/receiving-voucher.service';
import { createReceivingVoucherSchema, receivingVoucherFiltersSchema } from '@/lib/validations/receiving-voucher.validation';
import { AppError } from '@/lib/errors';

// POST /api/receiving-vouchers - Create receiving voucher
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input
    const validatedData = createReceivingVoucherSchema.parse(body);

    // Create receiving voucher
    const rv = await receivingVoucherService.createReceivingVoucher(validatedData);

    return NextResponse.json({
      success: true,
      data: rv,
      message: `Receiving voucher ${rv.rvNumber} created successfully. ${rv.items.filter(i => i.receivedQuantity > 0).length} inventory batches created.`,
    });
  } catch (error) {
    console.error('Error creating receiving voucher:', error);

    if (error instanceof AppError) {
      return NextResponse.json(
        { success: false, error: error.message, fields: (error as any).fields },
        { status: error.statusCode }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to create receiving voucher' },
      { status: 500 }
    );
  }
}

// GET /api/receiving-vouchers - List receiving vouchers
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const filters = {
      branchId: searchParams.get('branchId') || undefined,
      warehouseId: searchParams.get('warehouseId') || undefined,
      supplierId: searchParams.get('supplierId') || undefined,
      status: searchParams.get('status') || undefined,
      startDate: searchParams.get('startDate') || undefined,
      endDate: searchParams.get('endDate') || undefined,
      rvNumber: searchParams.get('rvNumber') || undefined,
      poNumber: searchParams.get('poNumber') || undefined,
    };

    // Validate filters
    const validatedFilters = receivingVoucherFiltersSchema.parse(filters);

    // Convert date strings to Date objects if provided
    const processedFilters = {
      ...validatedFilters,
      startDate: validatedFilters.startDate ? new Date(validatedFilters.startDate) : undefined,
      endDate: validatedFilters.endDate ? new Date(validatedFilters.endDate) : undefined,
    };

    const rvs = await receivingVoucherService.listReceivingVouchers(processedFilters);

    return NextResponse.json({
      success: true,
      data: rvs,
    });
  } catch (error) {
    console.error('Error fetching receiving vouchers:', error);

    if (error instanceof AppError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: error.statusCode }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to fetch receiving vouchers' },
      { status: 500 }
    );
  }
}
```

**File 2**: `app/api/receiving-vouchers/[id]/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { receivingVoucherService } from '@/services/receiving-voucher.service';
import { AppError } from '@/lib/errors';

// GET /api/receiving-vouchers/[id] - Get single receiving voucher
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const rv = await receivingVoucherService.getReceivingVoucherById(id);

    return NextResponse.json({
      success: true,
      data: rv,
    });
  } catch (error) {
    console.error('Error fetching receiving voucher:', error);

    if (error instanceof AppError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: error.statusCode }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to fetch receiving voucher' },
      { status: 500 }
    );
  }
}
```

**File 3**: `app/api/purchase-orders/[id]/receiving-vouchers/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { receivingVoucherService } from '@/services/receiving-voucher.service';
import { AppError } from '@/lib/errors';

// GET /api/purchase-orders/[id]/receiving-vouchers - Get RVs for a PO
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const rvs = await receivingVoucherService.getReceivingVouchersByPO(id);

    return NextResponse.json({
      success: true,
      data: rvs,
    });
  } catch (error) {
    console.error('Error fetching receiving vouchers for PO:', error);

    if (error instanceof AppError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: error.statusCode }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to fetch receiving vouchers' },
      { status: 500 }
    );
  }
}
```

**File 4**: `app/api/reports/receiving-variance/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { receivingVoucherService } from '@/services/receiving-voucher.service';
import { AppError } from '@/lib/errors';

// GET /api/reports/receiving-variance - Generate variance report
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const filters = {
      branchId: searchParams.get('branchId') || undefined,
      startDate: searchParams.get('startDate')
        ? new Date(searchParams.get('startDate')!)
        : undefined,
      endDate: searchParams.get('endDate')
        ? new Date(searchParams.get('endDate')!)
        : undefined,
    };

    const report = await receivingVoucherService.generateVarianceReport(filters);

    return NextResponse.json({
      success: true,
      data: report,
    });
  } catch (error) {
    console.error('Error generating variance report:', error);

    if (error instanceof AppError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: error.statusCode }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to generate variance report' },
      { status: 500 }
    );
  }
}
```

### Step 7: Create React Hooks

**File**: `hooks/use-receiving-vouchers.ts`

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  ReceivingVoucherWithDetails,
  CreateReceivingVoucherInput,
  ReceivingVoucherFilters,
  VarianceReport,
} from '@/types/receiving-voucher.types';

// Fetch all receiving vouchers with filters
export function useReceivingVouchers(filters?: ReceivingVoucherFilters) {
  return useQuery({
    queryKey: ['receiving-vouchers', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.branchId) params.append('branchId', filters.branchId);
      if (filters?.warehouseId) params.append('warehouseId', filters.warehouseId);
      if (filters?.supplierId) params.append('supplierId', filters.supplierId);
      if (filters?.status) params.append('status', filters.status);
      if (filters?.startDate) params.append('startDate', filters.startDate.toISOString());
      if (filters?.endDate) params.append('endDate', filters.endDate.toISOString());
      if (filters?.rvNumber) params.append('rvNumber', filters.rvNumber);
      if (filters?.poNumber) params.append('poNumber', filters.poNumber);

      const response = await fetch(`/api/receiving-vouchers?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch receiving vouchers');
      const data = await response.json();
      return data.data as ReceivingVoucherWithDetails[];
    },
  });
}

// Fetch single receiving voucher by ID
export function useReceivingVoucherDetail(id: string | undefined) {
  return useQuery({
    queryKey: ['receiving-voucher', id],
    queryFn: async () => {
      if (!id) throw new Error('ID is required');
      const response = await fetch(`/api/receiving-vouchers/${id}`);
      if (!response.ok) throw new Error('Failed to fetch receiving voucher');
      const data = await response.json();
      return data.data as ReceivingVoucherWithDetails;
    },
    enabled: !!id,
  });
}

// Fetch receiving vouchers for a purchase order
export function usePOReceivingVouchers(poId: string | undefined) {
  return useQuery({
    queryKey: ['po-receiving-vouchers', poId],
    queryFn: async () => {
      if (!poId) throw new Error('PO ID is required');
      const response = await fetch(`/api/purchase-orders/${poId}/receiving-vouchers`);
      if (!response.ok) throw new Error('Failed to fetch receiving vouchers');
      const data = await response.json();
      return data.data as ReceivingVoucherWithDetails[];
    },
    enabled: !!poId,
  });
}

// Fetch variance report
export function useVarianceReport(filters?: Pick<ReceivingVoucherFilters, 'branchId' | 'startDate' | 'endDate'>) {
  return useQuery({
    queryKey: ['variance-report', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.branchId) params.append('branchId', filters.branchId);
      if (filters?.startDate) params.append('startDate', filters.startDate.toISOString());
      if (filters?.endDate) params.append('endDate', filters.endDate.toISOString());

      const response = await fetch(`/api/reports/receiving-variance?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch variance report');
      const data = await response.json();
      return data.data as VarianceReport[];
    },
  });
}

// Create receiving voucher mutation
export function useCreateReceivingVoucher() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateReceivingVoucherInput) => {
      const response = await fetch('/api/receiving-vouchers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create receiving voucher');
      }

      return data;
    },
    onSuccess: (data) => {
      toast.success(data.message || 'Receiving voucher created successfully');
      queryClient.invalidateQueries({ queryKey: ['receiving-vouchers'] });
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create receiving voucher');
    },
  });
}
```

### Step 8: Quick Implementation Checklist

**Complete these steps in order to implement the Receiving Voucher feature**:

#### Phase 1: Backend Foundation (Day 1)
1. ✅ Update `prisma/schema.prisma` with new models and fields
2. ✅ Run `npx prisma migrate dev --name add_receiving_voucher`
3. ✅ Run `npx prisma generate`
4. ✅ Create `types/receiving-voucher.types.ts`
5. ✅ Create `lib/validations/receiving-voucher.validation.ts`
6. ✅ Create `repositories/receiving-voucher.repository.ts`
7. ✅ Create `services/receiving-voucher.service.ts`

#### Phase 2: API Layer (Day 2)
8. ✅ Create `app/api/receiving-vouchers/route.ts`
9. ✅ Create `app/api/receiving-vouchers/[id]/route.ts`
10. ✅ Create `app/api/purchase-orders/[id]/receiving-vouchers/route.ts`
11. ✅ Create `app/api/reports/receiving-variance/route.ts`
12. ✅ Test all API endpoints with Postman or Thunder Client

#### Phase 3: Frontend Hooks & Components (Days 3-4)
13. ✅ Create `hooks/use-receiving-vouchers.ts`
14. ✅ Create `components/receiving-vouchers/receiving-voucher-dialog.tsx` (Main creation dialog)
15. ✅ Create `components/receiving-vouchers/receiving-voucher-items-table.tsx` (Editable items table)
16. ✅ Create `components/receiving-vouchers/variance-indicator.tsx` (Color-coded variance display)
17. ✅ Create `components/receiving-vouchers/receiving-voucher-table.tsx` (List table)
18. ✅ Update `app/(dashboard)/purchase-orders/[id]/page.tsx` to add RV creation button

#### Phase 4: Pages & Integration (Day 5)
19. ✅ Create `app/(dashboard)/receiving-vouchers/page.tsx` (List page)
20. ✅ Create `app/(dashboard)/receiving-vouchers/[id]/page.tsx` (Detail page)
21. ✅ Add navigation link in sidebar for Receiving Vouchers
22. ✅ Update PO detail page to show RV history
23. ✅ Test complete workflow end-to-end

#### Phase 5: Variance Reporting (Day 6)
24. ✅ Create variance report component in reports module
25. ✅ Add CSV export functionality
26. ✅ Test variance calculations
27. ✅ Document user guide

### Key Files Summary

**New Files to Create** (Total: 20 files):

```
types/receiving-voucher.types.ts
lib/validations/receiving-voucher.validation.ts
repositories/receiving-voucher.repository.ts
services/receiving-voucher.service.ts
app/api/receiving-vouchers/route.ts
app/api/receiving-vouchers/[id]/route.ts
app/api/purchase-orders/[id]/receiving-vouchers/route.ts
app/api/reports/receiving-variance/route.ts
hooks/use-receiving-vouchers.ts
components/receiving-vouchers/receiving-voucher-dialog.tsx
components/receiving-vouchers/receiving-voucher-items-table.tsx
components/receiving-vouchers/variance-indicator.tsx
components/receiving-vouchers/receiving-voucher-table.tsx
components/receiving-vouchers/receiving-voucher-detail.tsx
app/(dashboard)/receiving-vouchers/page.tsx
app/(dashboard)/receiving-vouchers/[id]/page.tsx
```

**Files to Modify** (Total: 3 files):

```
prisma/schema.prisma (Add ReceivingVoucher and ReceivingVoucherItem models)
app/(dashboard)/purchase-orders/[id]/page.tsx (Add "Create RV" button)
components/shared/sidebar.tsx (Add navigation link)
```

### Testing Checklist

**Test Scenarios**:

1. ✅ Create RV with exact quantities (all items match ordered)
2. ✅ Create RV with under-delivery (some items received less)
3. ✅ Create RV with over-delivery (some items received more)
4. ✅ Create RV with partial delivery (some items zero quantity)
5. ✅ Create RV with variance reasons documented
6. ✅ Verify inventory batches created correctly
7. ✅ Verify PO status updates (partially_received, fully_received)
8. ✅ Verify AP created with correct amount (based on received, not ordered)
9. ✅ Verify multiple RVs can be created for one PO
10. ✅ Verify variance report calculations
11. ✅ Test RV list filtering and search
12. ✅ Test RV detail view and print functionality

### Database Migration Preview

After running the migration, your database will have:

**New Tables**:
- `ReceivingVoucher` (tracks receiving vouchers)
- `ReceivingVoucherItem` (tracks line items with variances)

**Updated Tables**:
- `PurchaseOrder` (added `receivingStatus` field)
- `PurchaseOrderItem` (added `receivedQuantity` field)

**New Indexes**:
- `receivingStatus` on PurchaseOrder
- `rvNumber` on ReceivingVoucher
- Multiple composite indexes for performance

### Expected Business Impact

**Inventory Accuracy**:
- Track actual receipts vs. orders
- Reduce inventory discrepancies by 60-80%
- Better COGS accuracy

**Financial Control**:
- Pay only for what was received
- Identify supplier billing errors
- Reduce financial losses from discrepancies

**Supplier Management**:
- Data-driven supplier performance evaluation
- Identify unreliable suppliers
- Negotiate better terms based on variance data

**Operational Efficiency**:
- Faster receiving process with variance documentation
- Complete audit trail for compliance
- Better inventory planning with actual delivery data

---

## END OF IMPLEMENTATION GUIDE

The complete Receiving Voucher feature implementation guide is now in this design document. Follow the steps sequentially, and you'll have a fully functional receiving voucher system integrated with your InventoryPro application.

**Next Steps**:
1. Start with Phase 1 (Backend Foundation)
2. Test each layer before moving to the next
3. Use the provided code as-is or adapt to your specific needs
4. Reference the design document for business logic details

Good luck with the implementation! 🚀
