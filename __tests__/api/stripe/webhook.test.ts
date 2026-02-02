/**
 * Unit tests for Stripe webhook handling (Stripe disabled)
 */

import { POST } from '@/app/api/stripe/webhook/route'

describe('POST /api/stripe/webhook (disabled)', () => {
  it('returns 404 when Stripe is disabled', async () => {
    const response = await POST()

    expect(response.status).toBe(404)
    const data = await response.json()
    expect(data.error).toMatch(/stripe disabled/i)
  })
})
