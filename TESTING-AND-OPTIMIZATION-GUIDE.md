# InventoryPro - Testing & Optimization Guide

## Overview

This guide covers the comprehensive testing strategy, performance optimizations, and error handling improvements implemented in the InventoryPro system.

---

## 🧪 Testing Strategy

### Testing Pyramid

```
         /\
        /E2E\ (10% - Critical user journeys)
       /------\
      / INTEG \ (30% - API & Database integration)
     /----------\
    /   UNIT     \ (60% - Business logic & functions)
   /--------------\
```

### 1. Unit Tests (60%)

**Location**: `tests/unit/`

**Coverage**:
- Service layer functions (`services/*.service.ts`)
- Repository functions (`repositories/*.repository.ts`)
- Utility functions (`lib/*.ts`)
- Business logic validation

**Example Tests Created**:
- `tests/unit/services/product.service.test.ts`
- `tests/unit/services/ar.service.test.ts`

**Run Commands**:
```bash
npm run test:unit           # Run all unit tests
npm run test:watch          # Watch mode for development
npm run test:ui             # Interactive UI
npm run test:coverage       # Generate coverage report
```

**Best Practices**:
- Mock external dependencies (database, APIs)
- Test edge cases and error scenarios
- Aim for 80%+ code coverage
- Use descriptive test names

### 2. Integration Tests (30%)

**Location**: `tests/integration/`

**Coverage**:
- API route endpoints
- Database operations
- External service integrations
- End-to-end workflows

**Example Tests Created**:
- `tests/integration/api/products.test.ts`

**Run Commands**:
```bash
npm run test:integration   # Run integration tests
```

**Requirements**:
- Test database connection
- Seed data for consistent tests
- Cleanup after each test suite

### 3. E2E Tests (10%)

**Location**: `tests/e2e/`

**Coverage**:
- Critical user journeys
- POS transactions
- Product management workflows
- Sales order processing

**Example Tests Created**:
- `tests/e2e/products.spec.ts` - Product CRUD operations
- `tests/e2e/pos.spec.ts` - Complete checkout flow

**Run Commands**:
```bash
npm run test:e2e           # Run E2E tests (headless)
npm run test:e2e:ui        # Run with Playwright UI
```

**Browsers Tested**:
- ✅ Chromium (Chrome, Edge)
- ✅ Firefox
- ✅ WebKit (Safari)

---

## ⚡ Performance Optimizations

### 1. Error Handling System

#### Custom Error Classes (`lib/api-error.ts`)

```typescript
- AppError              // Base error class
- ValidationError       // For invalid input (400)
- NotFoundError         // For missing resources (404)
- ConflictError         // For duplicate entries (409)
- DatabaseError         // For database failures (500)
- InsufficientStockError // Business logic errors
- UnauthorizedError     // Authentication errors (401)
- ForbiddenError        // Authorization errors (403)
```

#### Error Boundary (`components/shared/error-boundary.tsx`)
- Catches React component errors
- Displays user-friendly error pages
- Shows stack traces in development
- Logs errors to external services in production

#### Usage in API Routes:
```typescript
import { asyncHandler, NotFoundError } from '@/lib/api-error';

export const GET = asyncHandler(async (req, { params }) => {
  const product = await productService.getById(params.id);
  if (!product) {
    throw new NotFoundError('Product', params.id);
  }
  return Response.json({ success: true, data: product });
});
```

### 2. Centralized Logging (`lib/logger.ts`)

```typescript
import { logger } from '@/lib/logger';

logger.error('Failed to process payment', error, { orderId, amount });
logger.warn('Stock level below minimum', { productId, currentStock });
logger.info('Order created successfully', { orderId, total });
logger.debug('Cache hit for product query', { productId });
```

**Features**:
- Structured logging
- Environment-aware (verbose in dev, JSON in prod)
- Ready for integration with:
  - Sentry
  - DataDog
  - CloudWatch
  - LogRocket

### 3. API Middleware (`lib/api-middleware.ts`)

#### Request Validation
```typescript
import { validateRequest } from '@/lib/api-middleware';
import { productSchema } from '@/lib/validations/product.validation';

export async function POST(req: Request) {
  const data = await validateRequest(productSchema)(req);
  // data is now validated and typed
}
```

#### Rate Limiting
```typescript
import { withRateLimit } from '@/lib/api-middleware';

export const GET = withRateLimit(async (req) => {
  // Your handler code
  // Limited to 100 requests/minute by default
});
```

#### Middleware Composition
```typescript
import { compose, withRateLimit, withCORS, asyncHandler } from '@/lib/api-middleware';

export const POST = compose(
  withCORS,
  withRateLimit,
  asyncHandler
)(async (req) => {
  // Your handler code
});
```

### 4. Database Optimizations

#### Connection Pooling
Prisma automatically handles connection pooling. Recommended configuration in `lib/prisma.ts`:

```typescript
const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});
```

#### Recommended Indexes
Add to `prisma/schema.prisma`:

