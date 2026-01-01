# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**InventoryPro** is a comprehensive inventory management and Point of Sale (POS) system designed for soft drinks wholesale delivery companies in the Philippines. Built with Next.js 15 (App Router), TypeScript, and Neon PostgreSQL.

## Tech Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript (strict mode)
- **UI**: React 19, Tailwind CSS v4, shadcn/ui components
- **Database**: Neon PostgreSQL (Serverless) via Prisma ORM with @prisma/adapter-pg
- **Validation**: Zod schemas
- **State Management**: Zustand, TanStack Query (React Query)
- **Authentication**: JWT with HTTP-only cookies (jose library)
- **Testing**: Vitest (unit/integration), Playwright (E2E), Selenium (additional E2E)

## Common Development Commands

### Development & Build
```bash
npm run dev                    # Start development server at localhost:3000 (accessible on network via -H 0.0.0.0)
npm run build                  # Run migrations then build for production
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

# Database Sync & Safety Commands
npm run db:check              # Run pre-migration safety checks
npm run db:compare            # Compare Dev and Production schemas
npm run db:sync:verify        # Verify migration status and schema sync
npm run db:deploy:prod        # Deploy to production with automated safety checks
```

### Testing
```bash
# Unit & Integration Tests (Vitest)
npm run test                  # Run unit tests with Vitest
npm run test:watch            # Run tests in watch mode
npm run test:ui               # Run tests with Vitest UI
npm run test:coverage         # Generate test coverage report
npm run test:unit             # Run unit tests only (tests/unit)
npm run test:integration      # Run integration tests only (tests/integration, sequential)

# E2E Tests (Playwright)
npm run test:e2e              # Run E2E tests with Playwright
npm run test:e2e:ui           # Run E2E tests with Playwright UI

# Selenium Tests
npm run test:selenium         # Run smoke test with Selenium
npm run test:selenium:crud    # Run CRUD and UOM flow tests
npm run test:ethel            # Run ethel test suite

# All Tests
npm run test:all              # Run all tests (unit, integration, E2E)
```

### Demo & Documentation
```bash
npm run demo:seed             # Seed demo data for video recordings
npm run demo:record           # Record all demo videos with Playwright
npm run demo:record:login     # Record authentication demo
npm run demo:record:dashboard # Record dashboard demo
npm run demo:record:products  # Record products demo
npm run demo:record:pos       # Record POS/sales workflow demo
npm run demo:process          # Process demo videos
npm run demo:process:login    # Process specific demo (login)
npm run demo:burn-subs        # Burn subtitles into videos
npm run demo:generate-tts     # Generate text-to-speech audio
npm run demo:tts:free         # Generate TTS using free service
npm run demo:tts:login        # Generate TTS for login demo
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
- **Error Handling**: Custom error classes (`ValidationError`, `NotFoundError`, `InsufficientStockError`) with standardized responses
- **Type Safety**: Strong typing throughout with shared TypeScript interfaces
- **Database Adapter**: Uses @prisma/adapter-pg with pg connection pool for Neon PostgreSQL serverless
- **Transaction Support**: Services accept optional `tx` parameter for atomic operations

### Multi-UOM and Weighted Average Costing System

The inventory system uses **weighted average costing** with multi-UOM support:

#### UOM Conversion
- Products have a base UOM and optional alternate UOMs with conversion factors
- Example: Product base UOM = "Bottle", alternate UOM = "Case" with conversionFactor = 24
- Receiving 1 case = 24 bottles in base inventory
- All inventory quantities are stored in base UOM

#### Weighted Average Cost Calculation
The system calculates a **global weighted average cost** across all warehouses:

```
New Average Cost = (Current Total Value + New Value) / (Current Total Qty + New Qty)

