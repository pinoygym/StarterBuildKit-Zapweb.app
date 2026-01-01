import { beforeEach, afterEach, afterAll, beforeAll } from 'vitest';
import { TestDataIds, initializeTestDatabase, cleanupTestData, resetTestDatabase } from './test-db-utils';
import { setupCommonMocks } from './mock-services';

/**
 * Base test class for database-dependent tests
 */
export class DatabaseTestBase {
  protected testDataIds: TestDataIds = {
    users: [],
    branches: [],
    warehouses: [],
    suppliers: [],
    products: [],
    purchaseOrders: [],
    receivingVouchers: [],
    salesOrders: [],
    inventoryBatches: [],
    customers: [],
    expenses: [],
    ar: [],
    ap: [],
  };

  async setup() {
    // Initialize test database with basic data
    this.testDataIds = await initializeTestDatabase();
  }

  async teardown() {
    // Clean up test data
    await cleanupTestData(this.testDataIds);
  }

  async reset() {
    // Reset entire database (use with caution)
    await resetTestDatabase();
  }
}

/**
 * Base test class for API route tests
 */
export class ApiTestBase extends DatabaseTestBase {
  protected baseUrl = 'http://localhost:3000';

  async setup() {
    await super.setup();
    setupCommonMocks();
  }
}

/**
 * Base test class for component tests
 */
export class ComponentTestBase {
  async setup() {
    setupCommonMocks();
  }

  async teardown() {
    // Component cleanup if needed
  }
}

/**
 * Test utilities for common testing patterns
 */
