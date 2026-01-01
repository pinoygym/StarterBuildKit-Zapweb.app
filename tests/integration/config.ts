const envBase = process.env.BASE_URL || process.env.VITEST_BASE_URL
export const BASE_URL = envBase && envBase.startsWith('http') ? envBase.replace(/\/$/, '') : 'http://localhost:3000'