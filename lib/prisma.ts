import { PrismaClient } from '@prisma/client';
import { logger } from './logger';

// Prevent multiple instances of Prisma Client in development
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Optimized Prisma Client configuration
export const prisma = globalForPrisma.prisma ?? new PrismaClient({
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

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

// Graceful shutdown
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});
