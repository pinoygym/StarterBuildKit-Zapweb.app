# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**InventoryPro** is a comprehensive inventory management and Point of Sale (POS) system designed for soft drinks wholesale delivery companies in the Philippines. Built with Next.js 15 (App Router), TypeScript, and Neon PostgreSQL.

## Tech Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript (strict mode)
- **UI**: React 19, Tailwind CSS v4, shadcn/ui components
- **Database**: Neon PostgreSQL (Serverless) via Prisma ORM
- **Validation**: Zod schemas
- **State Management**: Zustand, TanStack Query (React Query)
- **Authentication**: JWT with HTTP-only cookies
- **Testing**: Vitest (unit/integration), Playwright (E2E)

## Common Development Commands

### Development & Build
```bash
npm run dev                    # Start development server at localhost:3000
npm run build                  # Build for production
npm start                      # Start production server
npm run lint                   # Run ESLint
npm run type-check            # Run TypeScript compiler without emitting
```

### Database Operations
```bash
npx prisma generate           # Generate Prisma client (after schema changes)
npx prisma migrate dev        # Run migrations in development
npx prisma studio             # Open Prisma Studio GUI for database management
npx prisma db seed            # Seed database with initial data
npx prisma migrate deploy     # Deploy migrations in production
```

### Testing
```bash
npm run test                  # Run unit tests with Vitest
npm run test:watch            # Run tests in watch mode
npm run test:ui               # Run tests with Vitest UI
npm run test:coverage         # Generate test coverage report
npm run test:unit             # Run unit tests only (tests/unit)
npm run test:integration      # Run integration tests only (tests/integration)
npm run test:e2e              # Run E2E tests with Playwright
npm run test:e2e:ui           # Run E2E tests with Playwright UI
npm run test:all              # Run all tests (unit, integration, E2E)
```

## Project Architecture

### Layered Architecture Pattern

This project follows a **strict layered architecture** with clear separation of concerns:

```
API Routes → Services → Repositories → Prisma → Database
     ↓          ↓            ↓
 Validation  Business     Data Access
            Logic         Layer
```

1. **API Routes** (`app/api/**/*.ts`): HTTP endpoints, request/response handling
2. **Services** (`services/*.service.ts`): Business logic, validation, error handling
3. **Repositories** (`repositories/*.repository.ts`): Data access layer, Prisma queries
4. **Types** (`types/*.types.ts`): TypeScript interfaces and type definitions
5. **Validations** (`lib/validations/*.validation.ts`): Zod schemas for input validation

### Key Architectural Principles

- **Repository Pattern**: All database operations are abstracted in repositories
- **Service Layer**: Business logic is centralized in services, never in API routes or components
- **Validation**: Zod schemas validate all inputs before processing
- **Error Handling**: Custom error classes (`ValidationError`, `NotFoundError`) with standardized responses
- **Type Safety**: Strong typing throughout with shared TypeScript interfaces

### Multi-UOM and Batch Tracking System

The inventory system uses **weighted average costing** with batch tracking:

- Products have a base UOM and optional alternate UOMs with conversion factors
- Inventory is tracked in batches with expiry dates, batch numbers, and weighted average costs
- Stock movements are recorded with batch associations for full traceability
- All quantity calculations account for UOM conversions

### Authentication & Authorization

- **JWT-based authentication** with HTTP-only cookies (24-hour expiration)
- **Session management**: Database-backed sessions for token revocation
- **Role-based access control (RBAC)**: 5 system roles (Super Admin, Admin, Manager, Staff, Viewer)
- **Permission system**: Resource-action based permissions (45 total across 10 resources)
- **Middleware protection**: Routes are protected via `middleware.ts` and `auth.middleware.ts`
- **Audit logging**: All authentication and user management actions are logged

### Branch Context System

The application is **multi-branch aware**:

- Branch context is managed via `contexts/branch-context.tsx`
- Users can switch between branches they have access to
- Most API endpoints accept optional `branchId` query parameter for filtering
- All transactions (POS, purchase orders, sales orders) are branch-scoped

## File Structure & Patterns

### Directory Layout

