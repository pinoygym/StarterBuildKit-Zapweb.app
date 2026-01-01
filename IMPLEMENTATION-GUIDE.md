# Implementation Guide for Remaining Tasks

## Summary of Completed Work

### ✅ Completed Tasks (Tasks 1-11.8)
- Project setup and infrastructure
- All core modules (Products, Inventory, Warehouses, Branches, Suppliers)
- Purchase Orders and Sales Orders 
- POS system with sales order conversion (including bulk conversion)
- Database schema with all models (AR, AP, Expense, etc.)

### 🔄 In Progress - Backend Foundation Created

#### Task 12: Accounts Receivable (AR) Module
**Completed:**
- ✅ types/ar.types.ts - All TypeScript interfaces
- ✅ repositories/ar.repository.ts - Database operations
- ✅ services/ar.service.ts - Business logic including aging reports

**Remaining:**
1. Create API routes in `app/api/ar/`
2. Create UI components in `components/ar/`
3. Build AR list page in `app/(dashboard)/ar-ap/page.tsx`
4. Create AR payment recording dialog

#### Task 13: Accounts Payable (AP) Module  
**Completed:**
- ✅ types/ap.types.ts - All TypeScript interfaces
- ✅ repositories/ap.repository.ts - Database operations
- ✅ services/ap.service.ts - Business logic including aging reports

**Remaining:**
1. Create API routes in `app/api/ap/`
2. Create UI components in `components/ap/`
3. Build AP list page (can share page with AR at `ar-ap/page.tsx`)
4. Create AP payment recording dialog

#### Task 14: Expense Management Module
**Completed:**
- ✅ types/expense.types.ts - All TypeScript interfaces
- ✅ repositories/expense.repository.ts - Database operations
- ✅ services/expense.service.ts - Business logic including category/vendor reports

**Remaining:**
1. Create API routes in `app/api/expenses/`
2. Create UI components in `components/expenses/`
3. Build expense list page in `app/(dashboard)/expenses/page.tsx`
4. Create expense create/edit dialog
5. Implement expense reports (by category, by vendor)

### 📋 Not Started - High Priority Tasks

#### Task 15: Alert System
**Required Implementation:**

1. **Create alert types** (`types/alert.types.ts`):
   - Alert interface with type, severity, product, warehouse, details
   - AlertType: 'low_stock' | 'expiring_soon' | 'expired'
   - AlertSeverity: 'warning' | 'critical'

2. **Create alert service** (`services/alert.service.ts`):
   ```typescript
   - generateAlerts(branchId?: string)
   - getLowStockAlerts()
   - getExpiringSoonAlerts() // 30 days
   - getExpiredAlerts()
   - getAlertCounts()
   ```

3. **Create API route** (`app/api/alerts/route.ts`):
   - GET /api/alerts - Fetch all alerts with filters
   - GET /api/alerts/counts - Get counts by type

4. **Build alerts page** (`app/(dashboard)/alerts/page.tsx`):
   - Alert list with filters (type, severity, branch)
   - Color-coded severity badges
   - Action buttons (Reorder, View Inventory)

#### Task 16: Dashboard and Analytics
**Required Implementation:**

1. **Create dashboard types** (`types/dashboard.types.ts`):
   - DashboardKPIs interface
   - TopProduct, WarehouseUtil, BranchComparison interfaces

2. **Create dashboard service** (`services/dashboard.service.ts`):
   ```typescript
   - getKPIs(branchId?: string)
   - getTopSellingProducts(limit: number)
   - getWarehouseUtilization()
   - getBranchComparison()
   ```

3. **Create API routes** (`app/api/dashboard/`):
   - GET /api/dashboard/kpis
   - GET /api/dashboard/top-products
   - GET /api/dashboard/warehouse-utilization
   - GET /api/dashboard/branch-comparison

4. **Build dashboard page** (`app/(dashboard)/dashboard/page.tsx`):
   - KPI cards (products, stock, inventory value, sales, AR, AP, expenses)
   - Top selling products widget
   - Warehouse utilization chart
   - Alert summary widget  
   - Branch comparison table

