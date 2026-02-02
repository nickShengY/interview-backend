/**
 * Environment variable validation
 * This file ensures all required environment variables are present
 */

const requiredEnvVars = [
  'DATABASE_URL',
  'NEXTAUTH_SECRET',
  'NEXTAUTH_URL',
  'GOOGLE_CLIENT_ID',
  'GOOGLE_CLIENT_SECRET',
  'GOOGLE_API_KEY',
  'STRIPE_SECRET_KEY',
  'STRIPE_WEBHOOK_SECRET',
  'STRIPE_PRICE_PRO',
  'STRIPE_PRICE_ULTRA',
  'NEXT_PUBLIC_ATS_API',
  'NEXT_PUBLIC_APP_URL',
] as const

const nativeConsole = globalThis.console

export function validateEnv() {
  const missing: string[] = []
  
  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      missing.push(envVar)
    }
  }
  
  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables:\n${missing.map(v => `  - ${v}`).join('\n')}\n\n` +
      'Please check your .env.local file and ensure all required variables are set.'
    )
  }
  
  // Validate URL formats
  try {
    new URL(process.env.DATABASE_URL!)
    new URL(process.env.NEXTAUTH_URL!)
    new URL(process.env.NEXT_PUBLIC_APP_URL!)
    new URL(process.env.NEXT_PUBLIC_ATS_API!)
  } catch (error) {
    throw new Error(`Invalid URL format in environment variables: ${error}`)
  }
  
  // Validate Stripe keys format
  if (!process.env.STRIPE_SECRET_KEY?.startsWith('sk_')) {
    throw new Error('STRIPE_SECRET_KEY must start with "sk_"')
  }
  
  if (!process.env.STRIPE_WEBHOOK_SECRET?.startsWith('whsec_')) {
    throw new Error('STRIPE_WEBHOOK_SECRET must start with "whsec_"')
  }
  
  if (!process.env.STRIPE_PRICE_PRO?.startsWith('price_')) {
    throw new Error('STRIPE_PRICE_PRO must start with "price_"')
  }
  
  if (!process.env.STRIPE_PRICE_ULTRA?.startsWith('price_')) {
    throw new Error('STRIPE_PRICE_ULTRA must start with "price_"')
  }
  
  nativeConsole.log('✅ Environment variables validated successfully')
}

// Auto-validate in development
if (process.env.NODE_ENV !== 'production') {
  try {
    validateEnv()
  } catch (error) {
    nativeConsole.error('❌ Environment validation failed:', error)
  }
}
