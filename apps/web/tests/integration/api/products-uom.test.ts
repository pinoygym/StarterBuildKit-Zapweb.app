import { describe, it, expect } from 'vitest'
import { BASE_URL } from '../config'

describe('Products UOM', () => {
  let token: string
  let headers: any
  let water: any

  beforeAll(async () => {
    // 1. Seed data
    const seedRes = await fetch(`${BASE_URL}/api/dev/seed`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}) })
    const seed = await seedRes.json()

    if (!seed.success) {
      console.error('Seed failed:', JSON.stringify(seed, null, 2))
      throw new Error('Seed failed')
    }

    const products = seed.data.products
    water = products.find((p: any) => p.name.includes('Absolute'))

    // 2. Login to get token
    const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'cybergada@gmail.com',
        password: 'Qweasd1234',
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

  it('updates product alternate UOMs', async () => {
    expect(water?.id).toBeTruthy()

    const payload = {
      basePrice: 16,
      alternateUOMs: [
        { name: 'case', conversionFactor: 24, sellingPrice: 360 },
        { name: 'pack', conversionFactor: 6, sellingPrice: 96 }
      ]
    }

    const r = await fetch(`${BASE_URL}/api/products/${water.id}`, {
      method: 'PUT', headers, body: JSON.stringify(payload)
    })
    const body = await r.json()
    expect(r.status).toBe(200)
    expect(body.success).toBe(true)
    expect(Array.isArray(body.data?.alternateUOMs)).toBe(true)
    expect(body.data?.alternateUOMs?.length).toBeGreaterThanOrEqual(2)
  }, 20000)
})

