import { describe, it, expect, beforeAll, afterAll } from 'vitest';

describe('Purchase Orders API Integration Tests', () => {
  let testPOId: string;
  const BASE_URL = 'http://localhost:3000';

  beforeAll(async () => {
    // Ensure server is running
  });

  afterAll(async () => {
    // Cleanup test data
    if (testPOId) {
      try {
        await fetch(`${BASE_URL}/api/purchase-orders/${testPOId}`, {
          method: 'DELETE',
        });
      } catch (error) {
        // Ignore cleanup errors
      }
    }
  });

  describe('POST /api/purchase-orders', () => {
    it('should create a new purchase order', async () => {
      const timestamp = Date.now();
      const newPO = {
        supplierId: 'test-supplier-id',
        warehouseId: 'test-warehouse-id',
        branchId: 'test-branch-id',
        expectedDeliveryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        notes: `Integration Test PO ${timestamp}`,
        items: [
          {
            productId: 'test-product-id',
            quantity: 10,
            unitPrice: 50,
          },
        ],
      };

      const response = await fetch(`${BASE_URL}/api/purchase-orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPO),
      });

      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.data.status).toBe('draft');
      expect(data.data.poNumber).toMatch(/^PO-\d{8}-\d{4}$/);

      testPOId = data.data.id;
    });

    it('should return 400 for invalid PO data', async () => {
      const invalidPO = {
        supplierId: '',
        items: [],
      };

      const response = await fetch(`${BASE_URL}/api/purchase-orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invalidPO),
      });

      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
    });
  });

  describe('GET /api/purchase-orders', () => {
    it('should return list of purchase orders', async () => {
      const response = await fetch(`${BASE_URL}/api/purchase-orders`);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(Array.isArray(data.data)).toBe(true);
    });

    it('should filter purchase orders by status', async () => {
      const response = await fetch(`${BASE_URL}/api/purchase-orders?status=draft`);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);

      if (data.data.length > 0) {
        expect(data.data.every((po: any) => po.status === 'draft')).toBe(true);
      }
    });
  });

  describe('GET /api/purchase-orders/:id', () => {
    it('should return a purchase order by ID', async () => {
      if (!testPOId) return;

      const response = await fetch(`${BASE_URL}/api/purchase-orders/${testPOId}`);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.id).toBe(testPOId);
    });

    it('should return 404 for non-existent PO', async () => {
      const response = await fetch(`${BASE_URL}/api/purchase-orders/non-existent-id`);
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
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      });

      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.notes).toBe(updateData.notes);
    });

    it('should update status to ordered', async () => {
      if (!testPOId) return;

      const response = await fetch(`${BASE_URL}/api/purchase-orders/${testPOId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'ordered' }),
      });

      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.status).toBe('ordered');
    });
  });

  describe('POST /api/purchase-orders/:id/cancel', () => {
    it('should cancel purchase order', async () => {
      if (!testPOId) return;

      const response = await fetch(`${BASE_URL}/api/purchase-orders/${testPOId}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: 'Integration test cancellation' }),
      });

      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.status).toBe('cancelled');
    });
  });
});