```prisma
model Product {
  // ... fields
  @@index([sku])
  @@index([category, status])
}

model InventoryBatch {
  // ... fields
  @@index([productId, warehouseId])
  @@index([expiryDate])
}

model POS {
  // ... fields
  @@index([branchId, createdAt])
}
```

Run after adding indexes:
```bash
npx prisma db push
```

---

## 📊 Code Quality & Coverage

### Running Tests

```bash
# Unit tests only
npm run test:unit

# Integration tests only
npm run test:integration

# E2E tests only
npm run test:e2e

# All tests
npm run test:all

# With coverage report
npm run test:coverage
```

### Coverage Goals

| Layer | Target Coverage |
|-------|----------------|
| Services | 90%+ |
| Repositories | 85%+ |
| API Routes | 80%+ |
| Components | 70%+ |
| Overall | 80%+ |

### Viewing Coverage

After running `npm run test:coverage`, open:
```
coverage/index.html
```

---

## 🚀 Recommended Additional Optimizations

### 1. React Query Integration (Already Installed)

Add Query Provider in `app/layout.tsx`:

```typescript
'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000, // 1 minute
      cacheTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
```

### 2. Image Optimization

Use Next.js Image component:
```typescript
import Image from 'next/image';

<Image
  src="/product.jpg"
  alt="Product"
  width={300}
  height={300}
  priority // for above-the-fold images
/>
```

### 3. Code Splitting

Dynamic imports for large components:
```typescript
import dynamic from 'next/dynamic';

const HeavyComponent = dynamic(() => import('@/components/heavy-component'), {
  loading: () => <Skeleton />,
  ssr: false,
});
```

### 4. Production Monitoring

**Recommended Services**:
- **Error Tracking**: Sentry
- **Performance**: Vercel Analytics, New Relic
- **Logging**: DataDog, CloudWatch
- **Uptime**: Pingdom, UptimeRobot

---

## 🔍 Additional Test Types

### 1. Performance Tests
- Load testing with k6 or Artillery
- Measure API response times
- Database query optimization
- Memory leak detection

### 2. Security Tests
- OWASP Top 10 vulnerability scanning
- SQL injection prevention
- XSS attack prevention
- CSRF token validation
- Rate limiting effectiveness

### 3. Accessibility Tests
- WCAG 2.1 AA compliance
- Keyboard navigation
- Screen reader compatibility
- Color contrast ratios

### 4. Visual Regression Tests
- Percy or Chromatic
- Screenshot comparison
- Responsive design validation

---

## 📝 Best Practices

### Writing Tests

1. **Follow AAA Pattern**: Arrange, Act, Assert
2. **Use descriptive test names**: `should throw ValidationError when payment exceeds balance`
3. **Test one thing at a time**: Single responsibility per test
4. **Mock external dependencies**: Database, APIs, file system
5. **Clean up after tests**: Reset state, close connections

### Error Handling

1. **Use specific error types**: NotFoundError, ValidationError, etc.
2. **Include context**: Error details, stack traces in dev
3. **Log all errors**: With appropriate log levels
4. **User-friendly messages**: Don't expose internal errors to users
5. **Fail gracefully**: Provide fallbacks and recovery options

### Performance

1. **Optimize queries**: Use indexes, limit results, avoid N+1
2. **Cache aggressively**: API responses, computed values
3. **Lazy load**: Code split large components
4. **Compress assets**: Images, fonts, bundles
5. **Monitor continuously**: Set up alerts for performance degradation

---

## 🎯 Next Steps

1. **Run all tests**: `npm run test:all`
2. **Review coverage**: `npm run test:coverage`
3. **Fix failing tests**: Address any issues
4. **Add more tests**: Achieve 80%+ coverage
5. **Set up CI/CD**: Automate testing in pipeline
6. **Monitor production**: Set up error tracking and logging
7. **Performance audit**: Use Lighthouse and Web Vitals

---

## 📚 Resources

- [Vitest Documentation](https://vitest.dev/)
- [Playwright Documentation](https://playwright.dev/)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Prisma Best Practices](https://www.prisma.io/docs/guides/performance-and-optimization)
- [Next.js Performance](https://nextjs.org/docs/app/building-your-application/optimizing)

---

## ✅ Checklist

### Error Handling
- [x] Custom error classes implemented
- [x] Error boundary added to root layout
- [x] Async handler wrapper for API routes
- [x] Centralized logging system
- [ ] Error tracking service integrated (Sentry)

### Testing
- [x] Vitest configured
- [x] Unit test examples created
- [x] Integration test examples created
- [x] E2E test setup with Playwright
- [ ] Achieve 80%+ test coverage
- [ ] CI/CD pipeline with automated tests

### Performance
- [x] API middleware (rate limiting, validation)
- [ ] React Query integration
- [ ] Database indexes added
- [ ] Image optimization
- [ ] Code splitting for large bundles

### Monitoring
- [x] Logging system setup
- [ ] Production monitoring service
- [ ] Performance tracking
- [ ] Uptime monitoring
- [ ] Alert system for critical errors

---

*Last Updated: November 2025*
