import { describe, it, expect, beforeAll } from 'vitest'
import { BASE_URL } from '../config'

describe('POS Sales API', () => {
  let token: string
  let headers: any
  let products: any[]
  let water: any
  let warehouse: any
  let branch: any

  beforeAll(async () => {
    // 1. Seed data
    const seedRes = await fetch(`${BASE_URL}/api/dev/seed`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}) })
    const seed = await seedRes.json()

    if (!seed.success || !seed.data) {
      console.error('Seed failed:', JSON.stringify(seed, null, 2))
      throw new Error('Seed failed')
    }

    products = seed.data.products
    water = products.find((p: any) => p.name.includes('Absolute'))
    warehouse = seed.data.warehouses[0]
    branch = seed.data.branches[0]

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
  })

  it('processes a cash sale', async () => {
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

    const r = await fetch(`${BASE_URL}/api/pos/sales`, { method: 'POST', headers, body: JSON.stringify(sale) })
    const body = await r.json()
    expect(r.status).toBe(201)
    expect(body.success).toBe(true)
    expect(body.data.receiptNumber).toMatch(/RCP-\d{8}-\d{4}/)
    expect(Array.isArray(body.data.items)).toBe(true)
  }, 20000)

  it('deducts inventory correctly after sale', async () => {
    // Get initial stock
    const initialInvRes = await fetch(`${BASE_URL}/api/inventory?productId=${water.id}&warehouseId=${warehouse.id}`, { headers })
    const initialInvData = await initialInvRes.json()

    const initialStock = initialInvData.data && initialInvData.data.length > 0 ? Number(initialInvData.data[0].quantity) : 0
    console.log('Initial Stock:', initialStock)

    const sale = {
      branchId: branch.id,
      warehouseId: warehouse.id,
      subtotal: 75,
      tax: 0,
      totalAmount: 75,
      paymentMethod: 'cash',
      amountReceived: 100,
      items: [
        {
          productId: water.id,
          quantity: 5,
          uom: water.baseUOM,
          unitPrice: 15,
          subtotal: 75,
        },
      ],
    }

    // Perform Sale
    const r = await fetch(`${BASE_URL}/api/pos/sales`, { method: 'POST', headers, body: JSON.stringify(sale) })
    const body = await r.json()

    if (r.status !== 201) {
      console.error('Sale failed:', body)
    }
    expect(r.status).toBe(201)

    // Verify new stock
    const finalInvRes = await fetch(`${BASE_URL}/api/inventory?productId=${water.id}&warehouseId=${warehouse.id}`, { headers })
    const finalInvData = await finalInvRes.json()
    const finalStock = Number(finalInvData.data[0].quantity)
    console.log('Final Stock:', finalStock)

    expect(finalStock).toBe(initialStock - 5)
  }, 20000)
})
