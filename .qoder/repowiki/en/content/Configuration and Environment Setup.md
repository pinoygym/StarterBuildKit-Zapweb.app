# Configuration and Environment Setup

<cite>
**Referenced Files in This Document**   
- [README.md](file://README.md)
- [QUICK-START-GUIDE.md](file://QUICK-START-GUIDE.md)
- [TASK-COMPLETION-STATUS.md](file://TASK-COMPLETION-STATUS.md)
- [next.config.ts](file://next.config.ts)
- [tailwind.config.ts](file://tailwind.config.ts)
- [tsconfig.json](file://tsconfig.json)
- [package.json](file://package.json)
- [prisma/schema.prisma](file://prisma/schema.prisma)
- [prisma/seed.ts](file://prisma/seed.ts)
- [.env.example](file://.env.example)
- [SETUP.md](file://SETUP.md)
</cite>

## Table of Contents
1. [Introduction](#introduction)
2. [Prerequisites](#prerequisites)
3. [Installation Instructions](#installation-instructions)
4. [Environment Variable Configuration](#environment-variable-configuration)
5. [Configuration Options](#configuration-options)
6. [Database Setup](#database-setup)
7. [Troubleshooting Tips](#troubleshooting-tips)
8. [Development Continuation](#development-continuation)

## Introduction
This document provides comprehensive guidance for configuring and setting up the InventoryPro application in both local and production environments. The InventoryPro system is a comprehensive inventory management and Point of Sale (POS) solution designed for soft drinks wholesale delivery companies in the Philippines. This guide covers all necessary steps from initial setup to database configuration, ensuring developers can quickly get the application running and understand its configuration structure.

**Section sources**
- [README.md](file://README.md#L1-L130)

## Prerequisites
Before installing and running the InventoryPro application, ensure your development environment meets the following requirements:

- **Node.js 20+**: The application requires Node.js version 20 or higher for optimal performance and compatibility with the latest features.
- **Neon PostgreSQL Database Account**: A serverless PostgreSQL database account on Neon is required for data persistence. The application uses Neon's serverless architecture for efficient database management.
- **npm**: Node Package Manager is required for installing dependencies and running scripts.
- **Git**: Required for cloning the repository and managing version control.

The application is built on a modern tech stack including Next.js 15 with App Router, TypeScript, React 19, Tailwind CSS v4, shadcn/ui component library, Prisma ORM, and Zod for validation.

**Section sources**
- [README.md](file://README.md#L18-L22)

## Installation Instructions
Follow these step-by-step instructions to install and run the InventoryPro application:

1. **Clone the repository** from your source control system to your local machine.

2. **Install dependencies** using npm:
```bash
npm install
```

3. **Start the development server** after dependencies are installed:
```bash
npm run dev
```

4. **Access the application** by opening [http://localhost:3000](http://localhost:3000) in your web browser.

The application will automatically compile and start in development mode. Any changes to the codebase will trigger hot reloading, allowing for rapid development and testing.

**Section sources**
- [README.md](file://README.md#L23-L65)

## Environment Variable Configuration
Proper environment variable configuration is essential for connecting the application to the database and setting application-specific parameters.

1. **Create a .env file** by copying the example file:
```bash
cp .env.example .env
```

2. **Configure the database connection** by updating the DATABASE_URL variable in the .env file with your Neon PostgreSQL connection string:
```
DATABASE_URL="postgresql://user:password@host:5432/inventorypro?sslmode=require"
```

The .env.example file contains all required environment variables with appropriate placeholders. These variables control database connectivity, application behavior, and integration settings. The application uses the DATABASE_URL environment variable to establish connections to the PostgreSQL database, with SSL mode required for secure connections.

**Section sources**
- [README.md](file://README.md#L31-L39)
- [.env.example](file://.env.example)

## Configuration Options
The application includes several configuration files that control various aspects of its behavior and appearance.

### Next.js Configuration
The `next.config.ts` file contains Next.js-specific settings:
- **Image optimization**: Configured to allow remote image patterns from any hostname via HTTPS
- **Build optimization**: Default Next.js optimization settings
- **Type safety**: TypeScript integration with Next.js

```typescript
const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
};
```

### Tailwind CSS Configuration
The `tailwind.config.ts` file defines the styling system:
- **Dark mode support**: Configured with class-based dark mode
- **Content sources**: Specifies file patterns to scan for Tailwind classes
- **Custom theme**: Extends default theme with custom colors, border radius, animations, and keyframes
- **Color palette**: Defines primary, secondary, destructive, muted, accent, popover, and card color variants
- **Animations**: Includes accordion down/up animations for UI components

### TypeScript Configuration
The `tsconfig.json` file configures TypeScript compilation:
- **Target**: ES2017 for broad browser compatibility
- **Module system**: ESNext modules
- **Module resolution**: Bundler-based resolution
- **Strict type checking**: Enabled for improved code quality
- **Path aliases**: Configured with `@/*` mapping to the root directory
- **JSX preservation**: Preserves JSX for Next.js processing

**Section sources**
- [next.config.ts](file://next.config.ts#L1-L15)
- [tailwind.config.ts](file://tailwind.config.ts#L1-L100)
- [tsconfig.json](file://tsconfig.json#L1-L28)

## Database Setup
The application uses Prisma ORM with PostgreSQL for data persistence and management.

### Prisma Schema
The `prisma/schema.prisma` file defines the complete database schema with 15 models:
- **Core entities**: Branch, Product, ProductUOM, Warehouse, InventoryBatch, StockMovement
- **Procurement**: Supplier, PurchaseOrder, PurchaseOrderItem
- **Sales**: SalesOrder, SalesOrderItem, POSSale, POSSaleItem
- **Financial**: AccountsReceivable, ARPayment, AccountsPayable, APPayment, Expense

The schema includes proper relationships between entities, UUID primary keys, and comprehensive indexing for performance optimization on frequently queried fields.

### Database Initialization
Initialize the database with the following steps:

1. **Generate Prisma client**:
```bash
npx prisma generate
```

2. **Run database migrations**:
```bash
npx prisma migrate dev --name init
```

3. **Seed the database** with sample data:
```bash
npx prisma db seed
```

The seed script creates comprehensive sample data including:
- 2 branches (Manila Main Branch, Quezon City Branch)
- 3 warehouses (Manila Central, QC Storage, Manila Secondary)
- 2 suppliers (Coca-Cola Beverages, Pepsi-Cola Products)
- 8 products with multiple units of measure
- Sample inventory batches for the first 4 products

### Prisma Client Configuration
The Prisma client is configured in `lib/prisma.ts` with:
- **Global instance**: Prevents multiple instances in development
- **Environment awareness**: Uses global instance only in non-production environments
- **Connection management**: Properly disconnects in seed scripts

**Section sources**
- [prisma/schema.prisma](file://prisma/schema.prisma#L1-L391)
- [prisma/seed.ts](file://prisma/seed.ts#L1-L257)
- [lib/prisma.ts](file://lib/prisma.ts#L1-L9)
- [SETUP.md](file://SETUP.md#L31-L47)

## Troubleshooting Tips
This section provides solutions to common setup issues encountered during installation and configuration.

### Database Connection Errors
- **Verify DATABASE_URL format**: Ensure the connection string follows the format `postgresql://user:password@host:5432/database?sslmode=require`
- **Check Neon credentials**: Validate username, password, host, and database name
- **Confirm SSL requirement**: The application requires SSL connections to the database
- **Test connection independently**: Use a PostgreSQL client to verify connectivity before running the application

### Dependency Installation Problems
- **Clear npm cache**: Run `npm cache clean --force` if encountering package installation issues
- **Delete node_modules**: Remove node_modules directory and package-lock.json, then run `npm install` again
- **Check Node.js version**: Ensure you are using Node.js 20+ as specified in the prerequisites
- **Verify network connectivity**: Ensure your machine can access npm registry

### Migration Issues
- **Ensure Prisma client is generated**: Run `npx prisma generate` before migrations
- **Check schema validity**: Validate the Prisma schema for syntax errors
- **Verify database connectivity**: Confirm the DATABASE_URL is correct and accessible
- **Review migration logs**: Check console output for specific error messages

### Seed Data Problems
- **Confirm migration completion**: Ensure migrations have been successfully applied before seeding
- **Check seed script permissions**: Verify the database user has write permissions
- **Validate data constraints**: Ensure seed data doesn't violate unique constraints or foreign key relationships

**Section sources**
- [README.md](file://README.md#L43-L56)
- [SETUP.md](file://SETUP.md#L87-L104)

## Development Continuation
After successful setup, refer to the following documentation for continuing development:

### QUICK-START-GUIDE.md
This guide outlines the current state of implementation and recommended next steps:
- **Completed tasks**: Core modules including Products, Inventory, POS, and Task 11.8 (Sales Order Conversion)
- **Partially completed**: Accounts Receivable (60%), Accounts Payable (45%), Expenses (45%)
- **Not started**: Alerts, Dashboard, Reports

The guide recommends prioritizing development in this order:
1. Complete AR UI implementation
2. Build Dashboard for stakeholder visibility
3. Complete AR/AP financial modules
4. Implement Expenses module
5. Develop comprehensive Reporting

### TASK-COMPLETION-STATUS.md
This document provides detailed status tracking for all tasks:
- **Backend completion**: AR, AP, and Expense services are fully implemented
- **Frontend gaps**: UI components and API routes needed for financial modules
- **Implementation progress**: Comprehensive table showing completion status by module
- **Next steps**: Priority order for completing remaining features

**Section sources**
- [QUICK-START-GUIDE.md](file://QUICK-START-GUIDE.md#L1-L233)
- [TASK-COMPLETION-STATUS.md](file://TASK-COMPLETION-STATUS.md#L1-L274)