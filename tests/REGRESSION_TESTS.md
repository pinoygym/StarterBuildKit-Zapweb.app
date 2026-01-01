# Registration Flow - Regression Test Suite

This document describes the comprehensive test suite created to prevent regression of the signup/registration flow bugs that were fixed.

## Bugs Fixed (Reference)

### Bug 1: 401 Unauthorized Errors on Page Load
- **Issue**: `AuthProvider` and `BranchProvider` were logging 401 errors on unauthenticated pages
- **Root Cause**: Both providers called protected APIs on mount without checking authentication state
- **Fix**: Added graceful handling of 401 responses - silently set empty state instead of logging errors

### Bug 2: 500 Internal Server Error on Registration
- **Issue**: Registration API was failing with 500 error
- **Root Causes**:
  - Hardcoded role ID didn't match database
  - `updatedAt` field was being set explicitly (conflicts with Prisma `@updatedAt`)
  - Poor error handling for Prisma errors
- **Fix**:
  - Used correct Cashier role ID from database
  - Removed explicit `updatedAt` field
  - Added Prisma error handling (P2002, P2003)

## Test Coverage

### 1. Integration Tests (`tests/integration/api/registration.test.ts`)

**Purpose**: Test the registration API endpoint end-to-end with real database operations

**Tests**:
- ✅ Successfully register a new user with valid data
- ✅ Reject registration with duplicate email
- ✅ Reject registration with short password
- ✅ Reject registration with invalid email format
- ✅ Reject registration with missing required fields
- ✅ Reject registration with invalid role ID
- ✅ Hash password before storing in database
- ✅ Create audit log entry for registration

**Regression Tests**:
- ✅ Ensure `updatedAt` is not explicitly set (Prisma auto-manages it)
- ✅ Ensure correct Cashier role ID is used

**Run Command**:
```bash
npm run test:integration
# or
npx vitest run tests/integration/api/registration.test.ts
```

### 2. E2E Tests (`tests/e2e/registration.spec.ts`)

**Purpose**: Test the complete user flow through the browser using Playwright

**Tests**:
- ✅ Display registration form with all required fields
- ✅ Successfully register a new user and redirect to login
- ✅ Show error for duplicate email
- ✅ Show error for short password
- ✅ Show error for invalid email format
- ✅ Disable submit button while form is submitting
- ✅ Navigate to login page when clicking sign in link

**Regression Tests**:
- ✅ **CRITICAL**: No 401 console errors on page load
- ✅ **CRITICAL**: Role ID is properly set when page loads
- ✅ Handle network errors gracefully
- ✅ Clear error message when user edits form

**Run Command**:
```bash
npm run test:e2e
# or
npx playwright test tests/e2e/registration.spec.ts
```

### 3. Unit Tests - Auth Context (`tests/unit/contexts/auth-context.test.tsx`)

**Purpose**: Test the `AuthProvider` context in isolation

**Tests**:
- ✅ Handle 401 response gracefully without console errors
- ✅ Set user to null and permissions to empty on 401
- ✅ Handle network errors and log them
- ✅ Load user data when API returns 200

**Regression Tests**:
- ✅ **CRITICAL**: Do not log 401 errors on public pages (signup/login)
- ✅ Properly reset state on 401 response

**Run Command**:
```bash
npm run test:unit
# or
npx vitest run tests/unit/contexts/auth-context.test.tsx
```

### 4. Unit Tests - Branch Context (`tests/unit/contexts/branch-context.test.tsx`)

**Purpose**: Test the `BranchProvider` context in isolation

**Tests**:
- ✅ Handle 401 response gracefully without console errors
- ✅ Set branches to empty array on 401
- ✅ Handle network errors and log them
- ✅ Load branches when API returns 200
- ✅ Restore selected branch from localStorage

**Regression Tests**:
- ✅ **CRITICAL**: Do not log 401 errors on public pages (signup/login)
- ✅ Properly handle empty branch list on 401

**Run Command**:
```bash
npm run test:unit
# or
npx vitest run tests/unit/contexts/branch-context.test.tsx
```

## Running All Tests

### Run All Tests at Once
```bash
npm run test:all
```

### Run Specific Test Suites
```bash
# Unit tests only
npm run test:unit

# Integration tests only
npm run test:integration

# E2E tests only
npm run test:e2e

# Watch mode (for development)
npm run test:watch
```

## CI/CD Integration

### Recommended CI Pipeline

```yaml
# Example GitHub Actions workflow
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm ci

      - name: Run unit tests
        run: npm run test:unit

      - name: Run integration tests
        run: npm run test:integration
        env:
          DATABASE_URL: ${{ secrets.TEST_DATABASE_URL }}

      - name: Run E2E tests
        run: npm run test:e2e
        env:
          DATABASE_URL: ${{ secrets.TEST_DATABASE_URL }}

      - name: Upload test results
        if: failure()
        uses: actions/upload-artifact@v3
        with:
          name: test-results
          path: |
            test-results/
            playwright-report/
```

## Test Maintenance

### When to Run These Tests

1. **Before every commit**: Run unit tests
   ```bash
   npm run test:unit
   ```

2. **Before every pull request**: Run all tests
   ```bash
   npm run test:all
   ```

3. **After modifying authentication code**: Run auth-related tests
   ```bash
   npx vitest run tests/unit/contexts/auth-context.test.tsx
   npx vitest run tests/integration/api/registration.test.ts
   npx playwright test tests/e2e/registration.spec.ts
   ```

4. **After database schema changes**: Run integration tests
   ```bash
   npm run test:integration
   ```

### Updating Tests

When modifying the registration flow, update these tests:

- **API changes**: Update `tests/integration/api/registration.test.ts`
- **UI changes**: Update `tests/e2e/registration.spec.ts`
- **Context changes**: Update `tests/unit/contexts/*.test.tsx`

### Adding New Tests

Follow this pattern:
1. Write a failing test that reproduces the bug
2. Fix the bug
3. Verify the test passes
4. Add the test to this documentation

## Test Data Management

### Database Cleanup

All tests automatically clean up test data:
- Integration tests: Clean up in `afterEach` and `afterAll` hooks
- E2E tests: Clean up in `afterEach` hook
- Test emails use prefixes like `test_registration_`, `e2e_test_`

### Test Roles

Tests rely on seeded roles:
- **Cashier role**: Used for public registration
- Run `npx prisma db seed` before running tests if roles are missing

## Coverage Reports

Generate coverage reports:
```bash
npm run test:coverage
```

View coverage in `coverage/index.html`

## Troubleshooting

### Tests Failing?

1. **Database issues**: Ensure test database is running and seeded
   ```bash
   npx prisma migrate dev
   npx prisma db seed
   ```

2. **Port conflicts**: Ensure dev server is running on correct port
   ```bash
   # Check BASE_URL in tests/integration/config.ts
   npm run dev
   ```

3. **Playwright issues**: Install browsers
   ```bash
   npx playwright install
   ```

4. **Environment variables**: Ensure `.env.test` is configured
   ```bash
   cp .env.example .env.test
   # Update DATABASE_URL, JWT_SECRET, etc.
   ```

## Success Criteria

All regression tests should:
- ✅ Pass on every commit
- ✅ Run in CI/CD pipeline
- ✅ Cover all fixed bugs
- ✅ Be maintainable and readable
- ✅ Clean up test data automatically

## Related Documentation

- [Test README](./README.md) - General testing information
- [Playwright Config](../playwright.config.ts) - E2E test configuration
- [Vitest Config](../vitest.config.ts) - Unit test configuration