#### Task 17: Reporting Module
**Required Implementation:**

1. **Create report types** (`types/report.types.ts`):
   - InventoryReport, SalesReport, ProcurementReport interfaces
   - FinancialStatements (P&L, Cash Flow, Balance Sheet)

2. **Create report service** (`services/report.service.ts`):
   ```typescript
   - generateInventoryReport()
   - generateSalesReport()
   - generateProfitLossStatement()
   - generateCashFlowStatement()
   - generateBalanceSheet()
   ```

3. **Create API routes** (`app/api/reports/`):
   - GET /api/reports/inventory/stock-levels
   - GET /api/reports/sales/pos-sales
   - GET /api/reports/financial/profit-loss
   - etc.

4. **Build reports page** (`app/(dashboard)/reports/page.tsx`):
   - Report type selector (tabs)
   - Date range filters
   - Branch filters
   - Export to CSV functionality
   - Display reports in tables/charts

---

## Quick Implementation Steps

### For AR/AP/Expense Pages:

1. **Create API Route Template:**
```typescript
// app/api/ar/route.ts (similar for AP, Expense)
import { NextResponse } from 'next/server';
import { arService } from '@/services/ar.service';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const branchId = searchParams.get('branchId') || undefined;
    const status = searchParams.get('status') || undefined;
    
    const records = await arService.getAllAR({ branchId, status });
    
    return NextResponse.json({ success: true, data: records });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const record = await arService.createAR(body);
    
    return NextResponse.json({ success: true, data: record });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 400 }
    );
  }
}
```

2. **Create payment recording API:**
```typescript
// app/api/ar/[id]/payment/route.ts
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const updated = await arService.recordPayment({
      arId: params.id,
      ...body,
    });
    
    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 400 }
    );
  }
}
```

3. **Create list page using existing patterns:**
   - Follow the pattern in `app/(dashboard)/products/page.tsx`
   - Use similar table structure from `components/products/product-table.tsx`
   - Add status badges, aging indicators (color coding)
   - Include payment recording dialog

### For Alerts:

1. **Alert Service Logic:**
```typescript
async generateAlerts(branchId?: string) {
  // Low stock: compare current stock with minStockLevel
  const lowStock = await prisma.product.findMany({
    where: { 
      status: 'active',
      inventoryBatches: {
        some: {
          warehouse: branchId ? { branchId } : undefined
        }
      }
    },
    include: { inventoryBatches: true }
  });
  
  // Filter products where sum(batches.quantity) < minStockLevel
  
  // Expiring soon: expiryDate between today and today+30
  const expiringSoon = await prisma.inventoryBatch.findMany({
    where: {
      status: 'active',
      expiryDate: {
        gte: new Date(),
        lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      }
    }
  });
  
  // Expired: expiryDate < today
  const expired = await prisma.inventoryBatch.findMany({
    where: {
      status: 'active',
      expiryDate: { lt: new Date() }
    }
  });
  
  return { lowStock, expiringSoon, expired };
}
```

### For Dashboard:

1. **Aggregate data from existing services:**
```typescript
async getKPIs(branchId?: string) {
  // Use existing services
  const products = await productRepository.findAll({ status: 'active' });
  const arSummary = await arService.getSummary(branchId);
  const apSummary = await apService.getSummary(branchId);
  const expenseSummary = await expenseService.getSummary(branchId);
  
  // Calculate inventory value using weighted average
  // Get today's POS sales
  // etc.
  
  return {
    totalProducts: products.length,
    totalStock: calculateTotalStock(),
    inventoryValue: calculateInventoryValue(),
    outstandingAR: arSummary.totals.balance,
    outstandingAP: apSummary.totals.balance,
    monthExpenses: expenseSummary.totalAmount,
    // ... more KPIs
  };
}
```

2. **Use Chart library for visualizations:**
   - Install Recharts if needed: `npm install recharts`
   - Create simple bar/line charts for trends
   - Follow shadcn/ui patterns for cards

### For Reports:

1. **Reuse existing queries:**
   - Inventory reports: Use `inventoryRepository` methods
   - Sales reports: Query POS sales with aggregations
   - Financial reports: Combine AR, AP, Expense data

