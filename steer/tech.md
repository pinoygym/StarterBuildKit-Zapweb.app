# Technology Stack

## Core Technologies

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **UI Library**: React 19
- **Styling**: Tailwind CSS v4
- **Component Library**: shadcn/ui (exclusive UI component library)
- **Database**: Neon PostgreSQL (serverless)
- **ORM**: Prisma
- **Validation**: Zod schemas

## Database

- **Provider**: Neon PostgreSQL
- **ORM**: Prisma with type-safe operations
- **Connection**: Connection pooling for optimal performance
- **Migrations**: Prisma migrations for schema management
- **Backups**: Automatic backups via Neon's built-in system

## Common Commands

### Development
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
```

### Database
```bash
npx prisma generate  # Generate Prisma client
npx prisma migrate dev  # Run migrations in development
npx prisma migrate deploy  # Run migrations in production
npx prisma studio    # Open Prisma Studio GUI
npx prisma db seed   # Run seed script
```

### Code Quality
```bash
npm run lint         # Run ESLint
npm run type-check   # Run TypeScript compiler check
```

## Architecture Patterns

- **Server Components**: Use React Server Components by default for data fetching
- **Client Components**: Mark with 'use client' only when needed (interactivity, hooks)
- **API Routes**: Next.js App Router API routes for backend logic
- **Repository Pattern**: Separate data access layer using Prisma
- **Service Layer**: Business logic separated from API routes
- **Transaction Handling**: Use Prisma transactions for multi-step operations

## State Management

- **React Query**: Client-side caching and data fetching
- **React Context**: Branch selection and global UI state
- **Local Storage**: Persist user preferences (selected branch)

## Performance

- **Optimistic Locking**: Handle concurrent data modifications
- **Database Indexes**: Proper indexing on frequently queried fields
- **Pagination**: Implement for large data lists
- **Code Splitting**: Lazy load heavy components (reports, charts)
- **Image Optimization**: Use Next.js Image component
