import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { prisma } from '@/lib/prisma';

describe('Products API Integration Tests', () => {
  let testProductId: string;

  beforeAll(async () => {
    // Setup test database
    await prisma.$connect();
  });

  afterAll(async () => {
    // Cleanup test data
    if (testProductId) {
      try {
        await prisma.product.delete({ where: { id: testProductId } });
      } catch (error) {
        // Ignore cleanup errors
      }
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

      const response = await fetch('http://localhost:3000/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newProduct),
      });

      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.data.name).toBe(newProduct.name);
      expect(data.data.category).toBe(newProduct.category);

      testProductId = data.data.id;
    });

    it('should return 400 for invalid product data', async () => {
      const invalidProduct = {
        name: '', // Invalid: empty name
        sku: '',
      };

      const response = await fetch('http://localhost:3000/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invalidProduct),
      });

      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
    });
  });

  describe('GET /api/products', () => {
    it('should return list of products', async () => {
      const response = await fetch('http://localhost:3000/api/products');
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(Array.isArray(data.data)).toBe(true);
    });

    it('should filter products by category', async () => {
      const response = await fetch('http://localhost:3000/api/products?category=Water');
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

      const response = await fetch(`http://localhost:3000/api/products/${testProductId}`);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.id).toBe(testProductId);
    });

    it('should return 404 for non-existent product', async () => {
      const response = await fetch('http://localhost:3000/api/products/non-existent-id');
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
    });
  });
});