Where:
- Current Total Value = Current Average Cost × Total Stock (all warehouses)
- New Value = Unit Cost (in base UOM) × Quantity Added
```

**Important**:
- Unit costs are converted to base UOM before calculation
- If receiving 1 case @ ₱100 and case = 10 bottles, base cost = ₱100 / 10 = ₱10/bottle
- Average cost is updated on the Product table globally, not per warehouse
- Stock movements track individual transactions with reference IDs

### Authentication & Authorization

- **JWT-based authentication** with HTTP-only cookies (24-hour expiration)
- **JWT Library**: Uses `jose` for token signing/verification (not jsonwebtoken)
- **Session management**: Database-backed sessions for token revocation
- **Role-based access control (RBAC)**: 5 system roles (Super Admin, Admin, Manager, Staff, Viewer)
- **Permission system**: Resource-action based permissions (45 total across 10 resources)
- **Middleware protection**: Routes are protected via `middleware.ts` (checks JWT token)
- **Public routes**: `/api/auth/*`, `/api/roles`, `/api/auth/me`, `/api/dev/*` (dev only)
- **Dev route protection**: `/api/dev/*` routes blocked in production via middleware
- **Audit logging**: All authentication and user management actions are logged

### Branch Context System

The application is **multi-branch aware**:

- Branch context is managed via `contexts/branch-context.tsx`
- Users can switch between branches they have access to
- Most API endpoints accept optional `branchId` query parameter for filtering
- All transactions (POS, purchase orders, sales orders) are branch-scoped
- Users can have `branchLockEnabled` to restrict them to their assigned branch

### Data Maintenance System

The application includes a **data maintenance module** for managing reference data:

- Accessible at `/settings/data-maintenance`
- Manages: Product Categories, Units of Measure, Payment Methods, Expense Categories, Expense Vendors, Sales Agents
- Supports: Create, update, toggle status (active/inactive), delete (with safety checks)
- System-defined records are protected from deletion
- API endpoints: `/api/data-maintenance/[type]/[id]`

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
│   ├── roles/            # Role management
│   └── settings/         # Settings (company, database, data maintenance)
├── api/                  # API routes (Next.js route handlers)
│   ├── auth/             # Authentication endpoints
│   ├── dev/              # Development/seeding endpoints (protected in production)
│   └── [resources]/      # Resource-specific endpoints
└── layout.tsx            # Root layout

components/
├── ui/                   # shadcn/ui primitives
├── shared/               # Shared components (header, sidebar, etc.)
└── [module]/             # Module-specific components
    ├── [module]-table.tsx
    ├── [module]-dialog.tsx
    └── [module]-form.tsx

contexts/                 # React contexts
├── auth.context.tsx      # Authentication state
└── branch-context.tsx    # Branch selection state

hooks/                    # Custom React hooks
├── use-[module].ts       # TanStack Query hooks for data fetching
└── use-api.ts            # Base API client hook

lib/
├── prisma.ts             # Prisma client singleton with pg adapter
├── logger.ts             # Logging utility
├── validations/          # Zod validation schemas
├── email/                # Email service with SMTP templates
├── errors.ts             # Centralized error classes and Prisma error handlers
├── api-middleware.ts     # Middleware factory functions
└── utils.ts              # Utility functions

middleware.ts             # Next.js middleware for route protection

prisma/
├── schema.prisma         # Database schema
├── migrations/           # Database migrations
└── seeds/                # Seed data scripts
    ├── permissions.seed.ts     # Permission definitions
    ├── roles.seed.ts           # Role definitions
    ├── role-permissions.seed.ts # Role-permission mappings
    ├── admin-user.seed.ts      # Admin user creation
    ├── reference-data.seed.ts  # Reference data (categories, UOMs, etc.)
    └── users.seed.ts           # Additional users

repositories/             # Data access layer
services/                 # Business logic layer
types/                    # TypeScript type definitions

scripts/
├── demo/                 # Demo video recording scripts
└── post-production/      # Video processing scripts

tests/
├── unit/                 # Unit tests (Vitest)
├── integration/          # Integration tests (Vitest)
├── e2e/                  # E2E tests (Playwright)
├── selenium/             # Selenium tests
└── setup.ts              # Test setup file
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
import { Prisma } from '@prisma/client';

export class WidgetRepository {
  async findAll(filters?: WidgetFilters) {
    return await prisma.widget.findMany({
      where: { /* filters */ },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string, tx?: Prisma.TransactionClient) {
    const client = tx || prisma;
    return await client.widget.findUnique({ where: { id } });
  }

  async create(data: CreateWidgetInput, tx?: Prisma.TransactionClient) {
    const client = tx || prisma;
    return await client.widget.create({ data });
  }

  async update(id: string, data: UpdateWidgetInput, tx?: Prisma.TransactionClient) {
    const client = tx || prisma;
    return await client.widget.update({ where: { id }, data });
  }

  async delete(id: string, tx?: Prisma.TransactionClient) {
    const client = tx || prisma;
    return await client.widget.delete({ where: { id } });
  }
}

