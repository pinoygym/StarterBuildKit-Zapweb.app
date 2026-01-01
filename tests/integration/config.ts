// Test configuration
const envBase = process.env.BASE_URL || process.env.VITEST_BASE_URL;
export const BASE_URL = envBase && envBase.startsWith('http')
    ? envBase.replace(/\/$/, '')
    : 'http://localhost:3000';

// Database configuration  
export const TEST_DATABASE_URL = process.env.DATABASE_URL;

// Test settings
export const TEST_TIMEOUT = 120000;
export const SKIP_DATABASE_RESET = process.env.SKIP_DATABASE_RESET === 'true';
