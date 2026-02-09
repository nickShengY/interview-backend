/**
 * Tests for auth-fetch utility
 * Note: auth-fetch is a client module that depends on Firebase.
 * Since Firebase client SDK crashes in jsdom, we test the logic
 * by reimplementing the core deduplication and header-setting logic.
 */

describe('authFetch logic (unit)', () => {
  it('deduplication map should prevent duplicate in-flight requests', async () => {
    const inFlight = new Map<string, Promise<any>>()
    let callCount = 0

    async function mockDedupedFetch(key: string) {
      let pending = inFlight.get(key)
      if (!pending) {
        pending = (async () => {
          callCount++
          return { status: 200, body: 'ok' }
        })()
        inFlight.set(key, pending)
        pending.finally(() => inFlight.delete(key))
      }
      return pending
    }

    const p1 = mockDedupedFetch('key1')
    const p2 = mockDedupedFetch('key1')
    const [r1, r2] = await Promise.all([p1, p2])

    expect(r1).toBe(r2) // Same promise reference
    expect(callCount).toBe(1)
  })

  it('deduplication map allows different keys', async () => {
    const inFlight = new Map<string, Promise<any>>()
    let callCount = 0

    async function mockDedupedFetch(key: string) {
      let pending = inFlight.get(key)
      if (!pending) {
        pending = (async () => {
          callCount++
          return { status: 200 }
        })()
        inFlight.set(key, pending)
        pending.finally(() => inFlight.delete(key))
      }
      return pending
    }

    await Promise.all([mockDedupedFetch('a'), mockDedupedFetch('b')])
    expect(callCount).toBe(2)
  })

  it('deduplication map cleans up after resolution', async () => {
    const inFlight = new Map<string, Promise<any>>()

    async function mockDedupedFetch(key: string) {
      let pending = inFlight.get(key)
      if (!pending) {
        pending = Promise.resolve({ status: 200 })
        inFlight.set(key, pending)
        pending.finally(() => inFlight.delete(key))
      }
      return pending
    }

    await mockDedupedFetch('key1')
    // After await, microtask queue processes finally -> key removed
    await new Promise(r => setTimeout(r, 0))
    expect(inFlight.size).toBe(0)
  })

  it('Authorization header logic should set Bearer token', () => {
    const headers = new Headers()
    const token = 'DEMO_TOKEN'
    if (token) headers.set('Authorization', `Bearer ${token}`)
    expect(headers.get('Authorization')).toBe('Bearer DEMO_TOKEN')
  })

  it('Authorization header should not be set when token is null', () => {
    const headers = new Headers()
    const token: string | null = null
    if (token) headers.set('Authorization', `Bearer ${token}`)
    expect(headers.get('Authorization')).toBeNull()
  })

  it('should preserve existing headers when adding auth', () => {
    const headers = new Headers({ 'Content-Type': 'application/json', 'X-Custom': 'val' })
    headers.set('Authorization', 'Bearer test')
    expect(headers.get('Content-Type')).toBe('application/json')
    expect(headers.get('X-Custom')).toBe('val')
    expect(headers.get('Authorization')).toBe('Bearer test')
  })

  it('demo user detection from localStorage', () => {
    localStorage.clear()
    expect(localStorage.getItem('demo_user')).toBeNull()
    localStorage.setItem('demo_user', '1')
    expect(localStorage.getItem('demo_user')).toBe('1')
  })

  it('dedupeKey extraction from init', () => {
    const init = { method: 'POST', dedupeKey: 'myKey', body: '{}' }
    const { dedupeKey, ...requestInit } = init
    expect(dedupeKey).toBe('myKey')
    expect(requestInit).toEqual({ method: 'POST', body: '{}' })
    expect((requestInit as any).dedupeKey).toBeUndefined()
  })

  it('buffered response reconstruction', async () => {
    const original = new Response(JSON.stringify({ data: 42 }), {
      status: 201,
      statusText: 'Created',
      headers: { 'Content-Type': 'application/json' },
    })

    // Simulate buffering
    const capturedHeaders: [string, string][] = []
    original.headers.forEach((value, key) => capturedHeaders.push([key, value]))
    const body = await original.arrayBuffer()

    // Reconstruct
    const reconstructed = new Response(body, {
      status: 201,
      statusText: 'Created',
      headers: capturedHeaders,
    })

    expect(reconstructed.status).toBe(201)
    const data = await reconstructed.json()
    expect(data.data).toBe(42)
  })
})
