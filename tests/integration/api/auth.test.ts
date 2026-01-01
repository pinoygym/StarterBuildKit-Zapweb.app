import { describe, it, expect } from 'vitest'
import { BASE_URL } from '../config'

describe('Auth API', () => {
it('invalid login returns 401', async () => {
    const r = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'invalid@example.com', password: 'wrong' })
    })
    const body = await r.json()
    expect(r.status).toBe(401)
    expect(body.success).toBe(false)
  }, 20000)

it('valid login returns 200 and me returns 200 with cookie', async () => {
    const r = await fetch(`${BASE_URL}/api/dev/seed`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}) })
    expect([200, 201]).toContain(r.status)

    const login = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'demo@example.com', password: 'Password123!' })
    })
    const setCookie = login.headers.get('set-cookie') || ''
    const loginBody = await login.json()
    expect(login.status).toBe(200)
    expect(loginBody.success).toBe(true)

    const me = await fetch(`${BASE_URL}/api/auth/me`, { headers: { 'Cookie': setCookie } })
    const meBody = await me.json()
    expect(me.status).toBe(200)
    expect(meBody.success).toBe(true)
  }, 20000)
})
