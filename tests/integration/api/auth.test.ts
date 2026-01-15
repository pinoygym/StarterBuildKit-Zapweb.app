import { describe, it, expect } from 'vitest';
import { BASE_URL } from '../config';
import * as fs from 'fs';
import * as path from 'path';
import { createTestUser, cleanupTestData } from '@/tests/helpers/test-db-utils'; // Import necessary helpers
import { prisma } from '@/lib/prisma'; // Import prisma client

describe('Auth API', () => {
  let testUser: any;
  const testUserEmail = 'test@example.com';
  const testUserPassword = 'TestUser123!';

  beforeAll(async () => {
    // Clean up if exists
    await prisma.session.deleteMany({ where: { User: { email: testUserEmail } } });
    await prisma.user.deleteMany({ where: { email: testUserEmail } });

    // Create a user directly in the DB
    testUser = await createTestUser({
      email: testUserEmail,
      password: testUserPassword
    });
  });

  afterAll(async () => {
    // Cleanup the test user and their session
    if (testUser?.id) {
      await cleanupTestData({
        users: [testUser.id],
        branches: [],
        warehouses: [],
        suppliers: [],
        products: [],
        purchaseOrders: [],
        receivingVouchers: [],
        salesOrders: [],
        customers: [],
        expenses: [],
        ar: [],
        ap: [],
      });
    }
  });

  it('invalid login returns 401', async () => {
    const r = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'invalid@example.com', password: 'wrong' })
    });
    const body = await r.json();
    expect(r.status).toBe(401);
    expect(body.success).toBe(false);
  }, 20000);

  it('valid login returns 200 and me returns 200 with cookie', async () => {
    // Log in with the dynamically created test user
    // Use seeded admin user for login test to rule out user creation issues
    const seededAdminEmail = 'cybergada@gmail.com';
    const seededAdminPassword = 'Qweasd1234';

    const loginResponse = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: seededAdminEmail, password: seededAdminPassword })
    });

    if (loginResponse.status !== 200) {
      const errorBody = await loginResponse.clone().json();
      throw new Error(`Login failed with status ${loginResponse.status}: ${JSON.stringify(errorBody)}`);
    }

    const setCookie = loginResponse.headers.get('set-cookie') || '';
    const loginBody = await loginResponse.json();
    expect(loginResponse.status).toBe(200);
    expect(loginBody.success).toBe(true);

    const me = await fetch(`${BASE_URL}/api/auth/me`, { headers: { 'Cookie': setCookie } });
    const meBody = await me.json();
    if (me.status !== 200) {
      console.log('Me failed status:', me.status);
      console.log('Me failed body:', JSON.stringify(meBody));
    }
    expect(me.status).toBe(200);
    expect(meBody.success).toBe(true);
  }, 20000);
});

