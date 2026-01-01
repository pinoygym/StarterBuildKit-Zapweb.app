# Project Structure

## Folder Organization

```
/app                          # Next.js App Router
  /dashboard                  # Dashboard page
  /products                   # Product management
  /inventory                  # Inventory tracking
  /warehouses                 # Warehouse management
  /branches                   # Branch management
  /suppliers                  # Supplier management
  /purchase-orders            # Purchase order workflow
  /sales-orders               # Sales order management
  /pos                        # Point of Sale interface
  /ar-ap                      # Accounts Receivable/Payable
  /expenses                   # Expense tracking
  /alerts                     # Alert monitoring
  /reports                    # Reporting module
  /api                        # API routes
    /products
    /inventory
    /pos
    /...

/components                   # React components
  /ui                         # shadcn/ui components
  /shared                     # Shared components (layout, navigation)
  /dashboard                  # Dashboard-specific components
  /pos                        # POS-specific components
  /...

/lib                          # Utility libraries
  /prisma.ts                  # Prisma client instance
  /utils.ts                   # Helper functions
  /validations.ts             # Zod schemas

/services                     # Business logic layer
  /product.service.ts
  /inventory.service.ts
  /pos.service.ts
  /...

/repositories                 # Data access layer
  /product.repository.ts
  /inventory.repository.ts
  /...

/types                        # TypeScript type definitions
  /product.types.ts
  /inventory.types.ts
  /...

/prisma                       # Prisma configuration
  /schema.prisma              # Database schema
  /migrations                 # Migration files
  /seed.ts                    # Seed data script

/public                       # Static assets
  /images                     # Product images
```

## Module Organization

Each major module follows this pattern:
- **Page Component** (`app/[module]/page.tsx`): Main page with data fetching
- **UI Components** (`components/[module]/*.tsx`): Module-specific components
- **API Routes** (`app/api/[module]/route.ts`): Backend endpoints
- **Service Layer** (`services/[module].service.ts`): Business logic
- **Repository** (`repositories/[module].repository.ts`): Database operations
- **Types** (`types/[module].types.ts`): TypeScript interfaces

## Key Conventions

- **Server Components by Default**: All components are server components unless marked with 'use client'
- **API Route Naming**: Use RESTful conventions (GET, POST, PUT, DELETE)
- **File Naming**: Use kebab-case for files, PascalCase for components
- **Component Structure**: One component per file
- **Prisma Models**: Use PascalCase for model names, camelCase for fields
- **Database IDs**: Use UUID for all primary keys
- **Timestamps**: Include createdAt and updatedAt on all models

## Navigation Structure

Fixed sidebar navigation with links to:
1. Dashboard
2. Products
3. Inventory
4. Warehouses
5. Branches
6. Suppliers
7. Purchase Orders
8. Sales Orders
9. POS
10. AR/AP
11. Expenses
12. Alerts
13. Reports

## Data Flow

1. **User Action** → Component
2. **Component** → API Route
3. **API Route** → Service Layer
4. **Service Layer** → Repository
5. **Repository** → Prisma → Database
6. **Response** flows back through the same layers
