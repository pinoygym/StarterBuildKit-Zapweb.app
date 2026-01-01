import dotenv from 'dotenv';
const envState = `[${new Date().toISOString()}] NODE_ENV: ${process.env.NODE_ENV}, IS_PLAYWRIGHT: ${process.env.IS_PLAYWRIGHT}`;
try {
  const fs = require('fs');
  fs.appendFileSync('prisma_debug.log', `${envState}\n`);
} catch (e) { }

if (process.env.NODE_ENV === 'test' || process.env.IS_PLAYWRIGHT === 'true') {
  dotenv.config({ path: '.env.test', override: true });
} else {
  dotenv.config({ path: '.env.local' });
}

const dbUrlLog = `[${new Date().toISOString()}] DB URL HOST: ${process.env.DATABASE_URL?.split('@')[1]?.split('/')[0] || 'unknown'}`;
try {
  const fs = require('fs');
  fs.appendFileSync('prisma_debug.log', `${dbUrlLog}\n\n`);
} catch (e) { }

import { PrismaClient, Prisma } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { logger } from './logger';

export { Prisma };

// Prevent multiple instances of Prisma Client in development
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  pool: Pool | undefined;
};

const connectionString = process.env.DATABASE_URL?.includes('localhost')
  ? process.env.DATABASE_URL.replace('localhost', '127.0.0.1')
  : process.env.DATABASE_URL;

if (!connectionString) {
  logger.error('DATABASE_URL is not defined in lib/prisma.ts');
} else {
  const host = connectionString.split('@')[1]?.split('/')[0];
  const dbName = connectionString.split('/').pop()?.split('?')[0];
  logger.info(`Initializing Prisma with Host: ${host}, DB: ${dbName}`);
  console.log(`[DEBUG] Prisma Source: ${process.env.NODE_ENV === 'test' ? '.env.test' : '.env.local'} | Host: ${host}`);
}

// Create PostgreSQL connection pool
const pool = globalForPrisma.pool ?? new Pool({ connectionString });
const adapter = new PrismaPg(pool);

// Optimized Prisma Client configuration
const prismaConfig: any = {
  adapter,
  log: [
    {
      emit: 'event',
      level: 'query',
    },
    {
      emit: 'event',
      level: 'error',
    },
    {
      emit: 'event',
      level: 'warn',
    },
  ],
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient(prismaConfig);

// Log slow queries in development
if (process.env.NODE_ENV === 'development') {
  prisma.$on('query' as never, (e: any) => {
    if (e.duration > 1000) {
      // Log queries taking more than 1 second
      logger.warn('Slow query detected', {
        query: e.query,
        duration: `${e.duration}ms`,
        params: e.params,
      });
    }
  });
}

// Log errors
prisma.$on('error' as never, (e: any) => {
  logger.error('Prisma error', e instanceof Error ? e : undefined, {
    target: e.target,
    timestamp: e.timestamp,
    message: e.message,
  });
});

// Log warnings
prisma.$on('warn' as never, (e: any) => {
  logger.warn('Prisma warning', {
    message: e.message,
    timestamp: e.timestamp,
  });
});


if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
  if (pool) {
    globalForPrisma.pool = pool;
  }
}

// Graceful shutdown
process.on('beforeExit', async () => {
  await prisma.$disconnect();
  if (pool) {
    await pool.end();
  }
});