export const TestUtils = {
  /**
   * Create a test wrapper with common setup/teardown
   */
  createTestSuite: (description: string, setupFn?: () => Promise<void>, teardownFn?: () => Promise<void>) => {
    return {
      setup: async () => {
        setupCommonMocks();
        if (setupFn) await setupFn();
      },
      teardown: async () => {
        if (teardownFn) await teardownFn();
      },
      describe: (name: string, fn: () => void) => {
        describe(`${description} - ${name}`, fn);
      }
    };
  },

  /**
   * Retry utility for flaky tests
   */
  retry: async <T>(fn: () => Promise<T>, maxRetries: number = 3, delay: number = 1000): Promise<T> => {
    let lastError: Error;

    for (let i = 0; i < maxRetries; i++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error as Error;
        if (i < maxRetries - 1) {
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError!;
  },

  /**
   * Wait utility for async operations
   */
  wait: (ms: number): Promise<void> => {
    return new Promise(resolve => setTimeout(resolve, ms));
  },

  /**
   * Measure execution time of a function
   */
  measureTime: async <T>(fn: () => Promise<T>): Promise<{ result: T; duration: number }> => {
    const start = performance.now();
    const result = await fn();
    const end = performance.now();
    return { result, duration: end - start };
  },

  /**
   * Generate random test data
   */
  generate: {
    id: () => Math.random().toString(36).substr(2, 9),
    email: () => `test-${Date.now()}@example.com`,
    phone: () => `+1${Math.floor(Math.random() * 9000000000) + 1000000000}`,
    name: () => `Test ${Math.random().toString(36).substr(2, 5)}`,
    address: () => `${Math.floor(Math.random() * 999)} Test Street`,
    number: (min: number = 0, max: number = 100) => Math.floor(Math.random() * (max - min + 1)) + min,
    decimal: (min: number = 0, max: number = 100, decimals: number = 2) => {
      const num = Math.random() * (max - min) + min;
      return Number(num.toFixed(decimals));
    },
    date: (daysFromNow: number = 0) => {
      const date = new Date();
      date.setDate(date.getDate() + daysFromNow);
      return date;
    },
    boolean: () => Math.random() > 0.5,
    array: <T>(generator: () => T, length: number = 5): T[] => {
      return Array.from({ length }, generator);
    },
    product: (overrides: any = {}) => ({
      id: TestUtils.generate.id(),
      name: TestUtils.generate.name(),
      description: `Description for ${TestUtils.generate.name()}`,
      category: 'Carbonated' as const,
      imageUrl: null,
      basePrice: TestUtils.generate.decimal(10, 1000),
      baseUOM: 'PCS',
      minStockLevel: TestUtils.generate.number(1, 50),
      shelfLifeDays: TestUtils.generate.number(30, 365),
      status: 'active' as const,
      createdAt: new Date(),
      updatedAt: new Date(),
      alternateUOMs: [],
      ...overrides,
    }),
    branch: (overrides: any = {}) => ({
      id: TestUtils.generate.id(),
      name: TestUtils.generate.name(),
      code: `BR${TestUtils.generate.number(100, 999)}`,
      location: TestUtils.generate.address(),
      phone: TestUtils.generate.phone(),
      manager: TestUtils.generate.name(),
      status: 'active' as const,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides,
    }),
  },

  /**
   * Assertion helpers
   */
  assert: {
    isValidUUID: (str: string) => {
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      expect(str).toMatch(uuidRegex);
    },

    isValidEmail: (email: string) => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      expect(email).toMatch(emailRegex);
    },

    isValidPhone: (phone: string) => {
      const phoneRegex = /^\+?[\d\s\-\(\)]+$/;
      expect(phone).toMatch(phoneRegex);
    },

    isPositiveNumber: (num: number) => {
      expect(num).toBeGreaterThan(0);
    },

    isNonNegativeNumber: (num: number) => {
      expect(num).toBeGreaterThanOrEqual(0);
    },

    isValidDate: (date: any) => {
      expect(date).toBeInstanceOf(Date);
      expect(date.getTime()).not.toBeNaN();
    },

    arraysEqual: <T>(arr1: T[], arr2: T[]) => {
      expect(arr1).toHaveLength(arr2.length);
      arr1.forEach((item, index) => {
        expect(item).toEqual(arr2[index]);
      });
    },

    containsAll: <T>(array: T[], items: T[]) => {
      items.forEach(item => {
        expect(array).toContain(item);
      });
    },
  },

  /**
   * Mock helpers
   */
  mock: {
    apiResponse: (data: any, success: boolean = true) => ({
      success,
      data: success ? data : null,
      error: success ? null : data,
    }),

    paginatedResponse: (items: any[], total: number, page: number = 1, limit: number = 10) => ({
      success: true,
      data: items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    }),

    errorResponse: (message: string, code: string = 'ERROR') => ({
      success: false,
      error: { message, code },
    }),
  },
};

/**
 * Global test hooks for consistent setup across all tests
 */
export const setupGlobalTestHooks = () => {
  beforeAll(async () => {
    // Global setup - runs once before all tests
    console.log('Setting up global test environment...');
  });

  afterAll(async () => {
    // Global teardown - runs once after all tests
    console.log('Cleaning up global test environment...');
  });

  beforeEach(async () => {
    // Setup before each test
    setupCommonMocks();
  });

  afterEach(async () => {
    // Cleanup after each test
    // Reset any global state if needed
  });
};

/**
 * Performance testing utilities
 */
export const PerformanceTestUtils = {
  /**
   * Measure execution time of a function
   */
  measureTime: async <T>(fn: () => Promise<T>): Promise<{ result: T; duration: number }> => {
    const start = performance.now();
    const result = await fn();
    const end = performance.now();
    return { result, duration: end - start };
  },

  /**
   * Assert that a function executes within a time limit
   */
  assertExecutionTime: async (
    fn: () => Promise<any>,
    maxTimeMs: number,
    description: string = 'Function execution'
  ) => {
    const { duration } = await TestUtils.measureTime(fn);
    expect(duration).toBeLessThan(maxTimeMs);
    console.log(`${description} took ${duration.toFixed(2)}ms`);
  },

  /**
   * Run performance benchmarks
   */
  benchmark: async (
    name: string,
    fn: () => Promise<any>,
    iterations: number = 100
  ): Promise<{ average: number; min: number; max: number; total: number }> => {
    const times: number[] = [];

    for (let i = 0; i < iterations; i++) {
      const { duration } = await TestUtils.measureTime(fn);
      times.push(duration);
    }

    const total = times.reduce((sum, time) => sum + time, 0);
    const average = total / iterations;
    const min = Math.min(...times);
    const max = Math.max(...times);

    console.log(`Benchmark: ${name}`);
    console.log(`  Iterations: ${iterations}`);
    console.log(`  Average: ${average.toFixed(2)}ms`);
    console.log(`  Min: ${min.toFixed(2)}ms`);
    console.log(`  Max: ${max.toFixed(2)}ms`);
    console.log(`  Total: ${total.toFixed(2)}ms`);

    return { average, min, max, total };
  },
};