/**
 * Tests for lib/env.ts environment variable validation
 */

describe('env.ts validateEnv', () => {
  const originalEnv = { ...process.env }

  beforeEach(() => {
    jest.resetModules()
  })

  afterEach(() => {
    process.env = { ...originalEnv }
  })

  function setAllRequiredEnv() {
    process.env.DATABASE_URL = 'postgresql://user:pass@localhost:5432/db'
    process.env.NEXTAUTH_SECRET = 'a'.repeat(32)
    process.env.NEXTAUTH_URL = 'http://localhost:3000'
    process.env.GOOGLE_CLIENT_ID = 'gid'
    process.env.GOOGLE_CLIENT_SECRET = 'gsecret'
    process.env.OPENROUTER_API_KEY = 'gkey'
    process.env.STRIPE_SECRET_KEY = 'sk_test_abc'
    process.env.STRIPE_WEBHOOK_SECRET = 'whsec_abc'
    process.env.STRIPE_PRICE_PRO = 'price_pro'
    process.env.STRIPE_PRICE_ULTRA = 'price_ultra'
    process.env.NEXT_PUBLIC_ATS_API = 'http://localhost:8000'
    process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000'
  }

  it('should pass with all required vars set correctly', () => {
    setAllRequiredEnv()
    jest.spyOn(console, 'log').mockImplementation(() => {})
    const { validateEnv } = require('@/lib/env')
    expect(() => validateEnv()).not.toThrow()
    jest.restoreAllMocks()
  })

  it('should throw when DATABASE_URL is missing', () => {
    setAllRequiredEnv()
    delete process.env.DATABASE_URL
    jest.spyOn(console, 'log').mockImplementation(() => {})
    const { validateEnv } = require('@/lib/env')
    expect(() => validateEnv()).toThrow('Missing required environment variables')
    jest.restoreAllMocks()
  })

  it('should throw when STRIPE_SECRET_KEY has wrong format', () => {
    setAllRequiredEnv()
    process.env.STRIPE_SECRET_KEY = 'invalid'
    jest.spyOn(console, 'log').mockImplementation(() => {})
    const { validateEnv } = require('@/lib/env')
    expect(() => validateEnv()).toThrow('sk_')
    jest.restoreAllMocks()
  })

  it('should throw when STRIPE_WEBHOOK_SECRET has wrong format', () => {
    setAllRequiredEnv()
    process.env.STRIPE_WEBHOOK_SECRET = 'invalid'
    jest.spyOn(console, 'log').mockImplementation(() => {})
    const { validateEnv } = require('@/lib/env')
    expect(() => validateEnv()).toThrow('whsec_')
    jest.restoreAllMocks()
  })

  it('should throw when STRIPE_PRICE_PRO has wrong format', () => {
    setAllRequiredEnv()
    process.env.STRIPE_PRICE_PRO = 'invalid'
    jest.spyOn(console, 'log').mockImplementation(() => {})
    const { validateEnv } = require('@/lib/env')
    expect(() => validateEnv()).toThrow('price_')
    jest.restoreAllMocks()
  })

  it('should throw when STRIPE_PRICE_ULTRA has wrong format', () => {
    setAllRequiredEnv()
    process.env.STRIPE_PRICE_ULTRA = 'invalid'
    jest.spyOn(console, 'log').mockImplementation(() => {})
    const { validateEnv } = require('@/lib/env')
    expect(() => validateEnv()).toThrow('price_')
    jest.restoreAllMocks()
  })

  it('should throw for invalid URL format', () => {
    setAllRequiredEnv()
    process.env.DATABASE_URL = 'not-a-url'
    jest.spyOn(console, 'log').mockImplementation(() => {})
    const { validateEnv } = require('@/lib/env')
    expect(() => validateEnv()).toThrow('Invalid URL')
    jest.restoreAllMocks()
  })

  it('should list all missing variables', () => {
    // Clear all required vars
    delete process.env.DATABASE_URL
    delete process.env.NEXTAUTH_SECRET
    delete process.env.NEXTAUTH_URL
    delete process.env.GOOGLE_CLIENT_ID
    delete process.env.GOOGLE_CLIENT_SECRET
    delete process.env.OPENROUTER_API_KEY
    delete process.env.STRIPE_SECRET_KEY
    delete process.env.STRIPE_WEBHOOK_SECRET
    delete process.env.STRIPE_PRICE_PRO
    delete process.env.STRIPE_PRICE_ULTRA
    delete process.env.NEXT_PUBLIC_ATS_API
    delete process.env.NEXT_PUBLIC_APP_URL
    jest.spyOn(console, 'log').mockImplementation(() => {})
    const { validateEnv } = require('@/lib/env')
    expect(() => validateEnv()).toThrow('DATABASE_URL')
    jest.restoreAllMocks()
  })
})
