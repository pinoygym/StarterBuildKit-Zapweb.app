# InventoryPro Testing Guide

## Table of Contents
1. [Quick Start (Simple Version)](#quick-start-simple-version)
2. [Detailed Guide (In-Depth)](#detailed-guide-in-depth)
3. [Test Framework Architecture](#test-framework-architecture)
4. [Writing Tests](#writing-tests)
5. [Running Tests](#running-tests)
6. [Debugging Tests](#debugging-tests)
7. [Best Practices](#best-practices)

---

## Quick Start (Simple Version)

### Running All Tests
```bash
npm run test:all
```
This runs unit tests, integration tests, and E2E tests in sequence.

### Running Specific Test Types

**Unit Tests** (Fast, test individual functions):
```bash
npm run test:unit
```

**Integration Tests** (Test API endpoints with database):
```bash
npm run test:integration
```

**E2E Tests** (Test full user flows in browser):
```bash
npm run test:e2e
```

### Running a Single Test File
```bash
# Unit or Integration test
npx vitest run tests/unit/services/product.service.test.ts

# E2E test
npx playwright test tests/e2e/products.spec.ts
```

### Watch Mode (Auto-rerun on changes)
```bash
npm run test:watch
```

### Common Issues

**Tests failing?** Make sure:
1. Development server is running (`npm run dev`)
2. Database is seeded (`npx prisma db seed`)
3. Environment variables are set (`.env` file exists)

---

## Detailed Guide (In-Depth)

### Test Framework Architecture

InventoryPro uses a comprehensive testing strategy with three layers:

```
┌─────────────────────────────────────────┐
│         E2E Tests (Playwright)          │
│  Test complete user flows in browser    │
└─────────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────┐
│    Integration Tests (Vitest + DB)      │
│   Test API endpoints with real database │
└─────────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────┐
│        Unit Tests (Vitest)              │
│   Test individual functions in isolation│
└─────────────────────────────────────────┘
```

#### 1. **Unit Tests** (`tests/unit/`)
- **Framework**: Vitest
- **Purpose**: Test individual functions and services in isolation
- **Speed**: Very fast (no database, no network)
- **Location**: `tests/unit/services/*.test.ts`

#### 2. **Integration Tests** (`tests/integration/`)
- **Framework**: Vitest + Prisma
- **Purpose**: Test API endpoints with real database operations
- **Speed**: Medium (uses database)
- **Location**: `tests/integration/api/*.test.ts`

#### 3. **E2E Tests** (`tests/e2e/`)
- **Framework**: Playwright
- **Purpose**: Test complete user workflows in a real browser
- **Speed**: Slower (full browser automation)
- **Location**: `tests/e2e/*.spec.ts`

### Test Configuration Files

#### `vitest.config.ts` - Unit & Integration Tests
```typescript
{
  test: {
    environment: 'node',
    include: ['**/*.test.ts'],
    globals: true,
  }
}
```

#### `playwright.config.ts` - E2E Tests
```typescript
{
  testDir: './tests/e2e',
  use: {
    baseURL: 'http://localhost:3000',
  },
  projects: ['chromium', 'firefox', 'webkit']
}
```

---

## Writing Tests

### Unit Test Example

**File**: `tests/unit/services/product.service.test.ts`

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { productService } from '@/services/product.service';

describe('ProductService', () => {
  beforeEach(() => {
    // Reset mocks before each test
    vi.clearAllMocks();
  });

  it('should create a product with valid data', async () => {
    const productData = {
      name: 'Test Product',
      basePrice: 100,
      baseUOM: 'pcs',
      category: 'Test',
      minStockLevel: 10,
      shelfLifeDays: 365,
    };

    const result = await productService.createProduct(productData, 'user-id');
    
    expect(result).toBeDefined();
    expect(result.name).toBe('Test Product');
    expect(result.basePrice).toBe(100);
  });

  it('should throw error for duplicate product name', async () => {
    const productData = {
      name: 'Existing Product',
      // ... other fields
    };

    await expect(
      productService.createProduct(productData, 'user-id')
    ).rejects.toThrow('Product with this name already exists');
  });
});
```

### Integration Test Example

**File**: `tests/integration/api/products.test.ts`

```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

describe('Products API', () => {
  let authToken: string;

  beforeAll(async () => {
    // Login to get auth token
    const response = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'cybergada@gmail.com',
        password: 'Qweasd145698@',
      }),
    });
    const data = await response.json();
    authToken = data.token;
  });

  afterAll(async () => {
    // Cleanup test data
    await prisma.product.deleteMany({
      where: { name: { startsWith: 'Test Product' } },
    });
    await prisma.$disconnect();
  });

  it('GET /api/products - should return list of products', async () => {
    const response = await fetch(`${BASE_URL}/api/products`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(Array.isArray(data.products)).toBe(true);
  });

  it('POST /api/products - should create a new product', async () => {
    const newProduct = {
      name: 'Test Product API',
      basePrice: 150,
      baseUOM: 'pcs',
      category: 'Test',
      minStockLevel: 5,
      shelfLifeDays: 180,
    };

    const response = await fetch(`${BASE_URL}/api/products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify(newProduct),
    });

    expect(response.status).toBe(201);
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.product.name).toBe('Test Product API');
  });
});
```

### E2E Test Example

**File**: `tests/e2e/products.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

test.describe('Products Management', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to products page
    await page.goto('/products');
  });

  test('should display products list', async ({ page }) => {
    // Wait for products to load
    await page.waitForSelector('[data-testid="products-table"]');
    
    // Check if table is visible
    const table = page.locator('[data-testid="products-table"]');
    await expect(table).toBeVisible();
  });

  test('should create a new product', async ({ page }) => {
    // Click "Add Product" button
    await page.click('button:has-text("Add Product")');
    
    // Fill in product form
    await page.fill('[name="name"]', 'E2E Test Product');
    await page.fill('[name="basePrice"]', '200');
    await page.selectOption('[name="baseUOM"]', 'pcs');
    await page.fill('[name="category"]', 'Test Category');
    await page.fill('[name="minStockLevel"]', '10');
    await page.fill('[name="shelfLifeDays"]', '365');
    
    // Submit form
    await page.click('button[type="submit"]');
    
    // Verify success message
    await expect(page.locator('text=Product created successfully')).toBeVisible();
    
    // Verify product appears in list
    await expect(page.locator('text=E2E Test Product')).toBeVisible();
  });

  test('should search for products', async ({ page }) => {
    // Type in search box
    await page.fill('[placeholder="Search products..."]', 'Coca-Cola');
    
    // Wait for filtered results
    await page.waitForTimeout(500);
    
    // Verify filtered results
    const rows = page.locator('table tbody tr');
    await expect(rows).toHaveCount(1);
    await expect(rows.first()).toContainText('Coca-Cola');
  });
});
```

---

## Running Tests

### NPM Scripts Reference

| Command | Description | When to Use |
|---------|-------------|-------------|
| `npm run test:all` | Run all tests (unit + integration + E2E) | Before commits, PRs |
| `npm run test:unit` | Run only unit tests | Quick feedback during development |
| `npm run test:integration` | Run only integration tests | After API changes |
| `npm run test:e2e` | Run only E2E tests | After UI changes |
| `npm run test:watch` | Run tests in watch mode | During active development |
| `npm run test:coverage` | Generate coverage report | Check test coverage |
| `npm run test:e2e:ui` | Run E2E tests in UI mode | Debug E2E tests visually |

### Running Specific Tests

**Run a specific test file**:
```bash
npx vitest run tests/unit/services/product.service.test.ts
```

**Run tests matching a pattern**:
```bash
npx vitest run --grep="should create"
```

**Run E2E tests in a specific browser**:
```bash
npx playwright test --project=chromium
```

**Run E2E tests in headed mode (see browser)**:
```bash
npx playwright test --headed
```

---

## Debugging Tests

### Debugging Unit/Integration Tests

#### 1. Using Console Logs
```typescript
it('should calculate total', () => {
  const result = calculateTotal(items);
  console.log('Result:', result); // Add logging
  expect(result).toBe(100);
});
```

#### 2. Using VS Code Debugger
1. Add breakpoint in test file
2. Click "Debug" in VS Code test explorer
3. Or add to `.vscode/launch.json`:
```json
{
  "type": "node",
  "request": "launch",
  "name": "Debug Vitest Tests",
  "runtimeExecutable": "npm",
  "runtimeArgs": ["run", "test:unit"],
  "console": "integratedTerminal"
}
```

### Debugging E2E Tests

#### 1. Playwright UI Mode (Recommended)
```bash
npm run test:e2e:ui
```
- See tests run in real-time
- Pause and inspect at any step
- View network requests
- See console logs

#### 2. Headed Mode
```bash
npx playwright test --headed --debug
```

#### 3. Screenshots and Videos
Playwright automatically captures:
- Screenshots on failure
- Videos of test runs
- Located in `test-results/` directory

---

## Test Suites & Organization

### Test Suite Structure

```
tests/
├── e2e/                    # End-to-end tests
│   ├── auth.setup.ts       # Authentication setup
│   ├── customers.spec.ts
│   ├── products.spec.ts
│   └── ...
├── integration/            # Integration tests
│   └── api/
│       ├── products.test.ts
│       ├── auth.test.ts
│       └── ...
├── unit/                   # Unit tests
│   ├── lib/
│   │   └── uom-conversion.test.ts
│   └── services/
│       ├── product.service.test.ts
│       └── ...
└── helpers/                # Test utilities
    ├── api-test-utils.ts
    └── test-db-utils.ts
```

### Test Helpers & Utilities

**File**: `tests/helpers/api-test-utils.ts`

Provides helper functions for creating test data:
- `createTestProduct()` - Create test product
- `createTestSupplier()` - Create test supplier
- `createTestWarehouse()` - Create test warehouse
- `cleanupTestData()` - Clean up after tests

**Usage**:
```typescript
import { createTestProduct, cleanupTestData } from '../helpers/api-test-utils';

const product = createTestProduct();
// ... use in tests
await cleanupTestData(prisma, { products: [product.id] });
```

---

## Best Practices

### 1. Test Naming
```typescript
// ✅ Good - Descriptive, clear intent
it('should return 404 when product does not exist', async () => {});

// ❌ Bad - Vague, unclear
it('test product', async () => {});
```

### 2. Arrange-Act-Assert Pattern
```typescript
it('should calculate discount correctly', () => {
  // Arrange - Set up test data
  const price = 100;
  const discountPercent = 20;
  
  // Act - Perform the action
  const result = applyDiscount(price, discountPercent);
  
  // Assert - Verify the result
  expect(result).toBe(80);
});
```

### 3. Test Independence
```typescript
// ✅ Good - Each test is independent
describe('Product Service', () => {
  beforeEach(async () => {
    await cleanDatabase(); // Fresh state for each test
  });
  
  it('test 1', () => {});
  it('test 2', () => {});
});

// ❌ Bad - Tests depend on each other
it('create product', () => { /* creates product */ });
it('update product', () => { /* assumes product from previous test exists */ });
```

### 4. Cleanup After Tests
```typescript
afterEach(async () => {
  // Clean up test data
  await prisma.product.deleteMany({
    where: { name: { startsWith: 'Test' } },
  });
});
```

### 5. Use Test IDs for E2E Tests
```tsx
// In component
<button data-testid="add-product-btn">Add Product</button>

// In test
await page.click('[data-testid="add-product-btn"]');
```

---

## Coverage Reports

### Generate Coverage
```bash
npm run test:coverage
```

### View Coverage
Open `coverage/index.html` in browser

### Coverage Goals
- **Unit Tests**: Aim for 80%+ coverage
- **Integration Tests**: Cover all API endpoints
- **E2E Tests**: Cover critical user flows

---

## CI/CD Integration

### GitHub Actions Example
```yaml
name: Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      
      - run: npm ci
      - run: npm run test:unit
      - run: npm run test:integration
        env:
          DATABASE_URL: ${{ secrets.TEST_DATABASE_URL }}
      - run: npm run test:e2e
```

---

## Troubleshooting

### Common Issues

#### 1. "Port 3000 already in use"
```bash
# Kill process on port 3000
npx kill-port 3000
# Or use a different port
PORT=3001 npm run dev
```

#### 2. "Database connection failed"
- Check `.env` file exists
- Verify `DATABASE_URL` is correct
- Run `npx prisma db push`

#### 3. "Playwright browsers not installed"
```bash
npx playwright install
```

#### 4. "Tests timing out"
- Increase timeout in test:
```typescript
test('slow test', async () => {
  test.setTimeout(60000); // 60 seconds
  // ... test code
});
```

---

## Quick Reference

### Vitest Assertions
```typescript
expect(value).toBe(expected)           // Strict equality
expect(value).toEqual(expected)        // Deep equality
expect(value).toBeDefined()            // Not undefined
expect(value).toBeNull()               // Is null
expect(value).toBeTruthy()             // Truthy value
expect(value).toContain(item)          // Array/string contains
expect(fn).toThrow(error)              // Function throws
```

### Playwright Assertions
```typescript
await expect(locator).toBeVisible()
await expect(locator).toHaveText('text')
await expect(locator).toHaveValue('value')
await expect(locator).toBeEnabled()
await expect(locator).toHaveCount(3)
```

### Playwright Actions
```typescript
await page.goto('/path')
await page.click('button')
await page.fill('input', 'value')
await page.selectOption('select', 'option')
await page.waitForSelector('.class')
await page.screenshot({ path: 'screenshot.png' })
```

---

## Additional Resources

- [Vitest Documentation](https://vitest.dev/)
- [Playwright Documentation](https://playwright.dev/)
- [Testing Best Practices](https://testingjavascript.com/)
- Project-specific: See `tests/REGRESSION_TESTS.md` for regression test suite details
