/**
 * API Rate Limiting Middleware
 * Implements sliding window rate limiting for API routes
 */

export interface RateLimitConfig {
  interval: number // Time window in milliseconds
  uniqueTokenPerInterval: number // Max requests per interval
}

export interface RateLimitResult {
  success: boolean
  limit: number
  remaining: number
  reset: number
}

/**
 * In-memory rate limiter using Map
 * For production, use Redis for distributed rate limiting
 */
class RateLimiter {
  private requests: Map<string, number[]> = new Map()

  check(identifier: string, limit: number, interval: number): RateLimitResult {
    const now = Date.now()
    const windowStart = now - interval

    // Get existing requests for this identifier
    const userRequests = this.requests.get(identifier) || []

    // Filter out requests outside the current window
    const recentRequests = userRequests.filter((timestamp) => timestamp > windowStart)

    // Check if limit exceeded
    const success = recentRequests.length < limit

    if (success) {
      // Add current request
      recentRequests.push(now)
      this.requests.set(identifier, recentRequests)
    }

    // Calculate time until oldest request expires
    const oldestRequest = recentRequests[0] || now
    const reset = oldestRequest + interval

    return {
      success,
      limit,
      remaining: Math.max(0, limit - recentRequests.length - (success ? 0 : 1)),
      reset,
    }
  }

  /**
   * Clean up old entries (call periodically to prevent memory leaks)
   */
  cleanup(): void {
    const now = Date.now()
    const maxAge = 60 * 60 * 1000 // 1 hour

    for (const [identifier, timestamps] of this.requests.entries()) {
      const recentTimestamps = timestamps.filter((ts) => now - ts < maxAge)
      if (recentTimestamps.length === 0) {
        this.requests.delete(identifier)
      } else {
        this.requests.set(identifier, recentTimestamps)
      }
    }
  }

  /**
   * Clear all rate limit data (for testing)
   */
  clear(): void {
    this.requests.clear()
  }
}

// Singleton instance
const rateLimiter = new RateLimiter()

// Cleanup old entries every 10 minutes (avoid holding open test runners)
if (typeof window === 'undefined' && process.env.NODE_ENV !== 'test') {
  const cleanupTimer = setInterval(() => rateLimiter.cleanup(), 10 * 60 * 1000)
  cleanupTimer.unref?.()
}

/**
 * Rate limit configurations for different endpoints
 */
export const RATE_LIMITS = {
  // Authentication endpoints - strict limits
  AUTH: {
    interval: 15 * 60 * 1000, // 15 minutes
    uniqueTokenPerInterval: 5, // 5 requests per 15 min
  },

  // AI-powered endpoints - moderate limits (cost protection)
  AI: {
    interval: 60 * 1000, // 1 minute
    uniqueTokenPerInterval: 10, // 10 requests per minute
  },

  // File upload endpoints - strict limits
  UPLOAD: {
    interval: 60 * 60 * 1000, // 1 hour
    uniqueTokenPerInterval: 10, // 10 uploads per hour
  },

  // Regular API endpoints - generous limits
  API: {
    interval: 60 * 1000, // 1 minute
    uniqueTokenPerInterval: 60, // 60 requests per minute
  },

  // Public endpoints - moderate limits
  PUBLIC: {
    interval: 60 * 1000, // 1 minute
    uniqueTokenPerInterval: 30, // 30 requests per minute
  },
} as const

/**
 * Rate limit a request based on identifier (userId or IP)
 */
export function rateLimit(
  identifier: string,
  config: RateLimitConfig = RATE_LIMITS.API
): RateLimitResult {
  return rateLimiter.check(identifier, config.uniqueTokenPerInterval, config.interval)
}

/**
 * Get rate limit identifier from request
 * Prefers userId, falls back to IP address
 */
export function getRateLimitIdentifier(request: Request, userId?: string): string {
  if (userId) {
    return `user:${userId}`
  }

  // Try to get IP from various headers (for proxies/load balancers)
  const forwardedFor = request.headers.get('x-forwarded-for')
  if (forwardedFor) {
    return `ip:${forwardedFor.split(',')[0].trim()}`
  }

  const realIp = request.headers.get('x-real-ip')
  if (realIp) {
    return `ip:${realIp}`
  }

  // Fallback to a generic identifier (not ideal, but prevents errors)
  return 'ip:unknown'
}

/**
 * Create rate limit headers for response
 */
export function createRateLimitHeaders(result: RateLimitResult): Record<string, string> {
  return {
    'X-RateLimit-Limit': result.limit.toString(),
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': new Date(result.reset).toISOString(),
  }
}

/**
 * Middleware wrapper for rate limiting
 * Usage:
 *
 * export async function GET(req: Request) {
 *   const rateLimitResult = await withRateLimit(req, RATE_LIMITS.API)
 *   if (!rateLimitResult.success) {
 *     return rateLimitResult.response
 *   }
 *
 *   // Your endpoint logic here
 * }
 */
export async function withRateLimit(
  request: Request,
  config: RateLimitConfig = RATE_LIMITS.API,
  userId?: string
): Promise<{ success: true } | { success: false; response: Response }> {
  const identifier = getRateLimitIdentifier(request, userId)
  const result = rateLimit(identifier, config)
  const headers = createRateLimitHeaders(result)

  if (!result.success) {
    return {
      success: false,
      response: new Response(
        JSON.stringify({
          error: 'Too many requests',
          message: 'Rate limit exceeded. Please try again later.',
          retryAfter: Math.ceil((result.reset - Date.now()) / 1000),
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': Math.ceil((result.reset - Date.now()) / 1000).toString(),
            ...headers,
          },
        }
      ),
    }
  }

  return { success: true }
}

/**
 * Clear all rate limit data (for testing only)
 */
export function clearRateLimits(): void {
  rateLimiter.clear()
}

// Export the limiter instance for advanced use cases
export { rateLimiter }