```
app/
├── (auth)/               # Authentication pages (login, register)
├── (dashboard)/          # Dashboard layout group with sidebar
│   ├── dashboard/        # Main dashboard page
│   ├── products/         # Product management
│   ├── inventory/        # Inventory tracking
│   ├── warehouses/       # Warehouse management
│   ├── branches/         # Branch management
│   ├── suppliers/        # Supplier management
│   ├── customers/        # Customer management
│   ├── purchase-orders/  # Purchase orders
│   ├── receiving-vouchers/ # Receiving vouchers (goods receipt)
│   ├── sales-orders/     # Sales orders
│   ├── pos/              # Point of Sale
│   ├── ar-ap/            # Accounts Receivable/Payable
│   ├── expenses/         # Expense tracking
│   ├── alerts/           # Alert monitoring
│   ├── reports/          # Reporting
│   ├── users/            # User management
│   └── roles/            # Role management
├── api/                  # API routes (Next.js route handlers)
└── layout.tsx            # Root layout

components/
├── ui/                   # shadcn/ui primitives
├── shared/               # Shared components (header, sidebar, etc.)
├── [module]/             # Module-specific components
│   ├── [module]-table.tsx
│   ├── [module]-dialog.tsx
│   └── [module]-form.tsx

contexts/                 # React contexts
├── auth.context.tsx      # Authentication state
└── branch-context.tsx    # Branch selection state

hooks/                    # Custom React hooks
├── use-[module].ts       # TanStack Query hooks for data fetching
└── use-api.ts            # Base API client hook

lib/
├── prisma.ts             # Prisma client singleton
├── validations/          # Zod validation schemas
├── email/                # Email service with SMTP templates
├── api-error.ts          # API error handling utilities
├── api-middleware.ts     # Middleware factory functions
└── utils.ts              # Utility functions

middleware/               # Express-style middleware
├── auth.middleware.ts    # JWT verification
├── permission.middleware.ts  # RBAC authorization
└── rate-limit.middleware.ts  # Rate limiting

prisma/
├── schema.prisma         # Database schema
├── migrations/           # Database migrations
└── seeds/                # Seed data scripts

repositories/             # Data access layer
services/                 # Business logic layer
types/                    # TypeScript type definitions
```

### Module Implementation Pattern

When implementing a new module (e.g., "Widget"), follow this pattern:

#### 1. Define Types (`types/widget.types.ts`)
```typescript
export interface Widget {
  id: string;
  name: string;
  // ... fields
}

export interface CreateWidgetInput {
  name: string;
  // ... fields (no id, no timestamps)
}

export interface UpdateWidgetInput extends Partial<CreateWidgetInput> {}

export interface WidgetFilters {
  status?: string;
  search?: string;
  branchId?: string;
}
```

#### 2. Create Validation Schema (`lib/validations/widget.validation.ts`)
```typescript
import { z } from 'zod';

export const widgetSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  // ... fields with validation rules
});

export const updateWidgetSchema = widgetSchema.partial();
```

#### 3. Create Repository (`repositories/widget.repository.ts`)
```typescript
import { prisma } from '@/lib/prisma';

export class WidgetRepository {
  async findAll(filters?: WidgetFilters) {
    return await prisma.widget.findMany({
      where: { /* filters */ },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string) {
    return await prisma.widget.findUnique({ where: { id } });
  }

  async create(data: CreateWidgetInput) {
    return await prisma.widget.create({ data });
  }

  async update(id: string, data: UpdateWidgetInput) {
    return await prisma.widget.update({ where: { id }, data });
  }

  async delete(id: string) {
    return await prisma.widget.delete({ where: { id } });
  }
}

export const widgetRepository = new WidgetRepository();
```

#### 4. Create Service (`services/widget.service.ts`)
```typescript
import { widgetRepository } from '@/repositories/widget.repository';
import { widgetSchema } from '@/lib/validations/widget.validation';
import { ValidationError, NotFoundError } from '@/lib/errors';

export class WidgetService {
  async getAll(filters?: WidgetFilters) {
    return await widgetRepository.findAll(filters);
  }

  async getById(id: string) {
    const widget = await widgetRepository.findById(id);
    if (!widget) throw new NotFoundError('Widget');
    return widget;
  }

  async create(data: CreateWidgetInput) {
    // Validate input
    const validationResult = widgetSchema.safeParse(data);
    if (!validationResult.success) {
      const errors = validationResult.error.flatten().fieldErrors;
      throw new ValidationError('Invalid data', errors);
    }

    return await widgetRepository.create(validationResult.data);
  }

  async update(id: string, data: UpdateWidgetInput) {
    await this.getById(id); // Verify exists
    return await widgetRepository.update(id, data);
  }

  async delete(id: string) {
    await this.getById(id); // Verify exists
    return await widgetRepository.delete(id);
  }
}

export const widgetService = new WidgetService();
```

#### 5. Create API Routes (`app/api/widgets/route.ts`)
```typescript
import { NextResponse } from 'next/server';
import { widgetService } from '@/services/widget.service';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const filters = { /* extract filters from searchParams */ };
    const widgets = await widgetService.getAll(filters);
    return NextResponse.json({ success: true, data: widgets });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: error.statusCode || 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const widget = await widgetService.create(body);
    return NextResponse.json({ success: true, data: widget });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: error.statusCode || 400 }
    );
  }
}
```

#### 6. Create Custom Hook (`hooks/use-widgets.ts`)
```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useApi } from '@/hooks/use-api';

export function useWidgets(filters?: WidgetFilters) {
  const api = useApi();

  return useQuery({
    queryKey: ['widgets', filters],
    queryFn: () => api.get('/api/widgets', filters),
  });
}

export function useCreateWidget() {
  const api = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateWidgetInput) => api.post('/api/widgets', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['widgets'] });
    },
  });
}
```

