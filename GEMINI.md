# GEMINI.md: Project Context for Gemini CLI

This document provides essential context for the InventoryPro project, designed to help Gemini CLI understand the project's structure, technologies, and conventions.

## Project Overview

InventoryPro is a comprehensive inventory management and Point of Sale (POS) system built with Next.js 15 (App Router). It's a full-stack TypeScript application designed for wholesale delivery companies. The system features multi-UOM product management, batch tracking with average costing, an integrated POS, multi-branch support, financial management (AR/AP), customer management, inventory adjustments, and more.

The application uses a feature-based project structure, with distinct layers for business logic (`/services`), data access (`/repositories`), and UI (`/components`).

## Key Technologies

- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript
- **UI Library:** React 19 with Server Components
- **Styling:** Tailwind CSS v4 with shadcn/ui components
- **Database:** Neon PostgreSQL (Serverless)
- **ORM:** Prisma
- **State Management:** Zustand and React Query
- **Form Handling:** React Hook Form
- **Validation:** Zod
- **Testing:** Vitest (unit/integration), Playwright (e2e)
- **Package Manager:** Bun

## Building and Running

### Prerequisites

- Bun 1.0+ (or Node.js 20+)
- A configured Neon PostgreSQL database.

### Core Commands

- **Install Dependencies:**
  ```bash
  bun install
  ```

- **Run Development Server:**
  ```bash
  bun run dev
  ```
  The application will be available at [http://localhost:3000](http://localhost:3000).

- **Run Production Build:**
  ```bash
  bun run build
  ```

- **Start Production Server:**
  ```bash
  bun start
  ```

### Testing Commands

- **Run All Tests (Unit, Integration, E2E):**
  ```bash
  bun run test:all
  ```

- **Run Unit Tests:**
  ```bash
  bun run test:unit
  ```

- **Run Integration Tests:**
  ```bash
  bun run test:integration
  ```

- **Run End-to-End Tests:**
  ```bash
  bun run test:e2e
  ```

## Development Conventions

- **Code Style:** The project uses ESLint for linting. Run `bun run lint` to check for issues.
- **Type Safety:** TypeScript is used throughout the project. Run `bun run type-check` to check for type errors.
- **Database:** Prisma is used for database access and migrations.
    - **Generate Prisma Client:** `bunx prisma generate`
    - **Run Migrations:** `bunx prisma migrate dev`
    - **Seed Database:** `bunx prisma db seed`
    - **Open Prisma Studio:** `bunx prisma studio`
- **Environment:** Environment variables are managed in a `.env` file, based on the `.env.example` template. The `DATABASE_URL` is the most critical variable to set up.

## Database

The `prisma/schema.prisma` file defines the database schema. The provider is currently set to `sqlite` for local development convenience, but the `README.md` specifies **Neon (PostgreSQL)** for production. Be mindful of potential differences between SQLite and PostgreSQL when making database changes.

**Default Admin Credentials** (after seeding):
- **Email**: cybergada@gmail.com
- **Password**: Qweasd145698@
