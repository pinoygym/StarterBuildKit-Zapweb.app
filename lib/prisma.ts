import { PrismaClient, Prisma } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { logger } from './logger';

// Re-export Prisma namespace for use in services
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
  console.error('DATABASE_URL is not defined in lib/prisma.ts');
} else {
  console.log('Initializing Prisma with DATABASE_URL:', connectionString.substring(0, 20) + '...');
}

// Create PostgreSQL connection pool
const pool = globalForPrisma.pool ?? new Pool({ connectionString });
const adapter = new PrismaPg(pool);

// Optimized Prisma Client configuration
export const prisma = globalForPrisma.prisma ?? new PrismaClient({
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
});

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
  globalForPrisma.pool = pool;
}

// Graceful shutdown
process.on('beforeExit', async () => {
  await prisma.$disconnect();
  await pool.end();
});