export const widgetRepository = new WidgetRepository();
```

#### 4. Create Service (`services/widget.service.ts`)
```typescript
import { widgetRepository } from '@/repositories/widget.repository';
import { widgetSchema } from '@/lib/validations/widget.validation';
import { ValidationError, NotFoundError, handlePrismaError } from '@/lib/errors';
import { prisma } from '@/lib/prisma';

export class WidgetService {
  async getAll(filters?: WidgetFilters) {
    try {
      return await widgetRepository.findAll(filters);
    } catch (error) {
      throw handlePrismaError(error);
    }
  }

  async getById(id: string) {
    try {
      const widget = await widgetRepository.findById(id);
      if (!widget) throw new NotFoundError('Widget', id);
      return widget;
    } catch (error) {
      throw handlePrismaError(error);
    }
  }

  async create(data: CreateWidgetInput) {
    // Validate input
    const validationResult = widgetSchema.safeParse(data);
    if (!validationResult.success) {
      const errors = validationResult.error.flatten().fieldErrors;
      throw new ValidationError('Invalid data', errors);
    }

    try {
      return await widgetRepository.create(validationResult.data);
    } catch (error) {
      throw handlePrismaError(error);
    }
  }

  async update(id: string, data: UpdateWidgetInput) {
    await this.getById(id); // Verify exists
    try {
      return await widgetRepository.update(id, data);
    } catch (error) {
      throw handlePrismaError(error);
    }
  }

