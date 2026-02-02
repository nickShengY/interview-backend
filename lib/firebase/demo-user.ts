import { prisma } from '../prisma'

// Demo user credentials
export const DEMO_USER = {
  email: 'demo@interview-plus.app',
  password: 'Demo123!',
  uid: 'demo-user-uid-12345',
  name: 'Demo User',
  image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Demo',
}

/**
 * Check if user is demo user (bypass Firebase auth)
 */
export function isDemoUser(email: string): boolean {
  return email === DEMO_USER.email
}

/**
 * Get or create demo user in database
 */
export async function ensureDemoUser() {
  const existing = await prisma.user.findUnique({
    where: { email: DEMO_USER.email },
  })

  if (existing) {
    return existing
  }

  // Create demo user with generous credits
  return prisma.user.create({
    data: {
      id: DEMO_USER.uid,
      email: DEMO_USER.email,
      name: DEMO_USER.name,
      image: DEMO_USER.image,
      credits: 1000, // Demo user gets 1000 credits
      plan: 'ULTRA', // Full access
      emailVerified: new Date(),
    },
  })
}

/**
 * Verify demo user login
 */
export async function verifyDemoLogin(email: string, password: string): Promise<boolean> {
  return email === DEMO_USER.email && password === DEMO_USER.password
}
