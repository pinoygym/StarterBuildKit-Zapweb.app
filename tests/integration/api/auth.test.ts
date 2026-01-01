import { describe, it, expect } from 'vitest';
import { BASE_URL } from '../config';
import * as fs from 'fs';
import * as path from 'path';
import { createTestUser, cleanupTestData } from '@/tests/helpers/test-db-utils'; // Import necessary helpers

describe('Auth API', () => {
  let testUser: any;
  let testUserPassword = 'TestUser123!'; // Define a password for the test user

  beforeAll(async () => {
    // Create a user directly in the DB for the "valid login" test
    testUser = await createTestUser({ password: testUserPassword });
    // Note: No API registration for testUser here, as this test focuses on login.
    // The user is created directly in the DB to ensure existence before login attempt.
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
    const login = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testUser.email, password: testUserPassword })
    });
    const setCookie = login.headers.get('set-cookie') || '';
    const loginBody = await login.json();

    if (login.status !== 200) {
      console.log('Login failed status:', login.status);
      console.log('Login failed body:', JSON.stringify(loginBody));
      fs.writeFileSync('c:/Users/HI/Documents/GitHub/_deve local/_React Apps/test/login-error.json', JSON.stringify({ status: login.status, body: loginBody }, null, 2));
    }
    expect(login.status).toBe(200);
    expect(loginBody.success).toBe(true);

    const me = await fetch(`${BASE_URL}/api/auth/me`, { headers: { 'Cookie': setCookie } });
    const meBody = await me.json();
    if (me.status !== 200) {
      console.log('Me failed status:', me.status);
      console.log('Me failed body:', JSON.stringify(meBody));
      fs.writeFileSync('c:/Users/HI/Documents/GitHub/_deve local/_React Apps/test/me-error.json', JSON.stringify({ status: me.status, body: meBody }, null, 2));
    }
    expect(me.status).toBe(200);
    expect(meBody.success).toBe(true);
  }, 20000);
});
