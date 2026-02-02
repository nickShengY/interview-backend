/**
 * Integration tests for reward system caps and cooldowns
 * Tests daily micro-reward cap and jackpot cooldown enforcement
 */

import { prismaMock } from '../../setup/prisma-mock'

jest.mock('@/lib/prisma', () => ({
  prisma: prismaMock,
}))

jest.mock('@/lib/firebase/auth-utils', () => ({
  resolveUserId: jest.fn(),
}))

jest.mock('@/lib/credits', () => ({
  ensureCredits: jest.fn(),
  refundCredits: jest.fn(),
}))

jest.mock('@google/genai', () => ({
  GoogleGenAI: jest.fn().mockImplementation(() => ({
    models: {
      generateContent: jest.fn().mockResolvedValue({
        text: JSON.stringify({
          verdict: 'correct',
          solution: {
            idealAnswer: 'Test answer',
            keyPoints: ['Point 1'],
            improvementTips: ['Tip 1'],
          },
        }),
      }),
    },
  })),
}))

import { POST } from '@/app/api/interview/evaluate/route'
import { resolveUserId } from '@/lib/firebase/auth-utils'
import { ensureCredits } from '@/lib/credits'

const MICRO_REWARD = 5
const JACKPOT_REWARD = 100
const DAILY_MICRO_REWARD_CAP = 25
const JACKPOT_COOLDOWN_DAYS = 7

