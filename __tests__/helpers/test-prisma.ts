import { PrismaClient } from '@prisma/client';
import { mockDeep, mockReset, DeepMockProxy } from 'vitest-mock-extended';

export type MockPrismaClient = DeepMockProxy<PrismaClient>;

export const prismaMock = mockDeep<PrismaClient>();

export const resetPrismaMock = () => {
  mockReset(prismaMock);
};

// Helper to setup Prisma mock for tests
export const setupPrismaMock = () => {
  return prismaMock;
};
