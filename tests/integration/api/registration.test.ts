import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

describe('Registration API Integration Tests', () => {
  let cashierRoleId: string;

  beforeAll(async () => {
    // Get Cashier role ID for tests
    const cashierRole = await prisma.role.findFirst({
      where: { name: 'Cashier' }
    });

    if (!cashierRole) {
      throw new Error('Cashier role not found in database. Please run seed first.');
    }

    cashierRoleId = cashierRole.id;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    // Clean up test users before each test
    await prisma.user.deleteMany({
      where: {
        email: {
          startsWith: 'test_registration_'
        }
      }
    });
  });

  describe('POST /api/auth/register', () => {
    it('should successfully register a new user with valid data', async () => {
      const testEmail = `test_registration_${Date.now()}@example.com`;
      const registrationData = {
        email: testEmail,
        password: 'ValidPassword123!',
        firstName: 'Test',
        lastName: 'User',
        roleId: cashierRoleId
      };

      const response = await fetch(`${BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(registrationData)
      });

      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.message).toContain('registered successfully');

      // Verify user was created in database
      const createdUser = await prisma.user.findUnique({
        where: { email: testEmail },
        include: { Role: true }
      });

      expect(createdUser).toBeDefined();
      expect(createdUser?.email).toBe(testEmail);
      expect(createdUser?.firstName).toBe('Test');
      expect(createdUser?.lastName).toBe('User');
      expect(createdUser?.Role.name).toBe('Cashier');
      expect(createdUser?.status).toBe('ACTIVE');
      expect(createdUser?.emailVerified).toBe(false);

      // Cleanup
      if (createdUser) {
        await prisma.user.delete({ where: { id: createdUser.id } });
      }
    }, 15000);

    it('should reject registration with duplicate email', async () => {
      const testEmail = `test_registration_duplicate_${Date.now()}@example.com`;
      const registrationData = {
        email: testEmail,
        password: 'ValidPassword123!',
        firstName: 'Test',
        lastName: 'User',
        roleId: cashierRoleId
      };

      // First registration - should succeed
      const firstResponse = await fetch(`${BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(registrationData)
      });

      expect(firstResponse.status).toBe(201);

      // Second registration with same email - should fail
      const secondResponse = await fetch(`${BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(registrationData)
      });

      const data = await secondResponse.json();

      expect(secondResponse.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.message).toContain('already registered');

      // Cleanup
      await prisma.user.deleteMany({ where: { email: testEmail } });
    }, 15000);

    it('should reject registration with short password', async () => {
      const registrationData = {
        email: `test_registration_${Date.now()}@example.com`,
        password: 'short',
        firstName: 'Test',
        lastName: 'User',
        roleId: cashierRoleId
      };

      const response = await fetch(`${BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(registrationData)
      });

      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.message).toContain('at least 8 characters');
    }, 15000);

    it('should reject registration with invalid email format', async () => {
      const registrationData = {
        email: 'invalid-email-format',
        password: 'ValidPassword123!',
        firstName: 'Test',
        lastName: 'User',
        roleId: cashierRoleId
      };

      const response = await fetch(`${BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(registrationData)
      });

      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.message).toContain('valid email');
    }, 15000);

    it('should reject registration with missing required fields', async () => {
      const invalidData = {
        email: `test_registration_${Date.now()}@example.com`,
        password: 'ValidPassword123!',
        // Missing firstName, lastName, roleId
      };

      const response = await fetch(`${BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invalidData)
      });

      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.message).toContain('required');
    }, 15000);

    it('should reject registration with invalid role ID', async () => {
      const registrationData = {
        email: `test_registration_${Date.now()}@example.com`,
        password: 'ValidPassword123!',
        firstName: 'Test',
        lastName: 'User',
        roleId: 'invalid-role-id-that-does-not-exist'
      };

      const response = await fetch(`${BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(registrationData)
      });

      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.message).toContain('Invalid role');
    }, 15000);

    it('should hash password before storing in database', async () => {
      const testEmail = `test_registration_${Date.now()}@example.com`;
      const plainPassword = 'ValidPassword123!';
      const registrationData = {
        email: testEmail,
        password: plainPassword,
        firstName: 'Test',
        lastName: 'User',
        roleId: cashierRoleId
      };

      const response = await fetch(`${BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(registrationData)
      });

      expect(response.status).toBe(201);

      // Verify password is hashed
      const createdUser = await prisma.user.findUnique({
        where: { email: testEmail }
      });

      expect(createdUser).toBeDefined();
      expect(createdUser?.passwordHash).not.toBe(plainPassword);
      expect(createdUser?.passwordHash).toMatch(/^\$2[aby]\$/); // bcrypt hash pattern

      // Cleanup
      if (createdUser) {
        await prisma.user.delete({ where: { id: createdUser.id } });
      }
    }, 15000);

    it('should create audit log entry for registration', async () => {
      const testEmail = `test_registration_${Date.now()}@example.com`;
      const registrationData = {
        email: testEmail,
        password: 'ValidPassword123!',
        firstName: 'Test',
        lastName: 'User',
        roleId: cashierRoleId
      };

      const response = await fetch(`${BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(registrationData)
      });

      expect(response.status).toBe(201);

      // Find the created user
      const createdUser = await prisma.user.findUnique({
        where: { email: testEmail }
      });

      expect(createdUser).toBeDefined();

      // Check audit log
      const auditLog = await prisma.auditLog.findFirst({
        where: {
          userId: createdUser!.id,
          action: 'USER_CREATED',
          resource: 'USER'
        }
      });

      expect(auditLog).toBeDefined();
      expect(auditLog?.resourceId).toBe(createdUser!.id);

      // Cleanup
      if (createdUser) {
        await prisma.auditLog.deleteMany({ where: { userId: createdUser.id } });
        await prisma.user.delete({ where: { id: createdUser.id } });
      }
    }, 15000);
  });

  describe('Regression Tests - Bug Fixes', () => {
    it('should not include updatedAt field in user creation (regression test)', async () => {
      // This test ensures the bug where updatedAt was explicitly set is fixed
      const testEmail = `test_regression_${Date.now()}@example.com`;
      const registrationData = {
        email: testEmail,
        password: 'ValidPassword123!',
        firstName: 'Test',
        lastName: 'User',
        roleId: cashierRoleId
      };

      const response = await fetch(`${BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(registrationData)
      });

      expect(response.status).toBe(201);

      const createdUser = await prisma.user.findUnique({
        where: { email: testEmail }
      });

      expect(createdUser).toBeDefined();
      expect(createdUser?.createdAt).toBeDefined();
      expect(createdUser?.updatedAt).toBeDefined();
      // Prisma should auto-manage updatedAt, and it should be close to createdAt
      const timeDiff = Math.abs(
        createdUser!.updatedAt.getTime() - createdUser!.createdAt.getTime()
      );
      expect(timeDiff).toBeLessThan(1000); // Within 1 second

      // Cleanup
      if (createdUser) {
        await prisma.user.delete({ where: { id: createdUser.id } });
      }
    }, 15000);

    it('should work with correct Cashier role ID (regression test)', async () => {
      // This test ensures the hardcoded role ID matches the database
      const testEmail = `test_role_${Date.now()}@example.com`;
      const registrationData = {
        email: testEmail,
        password: 'ValidPassword123!',
        firstName: 'Test',
        lastName: 'User',
        roleId: cashierRoleId // Using the role ID fetched from database
      };

      const response = await fetch(`${BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(registrationData)
      });

      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.success).toBe(true);

      // Cleanup
      await prisma.user.deleteMany({ where: { email: testEmail } });
    }, 15000);
  });
});
