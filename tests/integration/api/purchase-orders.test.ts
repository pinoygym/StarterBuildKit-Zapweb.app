import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { BASE_URL } from '../config';

// Note: Database reset is not used here since we're using the main database

describe('Purchase Orders API Integration Tests', () => {
  let testPOId: string;
  let supplierId: string;
  let warehouseId: string;
  let branchId: string;
  let productId: string;
  let token: string;
  let headers: any;
  // BASE_URL is imported from ../config

  beforeAll(async () => {
    try {
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

      // Get Branch and Warehouse
      const warehousesRes = await fetch(`${BASE_URL}/api/warehouses`, { headers });
      const warehousesData = await warehousesRes.json();
      const warehouse = warehousesData.data?.[0];
      warehouseId = warehouse?.id;
      branchId = warehouse?.branchId;

      // Get Supplier
      const suppliersRes = await fetch(`${BASE_URL}/api/suppliers`, { headers });
      const suppliersData = await suppliersRes.json();
      supplierId = suppliersData.data?.[0]?.id;

      // Get Product
      const productsRes = await fetch(`${BASE_URL}/api/products`, { headers });
      const productsData = await productsRes.json();
      productId = productsData.data?.[0]?.id;

    } catch (e) {
      console.error('Setup failed', e);
      throw e;
    }
  });

  afterAll(async () => {
    // Cleanup is handled by the cancel test
  });

  describe('POST /api/purchase-orders', () => {
    it('should create a new purchase order', async () => {
      const timestamp = Date.now();
      const newPO = {
        supplierId,
        warehouseId,
        branchId,
        expectedDeliveryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        notes: `Integration Test PO ${timestamp}`,
        items: [
          {
            productId,
            quantity: 10,
            uom: 'bottle',
            unitPrice: 50,
            subtotal: 500,
          },
        ],
      };

      const response = await fetch(`${BASE_URL}/api/purchase-orders`, {
        method: 'POST',
        headers,
        body: JSON.stringify(newPO),
      });

      const data = await response.json();

      if (response.status !== 201) {
        console.error('Failed to create PO. Status:', response.status);
        console.error('Response:', JSON.stringify(data, null, 2));
      }

      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.data.status).toBe('draft');
      expect(data.data.poNumber).toBeDefined();

      testPOId = data.data.id;
    });

    it('should return 400 for invalid PO data', async () => {
      const invalidPO = {
        supplierId,
        items: [],
      };

      const response = await fetch(`${BASE_URL}/api/purchase-orders`, {
        method: 'POST',
        headers,
        body: JSON.stringify(invalidPO),
      });

      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
    });
  });

  describe('GET /api/purchase-orders', () => {
    it('should return list of purchase orders', async () => {
      const response = await fetch(`${BASE_URL}/api/purchase-orders`, {
        headers,
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(Array.isArray(data.data)).toBe(true);
    });

    it('should filter purchase orders by status', async () => {
      const response = await fetch(`${BASE_URL}/api/purchase-orders?status=draft`, {
        headers,
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      if (data.data.length > 0) {
        expect(data.data[0].status).toBe('draft');
      }
    });
  });

  describe('GET /api/purchase-orders/:id', () => {
    it('should return a purchase order by ID', async () => {
      if (!testPOId) return;

      const response = await fetch(`${BASE_URL}/api/purchase-orders/${testPOId}`, {
        headers,
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.id).toBe(testPOId);
    });

    it('should return 404 for non-existent PO', async () => {
      const response = await fetch(`${BASE_URL}/api/purchase-orders/non-existent-id`, {
        headers,
      });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
    });
  });

  describe('PUT /api/purchase-orders/:id', () => {
    it('should update purchase order', async () => {
      if (!testPOId) return;

      const updateData = {
        notes: 'Updated notes for integration test',
      };

      const response = await fetch(`${BASE_URL}/api/purchase-orders/${testPOId}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(updateData),
      });

      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });
  });

  describe.skip('POST /api/purchase-orders/:id/cancel', () => {
    it('should cancel purchase order', async () => {
      if (!testPOId) return;

      const response = await fetch(`${BASE_URL}/api/purchase-orders/${testPOId}/cancel`, {
        method: 'POST',
        headers,
      });

      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });
  });
});