2. **Export to CSV:**
```typescript
const exportToCSV = (data: any[], filename: string) => {
  const csvContent = convertToCSV(data);
  const blob = new Blob([csvContent], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
};
```

---

## File Structure Summary

```
app/
├── api/
│   ├── ar/
│   │   ├── route.ts          [CREATE]
│   │   ├── [id]/
│   │   │   ├── route.ts      [CREATE]
│   │   │   └── payment/
│   │   │       └── route.ts  [CREATE]
│   │   └── aging-report/
│   │       └── route.ts      [CREATE]
│   ├── ap/                   [CREATE - similar to AR]
│   ├── expenses/             [CREATE]
│   ├── alerts/               [CREATE]
│   ├── dashboard/            [CREATE]
│   └── reports/              [CREATE]
│
├── (dashboard)/
│   ├── ar-ap/
│   │   └── page.tsx          [UPDATE - combine AR/AP]
│   ├── expenses/
│   │   └── page.tsx          [UPDATE]
│   ├── alerts/
│   │   └── page.tsx          [UPDATE]
│   ├── dashboard/
│   │   └── page.tsx          [UPDATE]
│   └── reports/
│       └── page.tsx          [UPDATE]

components/
├── ar/                       [CREATE]
│   ├── ar-table.tsx
│   └── ar-payment-dialog.tsx
├── ap/                       [CREATE]
│   ├── ap-table.tsx
│   └── ap-payment-dialog.tsx
├── expenses/                 [CREATE]
│   ├── expense-table.tsx
│   ├── expense-dialog.tsx
│   └── expense-reports.tsx
├── alerts/                   [CREATE]
│   └── alert-table.tsx
├── dashboard/                [CREATE]
│   ├── kpi-cards.tsx
│   ├── top-products.tsx
│   ├── warehouse-utilization.tsx
│   └── alert-summary.tsx
└── reports/                  [CREATE]
    ├── inventory-reports.tsx
    ├── sales-reports.tsx
    └── financial-reports.tsx

services/              
├── ar.service.ts             ✅ DONE
├── ap.service.ts             ✅ DONE
├── expense.service.ts        ✅ DONE
├── alert.service.ts          [CREATE]
├── dashboard.service.ts      [CREATE]
└── report.service.ts         [CREATE]

repositories/
├── ar.repository.ts          ✅ DONE
├── ap.repository.ts          ✅ DONE
├── expense.repository.ts     ✅ DONE
├── alert.repository.ts       [CREATE - if needed]
└── dashboard.repository.ts   [CREATE - if needed]

types/
├── ar.types.ts               ✅ DONE
├── ap.types.ts               ✅ DONE
├── expense.types.ts          ✅ DONE
├── alert.types.ts            [CREATE]
├── dashboard.types.ts        [CREATE]
└── report.types.ts           [CREATE]
```

---

## Testing the Implementation

1. **Test AR/AP workflow:**
   - Create AR record manually via API
   - Record payment via payment API
   - Verify balance updates correctly
   - Check aging report generation

2. **Test Expenses:**
   - Create expenses in different categories
   - View expense by category report
   - Filter by date range and branch

3. **Test Alerts:**
   - Verify low stock detection
   - Create batches expiring within 30 days
   - Check expired batch detection

4. **Test Dashboard:**
   - Verify all KPIs calculate correctly
   - Check branch filtering
   - Test data refresh

## Priority Order

1. **High Priority (Core Functionality):**
   - Alerts system (impacts operations)
   - Dashboard KPIs (business visibility)
   - AR/AP pages (financial tracking)

2. **Medium Priority:**
   - Expense management
   - Basic reports

3. **Low Priority (Enhancements):**
   - Advanced reports
   - Chart visualizations
   - Export features

## Notes

- All database models already exist in Prisma schema
- Repository and service layer complete for AR, AP, Expenses
- Follow existing patterns from Products, POS, Sales Orders modules
- Use shadcn/ui components for consistency
- Implement proper error handling with toast notifications
- Add loading states with skeleton loaders
- Use branch context for filtering
