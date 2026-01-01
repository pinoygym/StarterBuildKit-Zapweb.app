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

  describe('PUT /api/products/:id', () => {
    it('should update product details', async () => {
      if (!testProductId) return;
      const updateData = {
        name: `Updated Product Name ${Date.now()}`,
        basePrice: 150,
      };
      const response = await fetch(`${BASE_URL}/api/products/${testProductId}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(updateData),
      });
      const data = await response.json();
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.name).toBe(updateData.name);
      expect(data.data.basePrice).toBe(updateData.basePrice);
    });
  });

  describe('DELETE /api/products/:id', () => {
    it('should delete (or deactivate) product', async () => {
      if (!testProductId) return;
      
      // First, update status to inactive if needed, or rely on Super Admin override
      // For integration test, let's try deleting directly. The API likely handles permission checks.
      // If strict mode is on, we might need to deactivate first.
      
      // Deactivate first
      const deactivateRes = await fetch(`${BASE_URL}/api/products/${testProductId}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ status: 'inactive' }),
      });
      expect(deactivateRes.status).toBe(200);

      const response = await fetch(`${BASE_URL}/api/products/${testProductId}`, {
        method: 'DELETE',
        headers,
      });
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);

      // Verify it's gone
      const getRes = await fetch(`${BASE_URL}/api/products/${testProductId}`, {
        headers,
      });
      expect(getRes.status).toBe(404);
      
      // Clear testProductId so afterAll doesn't try to delete it again
      testProductId = ''; 
    });
  });
});
