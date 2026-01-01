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

