/**
 * Unit tests for daily check-in API route
 */

import { prismaMock } from '../../setup/prisma-mock'

jest.mock('@/lib/prisma', () => ({
  prisma: prismaMock,
}))

jest.mock('@/lib/firebase/auth-utils', () => ({
  resolveUserId: jest.fn(),
}))

import { GET, POST } from '@/app/api/user/checkin/route'
import { resolveUserId } from '@/lib/firebase/auth-utils'
import { NextRequest } from 'next/server'

const createRequest = (method: string = 'GET') => {
  return new NextRequest('http://localhost/api/user/checkin', { method })
}

describe('Check-in API', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GET /api/user/checkin', () => {
    it('should return check-in status for new user', async () => {
      ;(resolveUserId as jest.Mock).mockResolvedValue('user-123')
      ;(prismaMock.userProgress.findUnique as jest.Mock).mockResolvedValue(null)

      const request = createRequest('GET')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.currentStreak).toBe(0)
      expect(data.canCheckIn).toBe(true)
    })

    it('should return check-in status for existing user', async () => {
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)

      ;(resolveUserId as jest.Mock).mockResolvedValue('user-123')
      ;(prismaMock.userProgress.findUnique as jest.Mock).mockResolvedValue({
        currentStreak: 5,
        longestStreak: 10,
        totalCheckIns: 50,
        lastCheckIn: yesterday,
      })

      const request = createRequest('GET')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.currentStreak).toBe(5)
      expect(data.canCheckIn).toBe(true)
    })

    it('should indicate cannot check in if already checked in today', async () => {
      const today = new Date()

      ;(resolveUserId as jest.Mock).mockResolvedValue('user-123')
      ;(prismaMock.userProgress.findUnique as jest.Mock).mockResolvedValue({
        currentStreak: 5,
        longestStreak: 10,
        totalCheckIns: 50,
        lastCheckIn: today,
      })

      const request = createRequest('GET')
      const response = await GET(request)
      const data = await response.json()

      expect(data.canCheckIn).toBe(false)
    })
  })

  describe('POST /api/user/checkin', () => {
    it('should perform first check-in successfully', async () => {
      ;(resolveUserId as jest.Mock).mockResolvedValue('user-123')
      ;(prismaMock.$transaction as jest.Mock).mockImplementation(async (callback: Function) => {
        const mockTx = {
          userProgress: {
            upsert: jest.fn().mockResolvedValue({
              currentStreak: 0,
              longestStreak: 0,
              lastCheckIn: null,
            }),
            updateMany: jest.fn().mockResolvedValue({ count: 1 }),
          },
          user: {
            update: jest.fn().mockResolvedValue({ credits: 15 }),
          },
          transaction: {
            create: jest.fn().mockResolvedValue({ id: 'tx-1' }),
          },
        }
        return callback(mockTx)
      })

      const request = createRequest('POST')
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.reward).toBe(5) // Base reward
    })

    it('should return already checked in message', async () => {
      const today = new Date()

      ;(resolveUserId as jest.Mock).mockResolvedValue('user-123')
      ;(prismaMock.$transaction as jest.Mock).mockImplementation(async (callback: Function) => {
        const mockTx = {
          userProgress: {
            upsert: jest.fn().mockResolvedValue({
              currentStreak: 5,
              longestStreak: 5,
              lastCheckIn: today,
            }),
            updateMany: jest.fn().mockResolvedValue({ count: 0 }),
            findUnique: jest.fn().mockResolvedValue({
              currentStreak: 5,
              longestStreak: 5,
            }),
          },
          user: {
            update: jest.fn(),
          },
          transaction: {
            create: jest.fn(),
          },
        }
        return callback(mockTx)
      })

      const request = createRequest('POST')
      const response = await POST(request)
      const data = await response.json()

      expect(data.success).toBe(false)
      expect(data.message).toContain('Already checked in')
    })

    it('should increment streak for consecutive days', async () => {
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)

      ;(resolveUserId as jest.Mock).mockResolvedValue('user-123')
      ;(prismaMock.$transaction as jest.Mock).mockImplementation(async (callback: Function) => {
        const mockTx = {
          userProgress: {
            upsert: jest.fn().mockResolvedValue({
              currentStreak: 5,
              longestStreak: 5,
              lastCheckIn: yesterday,
            }),
            updateMany: jest.fn().mockResolvedValue({ count: 1 }),
          },
          user: {
            update: jest.fn().mockResolvedValue({ credits: 100 }),
          },
          transaction: {
            create: jest.fn().mockResolvedValue({ id: 'tx-1' }),
          },
        }
        return callback(mockTx)
      })

      const request = createRequest('POST')
      const response = await POST(request)
      const data = await response.json()

      expect(data.success).toBe(true)
      expect(data.currentStreak).toBe(6) // 5 + 1
    })

    it('should reset streak after missed day', async () => {
      const twoDaysAgo = new Date()
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 2)

      ;(resolveUserId as jest.Mock).mockResolvedValue('user-123')
      ;(prismaMock.$transaction as jest.Mock).mockImplementation(async (callback: Function) => {
        const mockTx = {
          userProgress: {
            upsert: jest.fn().mockResolvedValue({
              currentStreak: 10,
              longestStreak: 10,
              lastCheckIn: twoDaysAgo,
            }),
            updateMany: jest.fn().mockResolvedValue({ count: 1 }),
          },
          user: {
            update: jest.fn().mockResolvedValue({ credits: 15 }),
          },
          transaction: {
            create: jest.fn().mockResolvedValue({ id: 'tx-1' }),
          },
        }
        return callback(mockTx)
      })

      const request = createRequest('POST')
      const response = await POST(request)
      const data = await response.json()

      expect(data.success).toBe(true)
      expect(data.currentStreak).toBe(1) // Reset to 1
    })

    it('should give weekly bonus on 7-day streak', async () => {
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)

      ;(resolveUserId as jest.Mock).mockResolvedValue('user-123')
      ;(prismaMock.$transaction as jest.Mock).mockImplementation(async (callback: Function) => {
        const mockTx = {
          userProgress: {
            upsert: jest.fn().mockResolvedValue({
              currentStreak: 6,
              longestStreak: 6,
              lastCheckIn: yesterday,
            }),
            updateMany: jest.fn().mockResolvedValue({ count: 1 }),
          },
          user: {
            update: jest.fn().mockResolvedValue({ credits: 125 }),
          },
          transaction: {
            create: jest.fn().mockResolvedValue({ id: 'tx-1' }),
          },
        }
        return callback(mockTx)
      })

      const request = createRequest('POST')
      const response = await POST(request)
      const data = await response.json()

      expect(data.success).toBe(true)
      expect(data.currentStreak).toBe(7)
      expect(data.bonusReward).toBe(20) // Weekly bonus
    })

    it('should handle concurrent check-in attempts idempotently', async () => {
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)

      ;(resolveUserId as jest.Mock).mockResolvedValue('user-123')
      ;(prismaMock.$transaction as jest.Mock).mockImplementation(async (callback: Function) => {
        const mockTx = {
          userProgress: {
            upsert: jest.fn().mockResolvedValue({
              currentStreak: 5,
              longestStreak: 5,
              lastCheckIn: yesterday,
            }),
            updateMany: jest.fn().mockResolvedValue({ count: 0 }), // Simulates concurrent update
            findUnique: jest.fn().mockResolvedValue({
              currentStreak: 6, // Another request already updated
              longestStreak: 6,
            }),
          },
          user: {
            update: jest.fn(),
          },
          transaction: {
            create: jest.fn(),
          },
        }
        return callback(mockTx)
      })

      const request = createRequest('POST')
      const response = await POST(request)
      const data = await response.json()

      // Should recognize the race condition and not double-award
      expect(data.success).toBe(false)
      expect(data.message).toContain('Already checked in')
    })
  })

  describe('Streak Bonuses', () => {
    it.each([
      [3, 3],   // 3+ day streak gets small bonus
      [5, 5],   // 5 day streak
      [7, 20],  // Weekly bonus
      [14, 20], // 2 weeks (another weekly)
      [30, 100], // Monthly bonus
    ])('should calculate correct bonus for %i day streak', async (days, expectedBonus) => {
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)

      ;(resolveUserId as jest.Mock).mockResolvedValue('user-123')
      ;(prismaMock.$transaction as jest.Mock).mockImplementation(async (callback: Function) => {
        const mockTx = {
          userProgress: {
            upsert: jest.fn().mockResolvedValue({
              currentStreak: days - 1,
              longestStreak: days - 1,
              lastCheckIn: yesterday,
            }),
            updateMany: jest.fn().mockResolvedValue({ count: 1 }),
          },
          user: {
            update: jest.fn().mockResolvedValue({ credits: 100 }),
          },
          transaction: {
            create: jest.fn().mockResolvedValue({ id: 'tx-1' }),
          },
        }
        return callback(mockTx)
      })

      const request = createRequest('POST')
      const response = await POST(request)
      const data = await response.json()

      expect(data.success).toBe(true)
      expect(data.bonusReward).toBe(expectedBonus)
    })
  })
})