  async delete(id: string) {
    await this.getById(id); // Verify exists
    try {
      return await widgetRepository.delete(id);
    } catch (error) {
      throw handlePrismaError(error);
    }
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
- Inventory with weighted average costing
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
- Data Maintenance (reference data management)
- Demo recording and video generation system

### 🔄 Partially Complete
- **AR/AP**: Backend services, repositories, types, and API routes are complete. UI components need implementation.
- **Expenses**: Backend complete, API routes exist, UI needs improvement.
- **Alerts**: Service and API complete, UI page needs enhancement.
- **Dashboard**: KPI calculations complete, UI needs chart visualizations.
- **Reports**: Backend logic complete, UI needs export functionality.

## Important Implementation Notes

### Working with Inventory

**Key Service Methods:**
- `inventoryService.addStock()` - Receiving inventory, updates weighted average cost
- `inventoryService.deductStock()` - Sales/transfers, validates sufficient stock
- `inventoryService.transferStock()` - Deduct + add across warehouses atomically
- `inventoryService.adjustStock()` - Stock corrections (adjustments)
- `inventoryService.convertToBaseUOM()` - Convert quantities from any UOM to base UOM

**Important Rules:**
- All inventory quantities are stored in base UOM
- Average cost is calculated globally across all warehouses
- Unit costs are converted to base UOM before weighted average calculation
- Stock movements track all transactions with type ('IN', 'OUT', 'TRANSFER', 'ADJUSTMENT')
- Always check for sufficient stock before deducting

### Purchase Order Flow

1. Create PO → status: 'pending', receivingStatus: 'pending'
2. Create Receiving Voucher from PO → links to PO items
3. Receive items via Receiving Voucher → creates/updates inventory, records stock movements
4. PO receivingStatus automatically updates when items are received
5. Receiving vouchers can have supplier discounts and additional fees

### POS Sales Flow

1. POS sale can be created directly OR converted from a sales order
2. Payment methods: Cash, Credit, AR Credit (creates AccountsReceivable)
3. Stock is deducted using inventoryService.deductStock()
4. Cost of goods sold (COGS) calculated using current average cost
5. Supports promotions and discounts (tracked in PromotionUsage)
6. Generates receipts with barcode/QR code

### Authentication Flow

1. Login → generates JWT token (jose) → stored in HTTP-only cookie
2. Middleware validates token on protected routes using jwtVerify
3. Token is valid for 24 hours (JWT_EXPIRATION)
4. Sessions stored in database for revocation capability
5. Public routes bypass authentication (see middleware.ts)
6. /api/dev routes are blocked in production

### Testing Best Practices

- **Unit tests** (`tests/unit/`) - Test services, utilities, validation in isolation
- **Integration tests** (`tests/integration/`) - Test API routes with real database
- **E2E tests** (`tests/e2e/`) - Test full user workflows with Playwright
- **Selenium tests** (`tests/selenium/`) - Additional browser-based E2E tests
- Use test database for integration/E2E tests
- Integration tests run sequentially (fileParallelism=false)
- Playwright has auth setup project for session reuse

### Error Handling

The application uses a centralized error handling system:

**Custom Error Classes:**
- `ValidationError` - Invalid input data (400)
- `NotFoundError` - Resource not found (404)
- `ConflictError` - Duplicate entries (409)
- `InsufficientStockError` - Not enough inventory (400)
- `UnauthorizedError` - Authentication failure (401)
- `ForbiddenError` - Authorization failure (403)
- `DatabaseError` - Database operation failure (500)

**Prisma Error Handling:**
- Use `handlePrismaError()` to transform Prisma errors to AppError
- Automatically handles P2002 (unique constraint), P2003 (foreign key), P2025 (not found)
- All errors have statusCode, code, isOperational, and optional details

## Environment Variables

Create a `.env` file with the following variables:

```bash
# Database - Neon PostgreSQL
DATABASE_URL="postgresql://user:password@host:5432/dbname?sslmode=require&channel_binding=require"

# JWT Authentication
JWT_SECRET="R8wD2kP6qT1nS5vL9xC3zF7mY0hJ4gN8bV2tW6pQ1eR5sK9u"  # Min 256 bits
JWT_EXPIRATION="24h"

# SMTP Configuration (optional for development)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="noreply@inventorypro.com"
SMTP_PASSWORD="your_smtp_password"
SMTP_FROM="InventoryPro <noreply@inventorypro.com>"

# App Configuration
NEXT_PUBLIC_APP_URL="http://localhost:3000"
APP_URL="http://localhost:3000"
NODE_ENV="development"

# Password Reset
PASSWORD_RESET_EXPIRATION="1h"

# Rate Limiting
MAX_LOGIN_ATTEMPTS="5"
LOGIN_ATTEMPT_WINDOW="15m"

# Google Cloud TTS (for demo videos)
GOOGLE_APPLICATION_CREDENTIALS="./google-tts-credentials.json"
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
6. **Branch Context**: Use `useBranch()` hook to get current selected branch in components
7. **Toast Notifications**: Use `toast` from `@/hooks/use-toast` for user feedback
8. **Neon PostgreSQL**: Uses connection pooling via @prisma/adapter-pg and pg library
9. **Database URLs**: localhost is replaced with 127.0.0.1 in lib/prisma.ts for compatibility
10. **Slow Queries**: Automatically logged in development if duration > 1000ms
11. **Transaction Support**: Pass `tx` parameter to repository methods for atomic operations
12. **UOM Conversions**: Always convert to base UOM before inventory calculations

## Useful References

Existing examples to follow:
- **Complete CRUD**: `app/(dashboard)/products/`
- **Complex form with UOMs**: `components/purchase-orders/`, `components/receiving-vouchers/`
- **Table with actions**: `components/products/product-table.tsx`
- **API with filters**: `app/api/inventory/route.ts`
- **Service with validation**: `services/product.service.ts`
- **Service with transactions**: `services/inventory.service.ts`
- **Error handling**: `lib/errors.ts`
- **Weighted average costing**: `services/inventory.service.ts` (addStock method, lines 148-162)
