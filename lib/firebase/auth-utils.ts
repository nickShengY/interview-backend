import { getAdminAuth } from './admin'
import { prisma } from '../prisma'
import { isDemoUser, ensureDemoUser, DEMO_USER } from './demo-user'

export interface AuthUser {
  uid: string
  email: string
  name?: string
  image?: string
}

/**
 * Verify Firebase ID token (server-side)
 * Supports demo user bypass
 */
export async function verifyAuthToken(token: string): Promise<AuthUser | null> {
  try {
    // Check if demo token
    if (token === 'DEMO_TOKEN') {
      await ensureDemoUser()
      return {
        uid: DEMO_USER.uid,
        email: DEMO_USER.email,
        name: DEMO_USER.name,
        image: DEMO_USER.image,
      }
    }

    const adminAuth = getAdminAuth()
    if (!adminAuth) return null
    const decodedToken = await adminAuth.verifyIdToken(token)
    return {
      uid: decodedToken.uid,
      email: decodedToken.email || '',
      name: decodedToken.name,
      image: decodedToken.picture,
    }
  } catch (error) {
    console.error('Token verification failed:', error)
    return null
  }
}

/**
 * Get or create user in database after Firebase auth
 * Uses upsert to handle race conditions safely
 */
export async function syncUserToDatabase(authUser: AuthUser) {
  // Use upsert to handle race conditions (concurrent first requests)
  return prisma.user.upsert({
    where: { email: authUser.email },
    update: {
      name: authUser.name || undefined,
      image: authUser.image || undefined,
    },
    create: {
      id: authUser.uid,
      email: authUser.email,
      name: authUser.name,
      image: authUser.image,
      credits: isDemoUser(authUser.email) ? 1000 : 10,
      plan: isDemoUser(authUser.email) ? 'ULTRA' : 'FREE',
      emailVerified: new Date(),
    },
  })
}

/**
 * Resolve user ID from auth token - ALWAYS ensures user exists in database
 * This is the canonical way to get userId for all API routes
 * @returns The database user ID (not Firebase UID)
 */
export async function resolveUserId(request: Request): Promise<string> {
  const authHeader = request.headers.get('authorization') || ''
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : ''
  
  if (!token) {
    // No token - use demo user
    const demo = await ensureDemoUser()
    return demo.id
  }

  const authUser = await verifyAuthToken(token)
  
  if (!authUser) {
    // Invalid token - fall back to demo user
    const demo = await ensureDemoUser()
    return demo.id
  }

  // Ensure user exists in database and get their ID
  const user = await syncUserToDatabase(authUser)
  return user.id
}

/**
 * Get user by email, ensuring they exist
 */
export async function getUserByEmail(email: string) {
  return prisma.user.findUnique({
    where: { email },
  })
}
