// Note: Environment variables are loaded by vitest.config.ts from .env.test
// Do NOT load .env.local here as it would override the test configuration

console.log('Setup: DATABASE_URL is', process.env.DATABASE_URL ? 'defined' : 'undefined');
console.log('Setup: Using database:', process.env.DATABASE_URL?.includes('neondb') ? 'neondb (production)' : 'test');

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
  // Use the seeded admin user instead of creating a new one
  // This avoids Prisma client initialization issues in setup
  const seededAdmin = {
    email: 'cybergada@gmail.com',
    password: 'Qweasd1234',
  };

  try {
    // Log in via API to obtain JWT token
    const loginResult = await loginUserViaApi(seededAdmin, baseUrl);
    authHeaders = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${loginResult.token}`,
    };
    testUserId = 'seeded-admin';
    console.log('Test auth initialized successfully using seeded admin');
  } catch (error: any) {
    console.warn('Login failed in beforeAll:', error.message);
    // Don't throw - let individual tests handle auth as needed
  }
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
  }, 120000); // Increase timeout for integration tests
}