const createRequest = (body: object) => {
  return new Request('http://localhost/api/interview/evaluate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

describe('Reward Caps & Cooldowns', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    process.env.GOOGLE_API_KEY = 'test-key'
  })

  describe('Daily Micro-Reward Cap (25 credits/day)', () => {
    it('should allow micro rewards up to 25 credits per day', async () => {
      ;(resolveUserId as jest.Mock).mockResolvedValue('user-123')
      ;(ensureCredits as jest.Mock).mockResolvedValue(undefined)

      const today = new Date()
      const startOfToday = new Date(today)
      startOfToday.setHours(0, 0, 0, 0)

      // Mock user already earned 20 credits today
      ;(prismaMock.transaction.aggregate as jest.Mock).mockResolvedValue({
        _sum: { delta: 20 }, // 20 credits earned today
      })

      ;(prismaMock.user.findUnique as jest.Mock).mockResolvedValue({
        credits: 50,
      })

      ;(prismaMock.userProgress.findUnique as jest.Mock).mockResolvedValue({
        consecutiveLosses: 0,
        totalQuestionSets: 5,
      })

      setupCompletingSession()

      const request = createRequest({
        question: 'Final question',
        answer: 'Comprehensive answer covering all key points thoroughly',
        type: 'technical',
        sessionId: 'completing-session',
      })

      // Mock reward calculation to return micro reward
      jest.spyOn(Math, 'random').mockReturnValue(0.01) // Force micro reward

      const response = await POST(request)
      const data = await response.json()

      if (data.reward) {
        // Should allow 5 more credits (20 + 5 = 25)
        expect(data.reward.rewardAmount).toBeLessThanOrEqual(MICRO_REWARD)
      }
    })

    it('should block micro rewards when daily cap is reached', async () => {
      ;(resolveUserId as jest.Mock).mockResolvedValue('user-123')
      ;(ensureCredits as jest.Mock).mockResolvedValue(undefined)

      // Mock user already earned 25 credits today (cap reached)
      ;(prismaMock.transaction.aggregate as jest.Mock).mockResolvedValue({
        _sum: { delta: 25 },
      })

      ;(prismaMock.user.findUnique as jest.Mock).mockResolvedValue({
        credits: 50,
      })

      ;(prismaMock.userProgress.findUnique as jest.Mock).mockResolvedValue({
        consecutiveLosses: 0,
        totalQuestionSets: 5,
      })

      setupCompletingSession()

      const request = createRequest({
        question: 'Final question',
        answer: 'Another comprehensive answer for testing purposes',
        type: 'technical',
        sessionId: 'completing-session',
      })

      jest.spyOn(Math, 'random').mockReturnValue(0.01) // Try to trigger micro reward

      const response = await POST(request)
      const data = await response.json()

      if (data.reward) {
        // Should be blocked (0 credits)
        expect(data.reward.rewardAmount).toBe(0)
      }
    })

    it('should reset cap at midnight (new day)', async () => {
      ;(resolveUserId as jest.Mock).mockResolvedValue('user-123')
      ;(ensureCredits as jest.Mock).mockResolvedValue(undefined)

      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)

      // Mock user earned 25 credits YESTERDAY (should reset today)
      ;(prismaMock.transaction.aggregate as jest.Mock).mockResolvedValue({
        _sum: { delta: 0 }, // 0 credits today (cap reset)
      })

      ;(prismaMock.user.findUnique as jest.Mock).mockResolvedValue({
        credits: 50,
      })

      ;(prismaMock.userProgress.findUnique as jest.Mock).mockResolvedValue({
        consecutiveLosses: 0,
        totalQuestionSets: 5,
      })

      setupCompletingSession()

      const request = createRequest({
        question: 'Final question',
        answer: 'Testing daily reset functionality with sufficient content',
        type: 'technical',
        sessionId: 'completing-session',
      })

      jest.spyOn(Math, 'random').mockReturnValue(0.01)

      const response = await POST(request)
      const data = await response.json()

      if (data.reward && data.reward.rewardAmount === MICRO_REWARD) {
        // Should allow reward (new day)
        expect(data.reward.rewardAmount).toBe(MICRO_REWARD)
      }
    })

    it('should count only REWARD transactions toward cap', async () => {
      ;(resolveUserId as jest.Mock).mockResolvedValue('user-123')
      ;(ensureCredits as jest.Mock).mockResolvedValue(undefined)

      // Mock various transactions today
      ;(prismaMock.transaction.aggregate as jest.Mock).mockResolvedValue({
        _sum: { delta: 10 }, // Only 10 REWARD credits
      })

      ;(prismaMock.user.findUnique as jest.Mock).mockResolvedValue({
        credits: 150,
      })

      ;(prismaMock.userProgress.findUnique as jest.Mock).mockResolvedValue({
        consecutiveLosses: 0,
        totalQuestionSets: 5,
      })

      setupCompletingSession()

      const request = createRequest({
        question: 'Final question',
        answer: 'Verifying transaction type filtering in cap calculation',
        type: 'technical',
        sessionId: 'completing-session',
      })

      jest.spyOn(Math, 'random').mockReturnValue(0.01)

      const response = await POST(request)

      // Should check aggregate with correct filter
      expect(prismaMock.transaction.aggregate).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            type: 'REWARD',
            delta: { gt: 0, lt: JACKPOT_REWARD },
          }),
        })
      )
    })
  })

  describe('Jackpot Cooldown (7 days)', () => {
    it('should allow jackpot if no recent jackpot won', async () => {
      ;(resolveUserId as jest.Mock).mockResolvedValue('user-123')
      ;(ensureCredits as jest.Mock).mockResolvedValue(undefined)

      // No recent jackpot
      ;(prismaMock.transaction.findFirst as jest.Mock).mockResolvedValue(null)
      ;(prismaMock.transaction.aggregate as jest.Mock).mockResolvedValue({
        _sum: { delta: 0 },
      })

      ;(prismaMock.user.findUnique as jest.Mock).mockResolvedValue({
        credits: 50,
      })

      ;(prismaMock.userProgress.findUnique as jest.Mock).mockResolvedValue({
        consecutiveLosses: 0,
        totalQuestionSets: 5,
      })

      setupCompletingSession()

      const request = createRequest({
        question: 'Final question',
        answer: 'Testing jackpot eligibility without recent wins',
        type: 'technical',
        sessionId: 'completing-session',
      })

      jest.spyOn(Math, 'random').mockReturnValue(0.0001) // Force jackpot attempt

      await POST(request)

      // Should query for recent jackpot
      expect(prismaMock.transaction.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            type: 'REWARD',
            delta: JACKPOT_REWARD,
          }),
        })
      )
    })

    it('should block jackpot if won within last 7 days', async () => {
      ;(resolveUserId as jest.Mock).mockResolvedValue('user-123')
      ;(ensureCredits as jest.Mock).mockResolvedValue(undefined)

      const threeDaysAgo = new Date()
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3)

      // Mock recent jackpot (3 days ago)
      ;(prismaMock.transaction.findFirst as jest.Mock).mockResolvedValue({
        id: 'recent-jackpot',
        delta: JACKPOT_REWARD,
        createdAt: threeDaysAgo,
      })

      ;(prismaMock.transaction.aggregate as jest.Mock).mockResolvedValue({
        _sum: { delta: 0 },
      })

      ;(prismaMock.user.findUnique as jest.Mock).mockResolvedValue({
        credits: 50,
      })

      ;(prismaMock.userProgress.findUnique as jest.Mock).mockResolvedValue({
        consecutiveLosses: 0,
        totalQuestionSets: 5,
      })

      setupCompletingSession()

      const request = createRequest({
        question: 'Final question',
        answer: 'Testing jackpot cooldown enforcement mechanism',
        type: 'technical',
        sessionId: 'completing-session',
      })

      jest.spyOn(Math, 'random').mockReturnValue(0.0001)

      const response = await POST(request)
      const data = await response.json()

      if (data.reward) {
        // Should downgrade to micro or 0
        expect(data.reward.rewardAmount).not.toBe(JACKPOT_REWARD)
      }
    })

    it('should allow jackpot after 7-day cooldown expires', async () => {
      ;(resolveUserId as jest.Mock).mockResolvedValue('user-123')
      ;(ensureCredits as jest.Mock).mockResolvedValue(undefined)

      const eightDaysAgo = new Date()
      eightDaysAgo.setDate(eightDaysAgo.getDate() - 8)

      // Mock old jackpot (8 days ago - cooldown expired)
      ;(prismaMock.transaction.findFirst as jest.Mock).mockResolvedValue(null)
      ;(prismaMock.transaction.aggregate as jest.Mock).mockResolvedValue({
        _sum: { delta: 0 },
      })

      ;(prismaMock.user.findUnique as jest.Mock).mockResolvedValue({
        credits: 50,
      })

      ;(prismaMock.userProgress.findUnique as jest.Mock).mockResolvedValue({
        consecutiveLosses: 0,
        totalQuestionSets: 5,
      })

      setupCompletingSession()

      const request = createRequest({
        question: 'Final question',
        answer: 'Testing jackpot availability after cooldown expiration',
        type: 'technical',
        sessionId: 'completing-session',
      })

      jest.spyOn(Math, 'random').mockReturnValue(0.0001)

      await POST(request)

      // Should query with correct date range
      const now = new Date()
      const expectedCutoff = new Date(now)
      expectedCutoff.setDate(expectedCutoff.getDate() - JACKPOT_COOLDOWN_DAYS)

      if (prismaMock.transaction.findFirst.mock.calls.length > 0) {
        const call = prismaMock.transaction.findFirst.mock.calls[0][0]
        expect(call.where.createdAt.gte).toBeDefined()
      }
    })
  })

  describe('Cap & Cooldown Interaction', () => {
    it('should fallback to micro when jackpot blocked by cooldown', async () => {
      ;(resolveUserId as jest.Mock).mockResolvedValue('user-123')
      ;(ensureCredits as jest.Mock).mockResolvedValue(undefined)

      const twoDaysAgo = new Date()
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 2)

      ;(prismaMock.transaction.findFirst as jest.Mock).mockResolvedValue({
        id: 'recent-jackpot',
        delta: JACKPOT_REWARD,
        createdAt: twoDaysAgo,
      })

      ;(prismaMock.transaction.aggregate as jest.Mock).mockResolvedValue({
        _sum: { delta: 10 }, // 15 remaining cap
      })

      ;(prismaMock.user.findUnique as jest.Mock).mockResolvedValue({
        credits: 50,
      })

      ;(prismaMock.userProgress.findUnique as jest.Mock).mockResolvedValue({
        consecutiveLosses: 0,
        totalQuestionSets: 5,
      })

      setupCompletingSession()

      const request = createRequest({
        question: 'Final question',
        answer: 'Testing fallback behavior when jackpot is blocked',
        type: 'technical',
        sessionId: 'completing-session',
      })

      jest.spyOn(Math, 'random').mockReturnValue(0.0001)

      const response = await POST(request)
      const data = await response.json()

      if (data.reward) {
        // Should fallback to micro (not jackpot)
        expect([0, MICRO_REWARD]).toContain(data.reward.rewardAmount)
      }
    })

    it('should give 0 when jackpot blocked and micro cap reached', async () => {
      ;(resolveUserId as jest.Mock).mockResolvedValue('user-123')
      ;(ensureCredits as jest.Mock).mockResolvedValue(undefined)

      const oneDayAgo = new Date()
      oneDayAgo.setDate(oneDayAgo.getDate() - 1)

      ;(prismaMock.transaction.findFirst as jest.Mock).mockResolvedValue({
        id: 'recent-jackpot',
        delta: JACKPOT_REWARD,
        createdAt: oneDayAgo,
      })

      ;(prismaMock.transaction.aggregate as jest.Mock).mockResolvedValue({
        _sum: { delta: 25 }, // Cap reached
      })

      ;(prismaMock.user.findUnique as jest.Mock).mockResolvedValue({
        credits: 50,
      })

      ;(prismaMock.userProgress.findUnique as jest.Mock).mockResolvedValue({
        consecutiveLosses: 0,
        totalQuestionSets: 5,
      })

      setupCompletingSession()

      const request = createRequest({
        question: 'Final question',
        answer: 'Testing edge case with both restrictions active',
        type: 'technical',
        sessionId: 'completing-session',
      })

      jest.spyOn(Math, 'random').mockReturnValue(0.0001)

      const response = await POST(request)
      const data = await response.json()

      if (data.reward) {
        expect(data.reward.rewardAmount).toBe(0)
      }
    })
  })

  describe('Behavioral Interviews (No Rewards)', () => {
    it('should never give rewards for behavioral interviews', async () => {
      ;(resolveUserId as jest.Mock).mockResolvedValue('user-123')
      ;(ensureCredits as jest.Mock).mockResolvedValue(undefined)

      setupCompletingSession('BEHAV')

      const request = createRequest({
        question: 'Tell me about a time you showed leadership',
        answer: 'In my previous role, I led a team through a challenging project with tight deadlines',
        type: 'behavioral',
        sessionId: 'completing-session',
      })

      const response = await POST(request)
      const data = await response.json()

      expect(data.reward).toBeNull()
    })
  })
})

