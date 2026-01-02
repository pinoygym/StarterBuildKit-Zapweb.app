import { defineConfig } from 'vitest/config';
import path from 'path';
import dotenv from 'dotenv';

// Load test environment variables BEFORE any other configuration
// This ensures tests run against the test database (neondb_test), not production
dotenv.config({ path: '.env.test' });

console.log('🧪 Vitest loading .env.test - Database:', process.env.DATABASE_URL?.includes('neondb_test') ? 'neondb_test ✅' : 'WARNING: Not using test DB!');

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
      DATABASE_URL: process.env.DATABASE_URL, // Ensure test DB is passed to tests
      JWT_SECRET: process.env.JWT_SECRET,
      NODE_ENV: 'test',
    },
    // Limit concurrency to prevent database connection pool exhaustion
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
