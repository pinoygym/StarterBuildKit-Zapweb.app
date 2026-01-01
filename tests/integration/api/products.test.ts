import { prisma } from '@/lib/prisma';
import { BASE_URL } from '../config';

describe('Products API Integration Tests', () => {
  let token: string;
  let headers: any;
  let testProductId: string;

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

    // Connect Prisma
    await prisma.$connect();
  });

  afterAll(async () => {
    if (testProductId) {
      try {
        await prisma.product.delete({ where: { id: testProductId } });
      } catch { }
    }
    await prisma.$disconnect();
  });

  describe('POST /api/products', () => {
    it('should create a new product', async () => {
      const timestamp = Date.now();
      const newProduct = {
        name: `Integration Test Product ${timestamp}`,
        category: 'Water',
        basePrice: 100,
        baseUOM: 'pcs',
        minStockLevel: 10,
        shelfLifeDays: 365,
      };
      const response = await fetch(`${BASE_URL}/api/products`, {
        method: 'POST',
        headers,
        body: JSON.stringify(newProduct),
      });
      const data = await response.json();
      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      testProductId = data.data.id;
    });

    it('should return 400 for invalid product data', async () => {
      const invalidProduct = {
        name: '',
        sku: '',
      };
      const response = await fetch(`${BASE_URL}/api/products`, {
        method: 'POST',
        headers,
        body: JSON.stringify(invalidProduct),
      });
      const data = await response.json();
      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
    });
  });

  describe('GET /api/products', () => {
    it('should return list of products', async () => {
      const response = await fetch(`${BASE_URL}/api/products`, {
        headers,
      });
      const data = await response.json();
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(Array.isArray(data.data)).toBe(true);
    });

    it('should filter products by category', async () => {
      const response = await fetch(`${BASE_URL}/api/products?category=Water`, {
        headers,
      });
      const data = await response.json();
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      if (data.data.length > 0) {
        expect(data.data.every((p: any) => p.category === 'Water')).toBe(true);
      }
    });
  });

  describe('GET /api/products/:id', () => {
    it('should return a product by ID', async () => {
      if (!testProductId) return;
      const response = await fetch(`${BASE_URL}/api/products/${testProductId}`, {
        headers,
      });
      const data = await response.json();
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.id).toBe(testProductId);
    });

    it('should return 404 for non-existent product', async () => {
      const response = await fetch(`${BASE_URL}/api/products/non-existent-id`, {
        headers,
      });
      const data = await response.json();
      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
    });
  });
});