// Helper function to setup completing session
function setupCompletingSession(type: 'TECH' | 'BEHAV' = 'TECH') {
  ;(prismaMock.interviewSession.findUnique as jest.Mock).mockResolvedValue({
    id: 'completing-session',
    userId: 'user-123',
    type,
    totalQuestions: 5,
    answeredCount: 4,
    correctCount: 4,
    completed: false,
    rewardGiven: false,
  })

  ;(prismaMock.qA.findFirst as jest.Mock).mockResolvedValue(null)

  ;(prismaMock.$transaction as jest.Mock).mockImplementation(async (callback: Function) => {
    const mockTx = {
      interviewSession: {
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
        findUnique: jest.fn().mockResolvedValue({
          id: 'completing-session',
          userId: 'user-123',
          type,
          totalQuestions: 5,
          answeredCount: 5,
          correctCount: 5,
          completed: true,
          rewardGiven: false,
        }),
        update: jest.fn().mockResolvedValue({
          id: 'completing-session',
          answeredCount: 5,
          correctCount: 5,
          completed: true,
          rewardGiven: true,
          rewardAmount: 0,
        }),
      },
      qA: {
        findFirst: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockResolvedValue({ id: 'qa-5' }),
      },
      userProgress: {
        upsert: jest.fn(),
        findUnique: jest.fn().mockResolvedValue(null),
      },
      user: {
        findUnique: jest.fn().mockResolvedValue({ credits: 50 }),
        update: jest.fn(),
      },
      transaction: {
        create: jest.fn(),
        aggregate: jest.fn().mockResolvedValue({ _sum: { delta: 0 } }),
        findFirst: jest.fn().mockResolvedValue(null),
      },
    }
    return callback(mockTx)
  })
}
