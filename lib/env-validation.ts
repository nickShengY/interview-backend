/**
 * Environment Variable Validation
 * Validates required environment variables at startup
 */

interface EnvConfig {
  name: string
  required: boolean
  description: string
  validate?: (value: string) => boolean
  sensitive?: boolean // Hide value in logs
}

const ENV_CONFIG: EnvConfig[] = [
  // Database
  {
    name: 'DATABASE_URL',
    required: true,
    description: 'PostgreSQL database connection string',
    sensitive: true,
    validate: (val) => val.startsWith('postgresql://') || val.startsWith('postgres://'),
  },

  // Authentication
  {
    name: 'NEXTAUTH_SECRET',
    required: true,
    description: 'NextAuth JWT encryption secret (min 32 chars)',
    sensitive: true,
    validate: (val) => val.length >= 32,
  },
  {
    name: 'NEXTAUTH_URL',
    required: process.env.NODE_ENV === 'production',
    description: 'Canonical URL of the application',
    validate: (val) => val.startsWith('http://') || val.startsWith('https://'),
  },

  // Firebase
  {
    name: 'NEXT_PUBLIC_FIREBASE_API_KEY',
    required: true,
    description: 'Firebase API key (public)',
  },
  {
    name: 'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
    required: true,
    description: 'Firebase auth domain',
  },
  {
    name: 'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
    required: true,
    description: 'Firebase project ID',
  },
  {
    name: 'FIREBASE_PROJECT_ID',
    required: true,
    description: 'Firebase project ID (server-side)',
  },
  {
    name: 'FIREBASE_CLIENT_EMAIL',
    required: true,
    description: 'Firebase service account email',
    validate: (val) => val.includes('@') && val.includes('.iam.gserviceaccount.com'),
  },
  {
    name: 'FIREBASE_PRIVATE_KEY',
    required: true,
    description: 'Firebase service account private key',
    sensitive: true,
    validate: (val) => val.includes('BEGIN PRIVATE KEY'),
  },

  // Google OAuth
  {
    name: 'GOOGLE_CLIENT_ID',
    required: true,
    description: 'Google OAuth client ID',
  },
  {
    name: 'GOOGLE_CLIENT_SECRET',
    required: true,
    description: 'Google OAuth client secret',
    sensitive: true,
  },

  // AI (OpenRouter)
  {
    name: 'OPENROUTER_API_KEY',
    required: true,
    description: 'OpenRouter API key',
    sensitive: true,
  },
  {
    name: 'OPENROUTER_APP_URL',
    required: false,
    description: 'App URL for OpenRouter attribution (HTTP-Referer header)',
  },
  {
    name: 'OPENROUTER_APP_NAME',
    required: false,
    description: 'App name for OpenRouter attribution (X-Title header)',
  },

  // Stripe (optional - can be disabled)
  {
    name: 'STRIPE_SECRET_KEY',
    required: false,
    description: 'Stripe secret key (sk_live_* or sk_test_*)',
    sensitive: true,
    validate: (val) => !val || val.startsWith('sk_'),
  },
  {
    name: 'STRIPE_WEBHOOK_SECRET',
    required: false,
    description: 'Stripe webhook signing secret',
    sensitive: true,
    validate: (val) => !val || val.startsWith('whsec_'),
  },
  {
    name: 'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY',
    required: false,
    description: 'Stripe publishable key (pk_live_* or pk_test_*)',
    validate: (val) => !val || val.startsWith('pk_'),
  },
  {
    name: 'STRIPE_PRICE_PRO',
    required: false,
    description: 'Stripe price ID for PRO plan',
    validate: (val) => !val || val.startsWith('price_'),
  },
  {
    name: 'STRIPE_PRICE_ULTRA',
    required: false,
    description: 'Stripe price ID for ULTRA plan',
    validate: (val) => !val || val.startsWith('price_'),
  },

  // Backend API
  {
    name: 'NEXT_PUBLIC_ATS_API',
    required: true,
    description: 'Backend API URL for ATS scanning',
    validate: (val) => val.startsWith('http://') || val.startsWith('https://'),
  },
]

export interface ValidationResult {
  valid: boolean
  errors: string[]
  warnings: string[]
  missingRequired: string[]
  missingOptional: string[]
  invalidValues: Array<{ name: string; reason: string }>
}

/**
 * Validate all environment variables
 */
