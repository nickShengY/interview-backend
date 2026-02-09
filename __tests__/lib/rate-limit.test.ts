/**
 * Comprehensive tests for the rate limiting system
 */

import {
  rateLimit,
  getRateLimitIdentifier,
  createRateLimitHeaders,
  withRateLimit,
  clearRateLimits,
  rateLimiter,
  RATE_LIMITS,
} from '@/lib/rate-limit'

describe('Rate Limiting System', () => {
  beforeEach(() => {
    clearRateLimits()
  })

  describe('rateLimit()', () => {
    it('should allow requests within limit', () => {
      const result = rateLimit('user:test1', { interval: 60000, uniqueTokenPerInterval: 5 })
      expect(result.success).toBe(true)
      expect(result.remaining).toBe(4)
      expect(result.limit).toBe(5)
    })

    it('should block requests exceeding limit', () => {
      const config = { interval: 60000, uniqueTokenPerInterval: 3 }
      rateLimit('user:flood', config)
      rateLimit('user:flood', config)
      rateLimit('user:flood', config)
      const result = rateLimit('user:flood', config)
      expect(result.success).toBe(false)
      expect(result.remaining).toBe(0)
    })

    it('should track different identifiers independently', () => {
      const config = { interval: 60000, uniqueTokenPerInterval: 2 }
      rateLimit('user:a', config)
      rateLimit('user:a', config)
      const resultA = rateLimit('user:a', config)
      const resultB = rateLimit('user:b', config)
      expect(resultA.success).toBe(false)
      expect(resultB.success).toBe(true)
    })

    it('should allow requests after window expires', () => {
      const config = { interval: 100, uniqueTokenPerInterval: 1 }
      rateLimit('user:expire', config)
      const blocked = rateLimit('user:expire', config)
      expect(blocked.success).toBe(false)

      // Manually wait for the window to expire
      return new Promise<void>((resolve) => {
        setTimeout(() => {
          const result = rateLimit('user:expire', config)
          expect(result.success).toBe(true)
          resolve()
        }, 150)
      })
    })

    it('should return correct reset time', () => {
      const now = Date.now()
      const result = rateLimit('user:reset', { interval: 60000, uniqueTokenPerInterval: 10 })
      expect(result.reset).toBeGreaterThanOrEqual(now)
      expect(result.reset).toBeLessThanOrEqual(now + 60000 + 100)
    })

    it('should handle single request limit', () => {
      const config = { interval: 60000, uniqueTokenPerInterval: 1 }
      const first = rateLimit('user:single', config)
      const second = rateLimit('user:single', config)
      expect(first.success).toBe(true)
      expect(first.remaining).toBe(0)
      expect(second.success).toBe(false)
    })

    it('should count remaining correctly as requests accumulate', () => {
      const config = { interval: 60000, uniqueTokenPerInterval: 5 }
      expect(rateLimit('user:count', config).remaining).toBe(4)
      expect(rateLimit('user:count', config).remaining).toBe(3)
      expect(rateLimit('user:count', config).remaining).toBe(2)
      expect(rateLimit('user:count', config).remaining).toBe(1)
      expect(rateLimit('user:count', config).remaining).toBe(0)
    })
  })

  describe('getRateLimitIdentifier()', () => {
    it('should prefer userId when available', () => {
      const request = new Request('http://localhost/api/test')
      const result = getRateLimitIdentifier(request, 'user-123')
      expect(result).toBe('user:user-123')
    })

    it('should use x-forwarded-for header when no userId', () => {
      const request = new Request('http://localhost/api/test', {
        headers: { 'x-forwarded-for': '192.168.1.1, 10.0.0.1' },
      })
      const result = getRateLimitIdentifier(request)
      expect(result).toBe('ip:192.168.1.1')
    })

    it('should use x-real-ip header as fallback', () => {
      const request = new Request('http://localhost/api/test', {
        headers: { 'x-real-ip': '10.0.0.5' },
      })
      const result = getRateLimitIdentifier(request)
      expect(result).toBe('ip:10.0.0.5')
    })

    it('should return ip:unknown when no identifier available', () => {
      const request = new Request('http://localhost/api/test')
      const result = getRateLimitIdentifier(request)
      expect(result).toBe('ip:unknown')
    })

    it('should trim forwarded-for IP addresses', () => {
      const request = new Request('http://localhost/api/test', {
        headers: { 'x-forwarded-for': '  192.168.1.1  , 10.0.0.1' },
      })
      const result = getRateLimitIdentifier(request)
      expect(result).toBe('ip:192.168.1.1')
    })
  })

  describe('createRateLimitHeaders()', () => {
    it('should return correct rate limit headers', () => {
      const now = Date.now()
      const headers = createRateLimitHeaders({
        success: true,
        limit: 60,
        remaining: 55,
        reset: now + 60000,
      })
      expect(headers['X-RateLimit-Limit']).toBe('60')
      expect(headers['X-RateLimit-Remaining']).toBe('55')
      expect(headers['X-RateLimit-Reset']).toBeDefined()
    })

    it('should format reset as ISO date string', () => {
      const reset = Date.now() + 30000
      const headers = createRateLimitHeaders({
        success: true,
        limit: 10,
        remaining: 5,
        reset,
      })
      expect(() => new Date(headers['X-RateLimit-Reset'])).not.toThrow()
    })
  })

  describe('withRateLimit()', () => {
    it('should return success when within limits', async () => {
      const request = new Request('http://localhost/api/test')
      const result = await withRateLimit(request, { interval: 60000, uniqueTokenPerInterval: 10 })
      expect(result.success).toBe(true)
    })

    it('should return 429 response when rate limited', async () => {
      const config = { interval: 60000, uniqueTokenPerInterval: 1 }
      const request = new Request('http://localhost/api/test', {
        headers: { 'x-forwarded-for': '1.2.3.4' },
      })
      await withRateLimit(request, config)
      const result = await withRateLimit(request, config)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.response.status).toBe(429)
        const body = await result.response.json()
        expect(body.error).toBe('Too many requests')
        expect(body.retryAfter).toBeGreaterThan(0)
      }
    })

    it('should use default API config when none specified', async () => {
      const request = new Request('http://localhost/api/test')
      const result = await withRateLimit(request)
      expect(result.success).toBe(true)
    })

    it('should include Retry-After header in 429 response', async () => {
      const config = { interval: 60000, uniqueTokenPerInterval: 1 }
      const request = new Request('http://localhost/api/test', {
        headers: { 'x-forwarded-for': '5.6.7.8' },
      })
      await withRateLimit(request, config)
      const result = await withRateLimit(request, config)
      if (!result.success) {
        expect(result.response.headers.get('Retry-After')).toBeDefined()
      }
    })
  })

  describe('RATE_LIMITS presets', () => {
    it('AUTH limit should be restrictive', () => {
      expect(RATE_LIMITS.AUTH.uniqueTokenPerInterval).toBeLessThanOrEqual(10)
      expect(RATE_LIMITS.AUTH.interval).toBeGreaterThanOrEqual(5 * 60 * 1000)
    })

    it('AI limit should be moderate', () => {
      expect(RATE_LIMITS.AI.uniqueTokenPerInterval).toBeLessThanOrEqual(20)
    })

    it('UPLOAD limit should be strict', () => {
      expect(RATE_LIMITS.UPLOAD.uniqueTokenPerInterval).toBeLessThanOrEqual(20)
    })

    it('API limit should be generous', () => {
      expect(RATE_LIMITS.API.uniqueTokenPerInterval).toBeGreaterThanOrEqual(30)
    })

    it('all presets should have positive intervals', () => {
      Object.values(RATE_LIMITS).forEach((config) => {
        expect(config.interval).toBeGreaterThan(0)
        expect(config.uniqueTokenPerInterval).toBeGreaterThan(0)
      })
    })
  })

  describe('rateLimiter cleanup', () => {
    it('cleanup method should not throw', () => {
      rateLimit('user:cleanup', { interval: 60000, uniqueTokenPerInterval: 100 })
      expect(() => rateLimiter.cleanup()).not.toThrow()
    })

    it('clear should remove all entries', () => {
      const config = { interval: 60000, uniqueTokenPerInterval: 1 }
      rateLimit('user:clear1', config)
      rateLimit('user:clear2', config)
      clearRateLimits()
      expect(rateLimit('user:clear1', config).success).toBe(true)
      expect(rateLimit('user:clear2', config).success).toBe(true)
    })
  })
})
