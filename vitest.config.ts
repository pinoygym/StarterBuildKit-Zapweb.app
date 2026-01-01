import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    environment: 'jsdom',
    include: ['**/*.test.ts', '**/*.test.tsx'],
    globals: true,
    setupFiles: ['./tests/setup.ts'],
    testTimeout: 120000,
    hookTimeout: 120000,
    env: {
      BASE_URL: process.env.BASE_URL || 'http://127.0.0.1:3000',
    },
    // Limit concurrency to prevent database connection pool exhaustion
    poolOptions: {
      threads: {
        maxThreads: 4,
        minThreads: 1,
      },
    },
    // Reduce concurrent test file execution
    maxConcurrency: 3,
    // For unit tests, isolate should be true to prevent cross-test pollution
    isolate: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
});
