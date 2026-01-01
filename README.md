# InventoryPro

Comprehensive inventory management and Point of Sale (POS) system designed for soft drinks wholesale delivery companies in the Philippines.

## Tech Stack

- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript
- **UI Library:** React 19
- **Styling:** Tailwind CSS v4
- **Component Library:** shadcn/ui
- **Database:** Neon PostgreSQL (Serverless)
- **ORM:** Prisma
- **Validation:** Zod

## Getting Started

### Prerequisites

- Node.js 20+ installed
- Neon PostgreSQL database account

### Installation

1. Clone the repository
2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file based on `.env.example`:
```bash
cp .env.example .env
```

4. Update the `.env` file with your Neon database connection string:
```
DATABASE_URL="postgresql://user:password@host:5432/inventorypro?sslmode=require"
```

### Database Setup

1. Generate Prisma client:
```bash
npx prisma generate
```

2. Run database migrations:
```bash
npx prisma migrate dev
```

3. Seed the database with sample data:
```bash
npx prisma db seed
```

### Development

Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Database Management

View and manage your database with Prisma Studio:
```bash
npx prisma studio
```

## Project Structure

```
/app                    # Next.js App Router pages
  /(dashboard)          # Dashboard layout group
    /dashboard          # Dashboard page
    /products           # Product management
    /inventory          # Inventory tracking
    /warehouses         # Warehouse management
    /branches           # Branch management
    /suppliers          # Supplier management
    /purchase-orders    # Purchase orders
    /sales-orders       # Sales orders
    /pos                # Point of Sale
    /ar-ap              # Accounts Receivable/Payable
    /expenses           # Expense tracking
    /alerts             # Alert monitoring
    /reports            # Reporting
/components             # React components
  /ui                   # shadcn/ui components
  /shared               # Shared components
/lib                    # Utility libraries
/services               # Business logic layer
/repositories           # Data access layer
/types                  # TypeScript types
/prisma                 # Prisma schema and migrations
/hooks                  # Custom React hooks
/public                 # Static assets
```

## Features

- **Multi-UOM Product Management**: Products with multiple units of measure
- **Batch Tracking with Average Costing**: Weighted average cost inventory valuation
- **Integrated POS**: Point-of-sale with multiple payment methods
- **Multi-Branch Support**: Manage multiple business locations
- **Financial Management**: AR/AP and expense tracking
- **Warehouse Management**: Capacity monitoring and utilization
- **Alert System**: Automated alerts for low stock and expiring items
- **Comprehensive Reporting**: Financial statements and analytics

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript compiler check
- `npx prisma generate` - Generate Prisma client
- `npx prisma migrate dev` - Run migrations in development
- `npx prisma studio` - Open Prisma Studio GUI
- `npx prisma db seed` - Run seed script

## Default Admin Credentials

After seeding the database:
- **Email**: cybergada@gmail.com
- **Password**: Qweasd145698@

## License

Private - All rights reserved
