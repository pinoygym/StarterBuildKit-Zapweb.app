import { describe, it, expect, beforeAll } from 'vitest';
import { BASE_URL } from '../config';

describe('Warehouses API', () => {
  let token: string;
  let headers: any;

  beforeAll(async () => {
    // 1. Seed data
    const seedRes = await fetch(`${BASE_URL}/api/dev/seed`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}) })
    const seed = await seedRes.json()

    if (!seed.success) {
      console.error('Seed failed:', JSON.stringify(seed, null, 2))
      throw new Error('Seed failed')
    }

    // 2. Login to get token
    const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'cybergada@gmail.com',
        password: 'Qweasd145698@',
      }),
    })
    const loginData = await loginRes.json()

    if (!loginData.success) {
      console.error('Login failed:', JSON.stringify(loginData, null, 2))
      throw new Error('Login failed')
    }

    token = loginData.token
    headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    }
  });

  it('lists warehouses', async () => {
    const r = await fetch(`${BASE_URL}/api/warehouses`, { headers });
    const body = await r.json();
    expect(r.status).toBe(200);
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data)).toBe(true);
  }, 20000);
});