export function validateEnvironment(env: Record<string, string | undefined> = process.env): ValidationResult {
  const errors: string[] = []
  const warnings: string[] = []
  const missingRequired: string[] = []
  const missingOptional: string[] = []
  const invalidValues: Array<{ name: string; reason: string }> = []

  for (const config of ENV_CONFIG) {
    const value = env[config.name]

    // Check if variable exists
    if (!value || value.trim() === '') {
      if (config.required) {
        missingRequired.push(config.name)
        errors.push(`Missing required environment variable: ${config.name} - ${config.description}`)
      } else {
        missingOptional.push(config.name)
        warnings.push(`Optional environment variable not set: ${config.name} - ${config.description}`)
      }
      continue
    }

    // Validate value if validator provided
    if (config.validate && !config.validate(value)) {
      invalidValues.push({
        name: config.name,
        reason: `Invalid format for ${config.name}`,
      })
      errors.push(
        `Invalid value for ${config.name}: ${config.description}${
          config.sensitive ? ' (value hidden)' : ` (got: ${value.substring(0, 20)}...)`
        }`
      )
    }
  }

  // Additional cross-variable validations
  if (env.NODE_ENV === 'production') {
    // Production-specific checks
    if (env.DATABASE_URL && env.DATABASE_URL.includes('localhost')) {
      warnings.push('DATABASE_URL points to localhost in production environment')
    }

    if (env.NEXT_PUBLIC_ATS_API && env.NEXT_PUBLIC_ATS_API.includes('localhost')) {
      warnings.push('NEXT_PUBLIC_ATS_API points to localhost in production environment')
    }

    if (env.STRIPE_SECRET_KEY && env.STRIPE_SECRET_KEY.startsWith('sk_test_')) {
      warnings.push('Using Stripe test key in production environment')
    }

    if (!env.NEXTAUTH_URL) {
      errors.push('NEXTAUTH_URL is required in production')
      missingRequired.push('NEXTAUTH_URL')
    }
  }

  // Check Stripe consistency
  const hasStripeSecret = env.STRIPE_SECRET_KEY && env.STRIPE_SECRET_KEY.trim() !== ''
  const hasStripePublic = env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY && env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY.trim() !== ''

  if (hasStripeSecret && !hasStripePublic) {
    warnings.push('STRIPE_SECRET_KEY is set but NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is missing')
  }
  if (!hasStripeSecret && hasStripePublic) {
    warnings.push('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is set but STRIPE_SECRET_KEY is missing')
  }

  // Check key type consistency (test vs live)
  if (hasStripeSecret && hasStripePublic) {
    const isSecretTest = env.STRIPE_SECRET_KEY!.startsWith('sk_test_')
    const isPublicTest = env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!.startsWith('pk_test_')

    if (isSecretTest !== isPublicTest) {
      errors.push('Stripe key mismatch: secret and publishable keys are from different environments (test/live)')
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    missingRequired,
    missingOptional,
    invalidValues,
  }
}

/**
 * Print validation results to console
 */
export function printValidationResults(result: ValidationResult): void {
  if (result.valid) {
    console.log('✅ Environment validation passed')
    if (result.warnings.length > 0) {
      console.warn('\n⚠️  Warnings:')
      result.warnings.forEach((warning) => console.warn(`  - ${warning}`))
    }
    if (result.missingOptional.length > 0) {
      console.log('\nℹ️  Optional variables not set:', result.missingOptional.join(', '))
    }
  } else {
    console.error('❌ Environment validation failed\n')
    console.error('Errors:')
    result.errors.forEach((error) => console.error(`  - ${error}`))

    if (result.warnings.length > 0) {
      console.warn('\nWarnings:')
      result.warnings.forEach((warning) => console.warn(`  - ${warning}`))
    }

    console.error('\n💡 Tips:')
    console.error('  1. Copy .env.example to .env.local and fill in required values')
    console.error('  2. Check the README.md for setup instructions')
    console.error('  3. Ensure all required environment variables are set')
  }
}

/**
 * Validate environment and throw if invalid (for startup validation)
 */
export function validateEnvironmentOrThrow(): void {
  const result = validateEnvironment()
  printValidationResults(result)

  if (!result.valid) {
    throw new Error(
      `Environment validation failed with ${result.errors.length} error(s). See console output above for details.`
    )
  }
}

/**
 * Get a list of all environment variable names
 */
export function getRequiredEnvVars(): string[] {
  return ENV_CONFIG.filter((c) => c.required).map((c) => c.name)
}

/**
 * Get a list of all optional environment variable names
 */
export function getOptionalEnvVars(): string[] {
  return ENV_CONFIG.filter((c) => !c.required).map((c) => c.name)
}

/**
 * Check if Stripe is configured
 */
export function isStripeConfigured(env: Record<string, string | undefined> = process.env): boolean {
  return !!(
    env.STRIPE_SECRET_KEY &&
    env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY &&
    env.STRIPE_WEBHOOK_SECRET &&
    env.STRIPE_PRICE_PRO &&
    env.STRIPE_PRICE_ULTRA
  )
}

/**
 * Get environment summary (for debugging, hides sensitive values)
 */
export function getEnvironmentSummary(env: Record<string, string | undefined> = process.env): Record<string, string> {
  const summary: Record<string, string> = {}

  for (const config of ENV_CONFIG) {
    const value = env[config.name]
    if (!value) {
      summary[config.name] = '<not set>'
    } else if (config.sensitive) {
      summary[config.name] = '<hidden>'
    } else {
      summary[config.name] = value.length > 50 ? `${value.substring(0, 47)}...` : value
    }
  }

  return summary
}
