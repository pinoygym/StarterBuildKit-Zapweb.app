import { describe, it, expect } from 'vitest'
import { BASE_URL } from '../config'

describe('Products UOM', () => {
  it('updates product alternate UOMs', async () => {
    const seed = await fetch(`${BASE_URL}/api/dev/seed`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}) })
    const seedBody = await seed.json().catch(() => ({}))
    const water = seedBody?.data?.products?.find((p: any) => p?.name?.includes('Absolute'))
    expect(water?.id).toBeTruthy()

    const payload = {
      basePrice: 16,
      alternateUOMs: [
        { name: 'case', conversionFactor: 24, sellingPrice: 360 },
        { name: 'pack', conversionFactor: 6, sellingPrice: 96 }
      ]
    }

    const r = await fetch(`${BASE_URL}/api/products/${water.id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
    })
    const body = await r.json()
    expect(r.status).toBe(200)
    expect(body.success).toBe(true)
    expect(Array.isArray(body.data?.alternateUOMs)).toBe(true)
    expect(body.data?.alternateUOMs?.length).toBeGreaterThanOrEqual(2)
  }, 20000)
})