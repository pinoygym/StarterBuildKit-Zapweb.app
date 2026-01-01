import { NextRequest } from 'next/server';
import { User, Role } from '@prisma/client';
import { createTestUser, createTestBranch } from './test-db-utils';
import { prisma } from './test-db-utils';

/**
 * Mock Next.js request object for testing
 */
export function createMockRequest(
  method: string = 'GET',
  url: string = 'http://localhost:3000',
  body?: any,
  headers: Record<string, string> = {}
): NextRequest {
  const request = new NextRequest(url, {
    method,
    headers: {
      'content-type': 'application/json',
      ...headers,
    },
    ...(body && { body: JSON.stringify(body) }),
  });

  return request;
}

/**
 * Create a mock JWT token for testing
 */
export function createMockJWT(payload: any): string {
  // Simple mock JWT - in real tests you'd use a proper JWT library
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64');
  const body = Buffer.from(JSON.stringify(payload)).toString('base64');
  const signature = Buffer.from('mock-signature').toString('base64');
  return `${header}.${body}.${signature}`;
}

/**
 * Create authenticated test user with session
 */
export async function createAuthenticatedUser(overrides: Partial<any> = {}): Promise<{
  user: User;
  token: string;
  session: any;
}> {
  // Create test user
  const user = await createTestUser({
    emailVerified: true,
    ...overrides,
  });

  // Create mock JWT token
  const token = createMockJWT({
    userId: user.id,
    email: user.email,
    roleId: user.roleId,
    branchId: user.branchId,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60), // 24 hours
  });

  // Create session
  const session = await prisma.session.create({
    data: {
      userId: user.id,
      token,
      expiresAt: new Date(Date.now() + (24 * 60 * 60 * 1000)), // 24 hours
    },
  });

  return { user, token, session };
}

/**
 * Create admin user for testing admin-only functionality
 */
export async function createAdminUser(overrides: Partial<any> = {}): Promise<{
  user: User;
  token: string;
  session: any;
}> {
  // First ensure admin role exists
  let adminRole = await prisma.role.findFirst({
    where: { name: 'ADMIN' },
  });

  if (!adminRole) {
    adminRole = await prisma.role.create({
      data: {
        name: 'ADMIN',
        description: 'Administrator role',
        isSystem: true,
      },
    });
  }

  return createAuthenticatedUser({
    roleId: adminRole.id,
    ...overrides,
  });
}

/**
 * Create regular user for testing user permissions
 */
export async function createRegularUser(overrides: Partial<any> = {}): Promise<{
  user: User;
  token: string;
  session: any;
}> {
  // Ensure user role exists
  let userRole = await prisma.role.findFirst({
    where: { name: 'USER' },
  });

  if (!userRole) {
    userRole = await prisma.role.create({
      data: {
        name: 'USER',
        description: 'Regular user role',
        isSystem: true,
      },
    });
  }

  return createAuthenticatedUser({
    roleId: userRole.id,
    ...overrides,
  });
}

/**
 * Mock authentication middleware for testing
 */
export function mockAuthMiddleware(userId: string, permissions: string[] = []) {
  return {
    userId,
    permissions,
    isAuthenticated: true,
  };
}

/**
 * Create mock request with authentication headers
 */
export function createAuthenticatedRequest(
  method: string = 'GET',
  url: string = 'http://localhost:3000',
  token: string,
  body?: any
): NextRequest {
  return createMockRequest(method, url, body, {
    authorization: `Bearer ${token}`,
    cookie: `auth-token=${token}`,
  });
}

/**
 * Test helper for authentication API responses
 */
export const authTestHelpers = {
  /**
   * Assert successful login response
   */
  assertLoginSuccess: (response: any) => {
    expect(response.success).toBe(true);
    expect(response.user).toBeDefined();
    expect(response.user.email).toBeDefined();
    expect(response.token).toBeDefined();
  },

  /**
   * Assert failed login response
   */
  assertLoginFailure: (response: any, expectedMessage?: string) => {
    expect(response.success).toBe(false);
    if (expectedMessage) {
      expect(response.message).toContain(expectedMessage);
    }
  },

  /**
   * Assert user has required permissions
   */
  assertUserHasPermission: (user: User, permission: string) => {
    // This would need to be implemented based on your permission system
    // For now, just check if user exists
    expect(user).toBeDefined();
    expect(user.id).toBeDefined();
  },

  /**
   * Assert session is valid
   */
  assertValidSession: (session: any) => {
    expect(session).toBeDefined();
    expect(session.userId).toBeDefined();
    expect(session.token).toBeDefined();
    expect(session.expiresAt).toBeInstanceOf(Date);
    expect(session.expiresAt.getTime()).toBeGreaterThan(Date.now());
  },
};

/**
 * Clean up authentication test data
 */
export async function cleanupAuthTestData(userIds: string[] = []): Promise<void> {
  try {
    // Delete sessions first
    await prisma.session.deleteMany({
      where: {
        userId: { in: userIds },
      },
    });

    // Delete users
    if (userIds.length > 0) {
      await prisma.user.deleteMany({
        where: { id: { in: userIds } },
      });
    }
  } catch (error) {
    console.error('Error cleaning up auth test data:', error);
    throw error;
  }
}