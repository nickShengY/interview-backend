/**
 * Unit tests for Firebase auth utilities
 */

import { prismaMock } from '../setup/prisma-mock'

// Mock prisma
jest.mock('@/lib/prisma', () => ({
  prisma: prismaMock,
}))

// Mock Firebase admin
jest.mock('@/lib/firebase/admin', () => ({
  getAdminAuth: jest.fn(),
}))

// Mock demo-user
jest.mock('@/lib/firebase/demo-user', () => ({
  isDemoUser: jest.fn((email: string) => email === 'demo@interview-plus.app'),
  ensureDemoUser: jest.fn(),
  DEMO_USER: {
    email: 'demo@interview-plus.app',
    password: 'Demo123!',
    uid: 'demo-user-uid-12345',
    name: 'Demo User',
    image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Demo',
  },
}))

import { verifyAuthToken, syncUserToDatabase, resolveUserId, getUserByEmail } from '@/lib/firebase/auth-utils'
import { getAdminAuth } from '@/lib/firebase/admin'
import { ensureDemoUser, DEMO_USER } from '@/lib/firebase/demo-user'

describe('Auth Utilities', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('verifyAuthToken', () => {
    it('should return demo user for DEMO_TOKEN', async () => {
      ;(ensureDemoUser as jest.Mock).mockResolvedValue({
        id: DEMO_USER.uid,
        email: DEMO_USER.email,
      })

      const result = await verifyAuthToken('DEMO_TOKEN')

      expect(result).not.toBeNull()
      expect(result?.uid).toBe(DEMO_USER.uid)
      expect(result?.email).toBe(DEMO_USER.email)
    })

    it('should verify Firebase token when admin auth available', async () => {
      const mockVerifyIdToken = jest.fn().mockResolvedValue({
        uid: 'firebase-uid-123',
        email: 'user@example.com',
        name: 'Test User',
        picture: 'https://example.com/avatar.png',
      })

      ;(getAdminAuth as jest.Mock).mockReturnValue({
        verifyIdToken: mockVerifyIdToken,
      })

      const result = await verifyAuthToken('valid-firebase-token')

      expect(mockVerifyIdToken).toHaveBeenCalledWith('valid-firebase-token')
      expect(result?.uid).toBe('firebase-uid-123')
      expect(result?.email).toBe('user@example.com')
    })

    it('should return null when admin auth is not available', async () => {
      ;(getAdminAuth as jest.Mock).mockReturnValue(null)

      const result = await verifyAuthToken('some-token')

      expect(result).toBeNull()
    })

    it('should return null when token verification fails', async () => {
      const mockVerifyIdToken = jest.fn().mockRejectedValue(new Error('Invalid token'))

      ;(getAdminAuth as jest.Mock).mockReturnValue({
        verifyIdToken: mockVerifyIdToken,
      })

      const result = await verifyAuthToken('invalid-token')

      expect(result).toBeNull()
    })

    it('should handle missing email in decoded token', async () => {
      const mockVerifyIdToken = jest.fn().mockResolvedValue({
        uid: 'uid-no-email',
        // No email field
      })

      ;(getAdminAuth as jest.Mock).mockReturnValue({
        verifyIdToken: mockVerifyIdToken,
      })

      const result = await verifyAuthToken('token-no-email')

      expect(result?.email).toBe('')
    })
  })

  describe('syncUserToDatabase', () => {
    it('should create new user if not exists', async () => {
      const authUser = {
        uid: 'new-user-uid',
        email: 'newuser@example.com',
        name: 'New User',
        image: 'https://example.com/new.png',
      }

      prismaMock.user.upsert.mockResolvedValue({
        id: authUser.uid,
        email: authUser.email,
        name: authUser.name,
        image: authUser.image,
        credits: 10,
        plan: 'FREE',
        emailVerified: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        country: null,
        mbti: null,
        sign: null,
        stripeCustomerId: null,
      })

      const result = await syncUserToDatabase(authUser)

      expect(prismaMock.user.upsert).toHaveBeenCalledWith({
        where: { email: authUser.email },
        update: {
          name: authUser.name,
          image: authUser.image,
        },
        create: expect.objectContaining({
          id: authUser.uid,
          email: authUser.email,
          name: authUser.name,
          credits: 10,
          plan: 'FREE',
        }),
      })
      expect(result.email).toBe(authUser.email)
    })

    it('should give demo user 1000 credits and ULTRA plan', async () => {
      const authUser = {
        uid: DEMO_USER.uid,
        email: DEMO_USER.email,
        name: DEMO_USER.name,
        image: DEMO_USER.image,
      }

      prismaMock.user.upsert.mockResolvedValue({
        id: authUser.uid,
        email: authUser.email,
        name: authUser.name,
        image: authUser.image,
        credits: 1000,
        plan: 'ULTRA',
        emailVerified: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        country: null,
        mbti: null,
        sign: null,
        stripeCustomerId: null,
      })

      await syncUserToDatabase(authUser)

      expect(prismaMock.user.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          create: expect.objectContaining({
            credits: 1000,
            plan: 'ULTRA',
          }),
        })
      )
    })

    it('should update existing user on subsequent logins', async () => {
      const authUser = {
        uid: 'existing-uid',
        email: 'existing@example.com',
        name: 'Updated Name',
        image: 'https://example.com/updated.png',
      }

      prismaMock.user.upsert.mockResolvedValue({
        id: 'db-id',
        email: authUser.email,
        name: authUser.name,
        image: authUser.image,
        credits: 50,
        plan: 'PRO',
        emailVerified: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        country: null,
        mbti: null,
        sign: null,
        stripeCustomerId: null,
      })

      await syncUserToDatabase(authUser)

      expect(prismaMock.user.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          update: {
            name: authUser.name,
            image: authUser.image,
          },
        })
      )
    })
  })

  describe('resolveUserId', () => {
    it('should return demo user ID when no token provided', async () => {
      const mockRequest = new Request('http://localhost/api/test', {
        headers: {},
      })

      ;(ensureDemoUser as jest.Mock).mockResolvedValue({
        id: 'demo-db-id',
        email: DEMO_USER.email,
      })

      const userId = await resolveUserId(mockRequest)

      expect(userId).toBe('demo-db-id')
      expect(ensureDemoUser).toHaveBeenCalled()
    })

    it('should return demo user ID for invalid token', async () => {
      const mockRequest = new Request('http://localhost/api/test', {
        headers: {
          authorization: 'Bearer invalid-token',
        },
      })

      ;(getAdminAuth as jest.Mock).mockReturnValue({
        verifyIdToken: jest.fn().mockRejectedValue(new Error('Invalid')),
      })
      ;(ensureDemoUser as jest.Mock).mockResolvedValue({
        id: 'demo-db-id',
        email: DEMO_USER.email,
      })

      const userId = await resolveUserId(mockRequest)

      expect(userId).toBe('demo-db-id')
    })

    it('should return synced user ID for valid token', async () => {
      const mockRequest = new Request('http://localhost/api/test', {
        headers: {
          authorization: 'Bearer valid-token',
        },
      })

      ;(getAdminAuth as jest.Mock).mockReturnValue({
        verifyIdToken: jest.fn().mockResolvedValue({
          uid: 'firebase-uid',
          email: 'user@example.com',
          name: 'Test User',
        }),
      })

      prismaMock.user.upsert.mockResolvedValue({
        id: 'db-user-id',
        email: 'user@example.com',
        name: 'Test User',
        image: null,
        credits: 10,
        plan: 'FREE',
        emailVerified: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        country: null,
        mbti: null,
        sign: null,
        stripeCustomerId: null,
      })

      const userId = await resolveUserId(mockRequest)

      expect(userId).toBe('db-user-id')
    })

    it('should handle DEMO_TOKEN', async () => {
      const mockRequest = new Request('http://localhost/api/test', {
        headers: {
          authorization: 'Bearer DEMO_TOKEN',
        },
      })

      ;(ensureDemoUser as jest.Mock).mockResolvedValue({
        id: 'demo-db-id',
        email: DEMO_USER.email,
      })

      prismaMock.user.upsert.mockResolvedValue({
        id: 'demo-db-id',
        email: DEMO_USER.email,
        name: DEMO_USER.name,
        image: DEMO_USER.image,
        credits: 1000,
        plan: 'ULTRA',
        emailVerified: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        country: null,
        mbti: null,
        sign: null,
        stripeCustomerId: null,
      })

      const userId = await resolveUserId(mockRequest)

      expect(userId).toBe('demo-db-id')
    })
  })

  describe('getUserByEmail', () => {
    it('should return user when found', async () => {
      prismaMock.user.findUnique.mockResolvedValue({
        id: 'user-id',
        email: 'found@example.com',
        name: 'Found User',
        image: null,
        credits: 25,
        plan: 'FREE',
        emailVerified: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        country: null,
        mbti: null,
        sign: null,
        stripeCustomerId: null,
      })

      const user = await getUserByEmail('found@example.com')

      expect(user?.email).toBe('found@example.com')
      expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'found@example.com' },
      })
    })

    it('should return null when user not found', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null)

      const user = await getUserByEmail('nonexistent@example.com')

      expect(user).toBeNull()
    })
  })
})
