/**
 * Tests for the Stripe Create Checkout API route (disabled stub)
 */

import { GET, POST } from '@/app/api/stripe/create-checkout/route'

describe('Stripe Create Checkout (disabled)', () => {
  it('GET should return 404 with Stripe disabled message', async () => {
    const response = GET()
    expect(response.status).toBe(404)
    const data = await response.json()
    expect(data.error).toContain('Stripe disabled')
  })

  it('POST should return 404 with Stripe disabled message', async () => {
    const response = POST()
    expect(response.status).toBe(404)
    const data = await response.json()
    expect(data.error).toContain('Stripe disabled')
  })
})
