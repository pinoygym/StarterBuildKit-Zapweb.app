import { describe, it, expect } from 'vitest'
import { BASE_URL } from '../config'

describe('POS Sales API', () => {
  it('processes a cash sale', async () => {
    const seedRes = await fetch(`${BASE_URL}/api/dev/seed`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}) })
    const seed = await seedRes.json()
    const products = seed.data.products
    const water = products.find((p: any) => p.name.includes('Absolute'))
    const warehouse = seed.data.warehouses[0]
    const branch = seed.data.branches[0]

    const sale = {
      branchId: branch.id,
      warehouseId: warehouse.id,
      subtotal: 30,
      tax: 0,
      totalAmount: 30,
      paymentMethod: 'cash',
      amountReceived: 50,
      items: [
        {
          productId: water.id,
          quantity: 2,
          uom: water.baseUOM,
          unitPrice: 15,
          subtotal: 30,
        },
      ],
    }

    const r = await fetch(`${BASE_URL}/api/pos/sales`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(sale) })
    const body = await r.json()
    expect(r.status).toBe(201)
    expect(body.success).toBe(true)
    expect(body.data.receiptNumber).toMatch(/RCP-\d{8}-\d{4}/)
    expect(Array.isArray(body.data.items)).toBe(true)
  }, 20000)
})