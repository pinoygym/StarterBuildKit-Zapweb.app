import dotenv from 'dotenv';
import path from 'path';

// Load .env.local first (prioritize local dev env)
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config();

console.log('Setup: DATABASE_URL is', process.env.DATABASE_URL ? 'defined' : 'undefined');

import { vi, expect } from 'vitest';
import * as matchers from '@testing-library/jest-dom/matchers';

// Extend expect with jest-dom matchers
expect.extend(matchers);

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}));

// ---------- Test auth helper ----------
import { createTestUser } from './helpers/test-db-utils';
import { loginUserViaApi, initializeTestDatabase } from './helpers/test-db-utils';

let authHeaders: Record<string, string> = {};
let testUserId: string = '';

export async function initTestAuth(baseUrl: string = process.env.BASE_URL || 'http://localhost:3000') {
  // Create a test user directly in DB
  const testUser = await createTestUser();
  testUserId = testUser.id;

  // Initialize other required test data (branch, warehouse, etc.)
  const testData = await initializeTestDatabase();
  // Store IDs if needed for later use (optional)
  // e.g., global.testDataIds = testData;

  // Log in via API to obtain JWT token
  const loginResult = await loginUserViaApi({ email: testUser.email, password: testUser.password }, baseUrl);
  authHeaders = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${loginResult.token}`,
  };
}

export function getAuthHeaders() {
  return authHeaders;
}

export function getTestUserId() {
  return testUserId;
}

// Ensure initTestAuth runs before all tests
// Skip for unit tests that don't need real database access (they mock everything)
if (process.env.NODE_ENV !== 'production') {
  beforeAll(async () => {
    // Only initialize auth if tests need real API access
    // Unit tests with fully mocked dependencies should skip this
    const testPath = expect.getState().testPath || '';
    const isIntegrationTest = testPath.includes('tests/integration') ||
      testPath.includes('tests/e2e');

    // Skip initialization for unit tests - they should mock their dependencies
    if (isIntegrationTest) {
      try {
        await initTestAuth();
      } catch (error) {
        console.warn('Test auth initialization failed, tests may need to handle auth independently:', error);
        // Don't throw - let individual tests handle auth as needed
      }
    }
  }, 30000); // Increase timeout for integration tests
}