#### 7. Create UI Components (`components/widgets/`)
- `widget-table.tsx` - Data table with search and filters
- `widget-dialog.tsx` - Create/edit dialog
- `widget-form.tsx` - Reusable form component (if needed)

#### 8. Create Page (`app/(dashboard)/widgets/page.tsx`)
```typescript
'use client';

import { useWidgets } from '@/hooks/use-widgets';
import { WidgetTable } from '@/components/widgets/widget-table';
import { WidgetDialog } from '@/components/widgets/widget-dialog';

export default function WidgetsPage() {
  const { data, isLoading } = useWidgets();

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Widgets</h1>
        <WidgetDialog />
      </div>
      <WidgetTable data={data} isLoading={isLoading} />
    </div>
  );
}
```

## Current Implementation Status

### ✅ Fully Implemented Modules
- Products with multi-UOM support
- Inventory with batch tracking and weighted average costing
- Warehouses with capacity monitoring
- Branches
- Suppliers
- Customers
- Purchase Orders with receiving functionality
- Receiving Vouchers (goods receipt)
- Sales Orders
- POS with sales order conversion
- User management with RBAC
- Role and permission management
- Authentication system (login, register, email verification)

### 🔄 Partially Complete
- **AR/AP**: Backend services, repositories, types, and API routes are complete. UI components need implementation.
- **Expenses**: Backend complete, API routes exist, UI needs improvement.
- **Alerts**: Service and API complete, UI page needs enhancement.
- **Dashboard**: KPI calculations complete, UI needs chart visualizations.
- **Reports**: Backend logic complete, UI needs export functionality.

## Important Implementation Notes

### Working with Inventory

- Always use `inventoryService.addStock()` for receiving inventory (creates batches)
- Use `inventoryService.deductStock()` for sales/transfers (FIFO batch consumption)
- Stock transfers use `inventoryService.transferStock()` (deduct + add across warehouses)
- Stock adjustments use `inventoryService.adjustStock()` for corrections

### Purchase Order Flow

1. Create PO → status: 'pending'
2. Create Receiving Voucher from PO → links to PO items
3. Receive items via Receiving Voucher → creates inventory batches
4. PO status automatically updates to 'received' when all items received

### POS Sales Flow

1. POS sale can be created directly OR converted from a sales order
2. Payment methods: Cash, Credit, AR Credit
3. AR Credit creates an AccountsReceivable record automatically
4. Stock is deducted using FIFO batch logic
5. Weighted average cost is recalculated on each transaction

### Authentication Flow

1. Login → generates JWT token → stored in HTTP-only cookie
2. Middleware validates token on protected routes
3. User context provides current user, permissions, and role
4. Permission checks use resource-action format (e.g., 'PRODUCTS:CREATE')
5. Sessions are stored in database for revocation capability

### Testing Best Practices

- Unit tests in `tests/unit/` - test services, utilities, validation
- Integration tests in `tests/integration/` - test API routes with database
- E2E tests in `tests/e2e/` - test full user workflows with Playwright
- Use test database for integration/E2E tests
- Mock Prisma client for unit tests of repositories

## Environment Variables

Required variables (see `.env.example`):

```bash
# Database
DATABASE_URL="postgresql://..."

# JWT
JWT_SECRET="min-256-bits-change-in-production"
JWT_EXPIRATION="24h"

# SMTP (optional for development)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="user@example.com"
SMTP_PASSWORD="password"
SMTP_FROM="InventoryPro <noreply@inventorypro.com>"

# App
APP_URL="http://localhost:3000"
NODE_ENV="development"
```

## Default Credentials

After running `npx prisma db seed`:

- **Email**: cybergada@gmail.com
- **Password**: Qweasd145698@
- **Role**: Super Admin (all permissions)

## Common Gotchas

1. **Prisma Client**: Always run `npx prisma generate` after schema changes
2. **Path Aliases**: Use `@/` prefix (e.g., `@/lib/utils`) - configured in `tsconfig.json`
3. **shadcn/ui**: Only use shadcn components for consistency - they're in `components/ui/`
4. **Next.js App Router**: Use `'use client'` directive for client components
5. **Error Handling**: API routes should always return `{ success: boolean, data?, error? }`
6. **TypeScript**: Build errors are ignored via `next.config.ts` - fix them for production
7. **Branch Context**: Use `useBranch()` hook to get current selected branch in components
8. **Toast Notifications**: Use `toast` from `@/hooks/use-toast` for user feedback

## Useful References

- Existing examples to follow:
  - **Complete CRUD**: `app/(dashboard)/products/`
  - **Complex form**: `components/purchase-orders/`
  - **Table with actions**: `components/products/product-table.tsx`
  - **API with filters**: `app/api/inventory/route.ts`
  - **Service with validation**: `services/product.service.ts`
