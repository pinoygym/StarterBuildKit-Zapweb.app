import { describe, it, expect } from 'vitest'
import { BASE_URL } from '../config'

describe('Warehouses API', () => {
  it('lists warehouses', async () => {
    const seed = await fetch(`${BASE_URL}/api/dev/seed`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}) })
    expect([200, 201]).toContain(seed.status)

    const r = await fetch(`${BASE_URL}/api/warehouses`)
    const body = await r.json()
    expect(r.status).toBe(200)
    expect(body.success).toBe(true)
    expect(Array.isArray(body.data)).toBe(true)
  }, 20000)
})