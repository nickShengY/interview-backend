/**
 * Comprehensive tests for environment variable validation
 */

import {
  validateEnvironment,
  printValidationResults,
  getRequiredEnvVars,
  getOptionalEnvVars,
  isStripeConfigured,
  getEnvironmentSummary,
} from '@/lib/env-validation'

describe('Environment Validation', () => {
  describe('validateEnvironment', () => {
    const validEnv: Record<string, string> = {
      DATABASE_URL: 'postgresql://user:pass@localhost:5432/db',
      NEXTAUTH_SECRET: 'a'.repeat(32),
      NEXT_PUBLIC_FIREBASE_API_KEY: 'AIza...',
      NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: 'project.firebaseapp.com',
      NEXT_PUBLIC_FIREBASE_PROJECT_ID: 'my-project',
      FIREBASE_PROJECT_ID: 'my-project',
      FIREBASE_CLIENT_EMAIL: 'firebase-adminsdk@my-project.iam.gserviceaccount.com',
      FIREBASE_PRIVATE_KEY: '-----BEGIN PRIVATE KEY-----\nMIIE...',
      GOOGLE_CLIENT_ID: '123.apps.googleusercontent.com',
      GOOGLE_CLIENT_SECRET: 'GOCSPX-...',
      OPENROUTER_API_KEY: 'openrouter-key',
      NEXT_PUBLIC_ATS_API: 'http://localhost:8000',
    }

    it('should pass with all required variables set correctly', () => {
      const result = validateEnvironment(validEnv)
      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
      expect(result.missingRequired).toHaveLength(0)
    })

    it('should fail when DATABASE_URL is missing', () => {
      const env = { ...validEnv }
      delete env.DATABASE_URL
      const result = validateEnvironment(env)
      expect(result.valid).toBe(false)
      expect(result.missingRequired).toContain('DATABASE_URL')
    })

    it('should fail when DATABASE_URL has invalid format', () => {
      const env = { ...validEnv, DATABASE_URL: 'mysql://localhost' }
      const result = validateEnvironment(env)
      expect(result.valid).toBe(false)
      expect(result.invalidValues.some(v => v.name === 'DATABASE_URL')).toBe(true)
    })

    it('should fail when NEXTAUTH_SECRET is too short', () => {
      const env = { ...validEnv, NEXTAUTH_SECRET: 'short' }
      const result = validateEnvironment(env)
      expect(result.valid).toBe(false)
      expect(result.invalidValues.some(v => v.name === 'NEXTAUTH_SECRET')).toBe(true)
    })

    it('should fail when FIREBASE_CLIENT_EMAIL is not a service account', () => {
      const env = { ...validEnv, FIREBASE_CLIENT_EMAIL: 'user@gmail.com' }
      const result = validateEnvironment(env)
      expect(result.valid).toBe(false)
      expect(result.invalidValues.some(v => v.name === 'FIREBASE_CLIENT_EMAIL')).toBe(true)
    })

    it('should fail when FIREBASE_PRIVATE_KEY is invalid', () => {
      const env = { ...validEnv, FIREBASE_PRIVATE_KEY: 'not-a-key' }
      const result = validateEnvironment(env)
      expect(result.valid).toBe(false)
    })

    it('should fail when NEXT_PUBLIC_ATS_API is not a valid URL', () => {
      const env = { ...validEnv, NEXT_PUBLIC_ATS_API: 'not-a-url' }
      const result = validateEnvironment(env)
      expect(result.valid).toBe(false)
    })

    it('should report optional variables as warnings', () => {
      const result = validateEnvironment(validEnv)
      expect(result.missingOptional.length).toBeGreaterThan(0)
      expect(result.warnings.length).toBeGreaterThan(0)
    })

    it('should accept postgres:// protocol for DATABASE_URL', () => {
      const env = { ...validEnv, DATABASE_URL: 'postgres://user:pass@localhost:5432/db' }
      const result = validateEnvironment(env)
      expect(result.invalidValues.some(v => v.name === 'DATABASE_URL')).toBe(false)
    })

    it('should validate Stripe key format when provided', () => {
      const env = { ...validEnv, STRIPE_SECRET_KEY: 'invalid_key' }
      const result = validateEnvironment(env)
      expect(result.invalidValues.some(v => v.name === 'STRIPE_SECRET_KEY')).toBe(true)
    })

    it('should accept valid Stripe keys', () => {
      const env = {
        ...validEnv,
        STRIPE_SECRET_KEY: 'sk_test_abc123',
        NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: 'pk_test_abc123',
        STRIPE_WEBHOOK_SECRET: 'whsec_abc123',
        STRIPE_PRICE_PRO: 'price_abc123',
        STRIPE_PRICE_ULTRA: 'price_def456',
      }
      const result = validateEnvironment(env)
      expect(result.invalidValues.filter(v => v.name.includes('STRIPE'))).toHaveLength(0)
    })

    it('should warn about Stripe key mismatch (test vs live)', () => {
      const env = {
        ...validEnv,
        STRIPE_SECRET_KEY: 'sk_test_abc123',
        NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: 'pk_live_abc123',
      }
      const result = validateEnvironment(env)
      expect(result.errors.some(e => e.includes('mismatch'))).toBe(true)
    })

    it('should warn when only secret key is set without publishable key', () => {
      const env = { ...validEnv, STRIPE_SECRET_KEY: 'sk_test_abc123' }
      const result = validateEnvironment(env)
      expect(result.warnings.some(w => w.includes('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is missing'))).toBe(true)
    })

    it('should treat empty string as missing', () => {
      const env = { ...validEnv, OPENROUTER_API_KEY: '' }
      const result = validateEnvironment(env)
      expect(result.valid).toBe(false)
      expect(result.missingRequired).toContain('OPENROUTER_API_KEY')
    })

    it('should treat whitespace-only string as missing', () => {
      const env = { ...validEnv, OPENROUTER_API_KEY: '   ' }
      const result = validateEnvironment(env)
      expect(result.missingRequired).toContain('OPENROUTER_API_KEY')
    })
  })

  describe('production-specific validation', () => {
    it('should warn about localhost DATABASE_URL in production', () => {
      const env: Record<string, string> = {
        NODE_ENV: 'production',
        DATABASE_URL: 'postgresql://user:pass@localhost:5432/db',
        NEXTAUTH_SECRET: 'a'.repeat(32),
        NEXTAUTH_URL: 'https://interview-pro.ai',
        NEXT_PUBLIC_FIREBASE_API_KEY: 'key',
        NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: 'domain',
        NEXT_PUBLIC_FIREBASE_PROJECT_ID: 'pid',
        FIREBASE_PROJECT_ID: 'pid',
        FIREBASE_CLIENT_EMAIL: 'sa@pid.iam.gserviceaccount.com',
        FIREBASE_PRIVATE_KEY: '-----BEGIN PRIVATE KEY-----\nkey',
        GOOGLE_CLIENT_ID: 'gid',
        GOOGLE_CLIENT_SECRET: 'gsecret',
        OPENROUTER_API_KEY: 'gkey',
        NEXT_PUBLIC_ATS_API: 'https://api.interview-pro.ai',
      }
      const result = validateEnvironment(env)
      expect(result.warnings.some(w => w.includes('localhost'))).toBe(true)
    })

    it('should warn about test Stripe key in production', () => {
      const env: Record<string, string> = {
        NODE_ENV: 'production',
        DATABASE_URL: 'postgresql://user:pass@prod-db:5432/db',
        NEXTAUTH_SECRET: 'a'.repeat(32),
        NEXTAUTH_URL: 'https://interview-pro.ai',
        NEXT_PUBLIC_FIREBASE_API_KEY: 'key',
        NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: 'domain',
        NEXT_PUBLIC_FIREBASE_PROJECT_ID: 'pid',
        FIREBASE_PROJECT_ID: 'pid',
        FIREBASE_CLIENT_EMAIL: 'sa@pid.iam.gserviceaccount.com',
        FIREBASE_PRIVATE_KEY: '-----BEGIN PRIVATE KEY-----\nkey',
        GOOGLE_CLIENT_ID: 'gid',
        GOOGLE_CLIENT_SECRET: 'gsecret',
        OPENROUTER_API_KEY: 'gkey',
        NEXT_PUBLIC_ATS_API: 'https://api.interview-pro.ai',
        STRIPE_SECRET_KEY: 'sk_test_abc',
        NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: 'pk_test_abc',
      }
      const result = validateEnvironment(env)
      expect(result.warnings.some(w => w.includes('test key'))).toBe(true)
    })
  })

  describe('printValidationResults', () => {
    it('should not throw for valid results', () => {
      jest.spyOn(console, 'log').mockImplementation(() => {})
      jest.spyOn(console, 'warn').mockImplementation(() => {})
      expect(() => printValidationResults({
        valid: true,
        errors: [],
        warnings: [],
        missingRequired: [],
        missingOptional: [],
        invalidValues: [],
      })).not.toThrow()
      jest.restoreAllMocks()
    })

    it('should not throw for invalid results', () => {
      jest.spyOn(console, 'log').mockImplementation(() => {})
      jest.spyOn(console, 'error').mockImplementation(() => {})
      jest.spyOn(console, 'warn').mockImplementation(() => {})
      expect(() => printValidationResults({
        valid: false,
        errors: ['error1'],
        warnings: ['warn1'],
        missingRequired: ['VAR1'],
        missingOptional: [],
        invalidValues: [],
      })).not.toThrow()
      jest.restoreAllMocks()
    })
  })

  describe('getRequiredEnvVars', () => {
    it('should return an array of strings', () => {
      const vars = getRequiredEnvVars()
      expect(Array.isArray(vars)).toBe(true)
      expect(vars.length).toBeGreaterThan(0)
      vars.forEach(v => expect(typeof v).toBe('string'))
    })

    it('should include DATABASE_URL', () => {
      expect(getRequiredEnvVars()).toContain('DATABASE_URL')
    })

    it('should include OPENROUTER_API_KEY', () => {
      expect(getRequiredEnvVars()).toContain('OPENROUTER_API_KEY')
    })

    it('should not include optional vars like OPENROUTER_APP_URL', () => {
      expect(getRequiredEnvVars()).not.toContain('OPENROUTER_APP_URL')
    })
  })

  describe('getOptionalEnvVars', () => {
    it('should return optional vars', () => {
      const vars = getOptionalEnvVars()
      expect(Array.isArray(vars)).toBe(true)
      expect(vars).toContain('OPENROUTER_APP_URL')
    })

    it('should not include required vars', () => {
      const vars = getOptionalEnvVars()
      expect(vars).not.toContain('DATABASE_URL')
    })
  })

  describe('isStripeConfigured', () => {
    it('should return false when no Stripe vars set', () => {
      expect(isStripeConfigured({})).toBe(false)
    })

    it('should return false when partial Stripe config', () => {
      expect(isStripeConfigured({
        STRIPE_SECRET_KEY: 'sk_test_abc',
      })).toBe(false)
    })

    it('should return true when all Stripe vars set', () => {
      expect(isStripeConfigured({
        STRIPE_SECRET_KEY: 'sk_test_abc',
        NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: 'pk_test_abc',
        STRIPE_WEBHOOK_SECRET: 'whsec_abc',
        STRIPE_PRICE_PRO: 'price_pro',
        STRIPE_PRICE_ULTRA: 'price_ultra',
      })).toBe(true)
    })
  })

  describe('getEnvironmentSummary', () => {
    it('should hide sensitive values', () => {
      const summary = getEnvironmentSummary({
        DATABASE_URL: 'postgresql://secret:password@host/db',
        NEXTAUTH_SECRET: 'super-secret-value',
        OPENROUTER_API_KEY: 'openrouter-secret-key',
      })
      expect(summary.DATABASE_URL).toBe('<hidden>')
      expect(summary.NEXTAUTH_SECRET).toBe('<hidden>')
      expect(summary.OPENROUTER_API_KEY).toBe('<hidden>')
    })

    it('should show non-sensitive values', () => {
      const summary = getEnvironmentSummary({
        NEXT_PUBLIC_FIREBASE_PROJECT_ID: 'my-project',
        NEXT_PUBLIC_ATS_API: 'http://localhost:8000',
      })
      expect(summary.NEXT_PUBLIC_FIREBASE_PROJECT_ID).toBe('my-project')
      expect(summary.NEXT_PUBLIC_ATS_API).toBe('http://localhost:8000')
    })

    it('should mark unset variables', () => {
      const summary = getEnvironmentSummary({})
      expect(summary.DATABASE_URL).toBe('<not set>')
    })

    it('should truncate long values', () => {
      const summary = getEnvironmentSummary({
        NEXT_PUBLIC_ATS_API: 'http://' + 'a'.repeat(100) + '.com',
      })
      expect(summary.NEXT_PUBLIC_ATS_API.length).toBeLessThanOrEqual(50)
      expect(summary.NEXT_PUBLIC_ATS_API).toContain('...')
    })
  })
})
