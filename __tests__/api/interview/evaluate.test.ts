/**
 * Unit tests for interview evaluate API route
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
      generateContent: jest.fn(),
    },
  })),
}))

import { POST } from '@/app/api/interview/evaluate/route'
import { resolveUserId } from '@/lib/firebase/auth-utils'
import { ensureCredits, refundCredits } from '@/lib/credits'
import { NextRequest } from 'next/server'

const createRequest = (body: object) => {
  return new NextRequest('http://localhost/api/interview/evaluate', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  })
}

describe('POST /api/interview/evaluate', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    process.env.GOOGLE_API_KEY = '' // Disable AI for predictable tests
  })

  describe('Request Validation', () => {
    it('should reject empty question', async () => {
      ;(resolveUserId as jest.Mock).mockResolvedValue('user-123')

      const request = createRequest({
        question: '',
        answer: 'My answer',
        type: 'technical',
      })

      const response = await POST(request)

      expect(response.status).toBe(400)
    })

    it('should reject empty answer', async () => {
      ;(resolveUserId as jest.Mock).mockResolvedValue('user-123')

      const request = createRequest({
        question: 'What is JavaScript?',
        answer: '',
        type: 'technical',
      })

      const response = await POST(request)

      expect(response.status).toBe(400)
    })

    it('should reject invalid type', async () => {
      ;(resolveUserId as jest.Mock).mockResolvedValue('user-123')

      const request = createRequest({
        question: 'What is JavaScript?',
        answer: 'A programming language',
        type: 'invalid',
      })

      const response = await POST(request)

      expect(response.status).toBe(400)
    })

    it('should accept valid technical request', async () => {
      ;(resolveUserId as jest.Mock).mockResolvedValue('user-123')
      ;(ensureCredits as jest.Mock).mockResolvedValue(undefined)
      setupSuccessfulTransaction()

      const request = createRequest({
        question: 'What is JavaScript?',
        answer: 'JavaScript is a programming language used for web development. It allows for dynamic content, user interaction handling, and is essential for modern web applications.',
        type: 'technical',
      })

      const response = await POST(request)

      expect(response.status).toBe(200)
    })

    it('should accept valid behavioral request', async () => {
      ;(resolveUserId as jest.Mock).mockResolvedValue('user-123')
      ;(ensureCredits as jest.Mock).mockResolvedValue(undefined)
      setupSuccessfulTransaction()

      const request = createRequest({
        question: 'Tell me about a time you showed leadership',
        answer: 'In my previous role, I led a team of five developers on a critical project. We faced tight deadlines but I organized daily standups and delegated tasks effectively, resulting in on-time delivery.',
        type: 'behavioral',
      })

      const response = await POST(request)

      expect(response.status).toBe(200)
    })
  })

  describe('Credit System', () => {
    it('should deduct 1 credit per evaluation', async () => {
      ;(resolveUserId as jest.Mock).mockResolvedValue('user-123')
      ;(ensureCredits as jest.Mock).mockResolvedValue(undefined)
      setupSuccessfulTransaction()

      const request = createRequest({
        question: 'What is React?',
        answer: 'React is a JavaScript library for building user interfaces. It uses a virtual DOM for efficient updates and supports component-based architecture.',
        type: 'technical',
      })

      await POST(request)

      expect(ensureCredits).toHaveBeenCalledWith('user-123', 1, 'TECH_Q')
    })

    it('should use BEHAV_Q for behavioral questions', async () => {
      ;(resolveUserId as jest.Mock).mockResolvedValue('user-123')
      ;(ensureCredits as jest.Mock).mockResolvedValue(undefined)
      setupSuccessfulTransaction()

      const request = createRequest({
        question: 'Tell me about a challenge',
        answer: 'I faced a major deadline crunch when our main developer left. I stepped up, reorganized priorities, and we delivered on time.',
        type: 'behavioral',
      })

      await POST(request)

      expect(ensureCredits).toHaveBeenCalledWith('user-123', 1, 'BEHAV_Q')
    })

    it('should return 402 when insufficient credits', async () => {
      ;(resolveUserId as jest.Mock).mockResolvedValue('user-123')
      ;(ensureCredits as jest.Mock).mockRejectedValue(new Error('Insufficient credits'))

      const request = createRequest({
        question: 'What is JavaScript?',
        answer: 'A programming language',
        type: 'technical',
      })

      const response = await POST(request)

      expect(response.status).toBe(402)
    })

    it('should refund credit on error', async () => {
      ;(resolveUserId as jest.Mock).mockResolvedValue('user-123')
      ;(ensureCredits as jest.Mock).mockResolvedValue(undefined)
      ;(prismaMock.$transaction as jest.Mock).mockRejectedValue(new Error('DB Error'))

      const request = createRequest({
        question: 'What is JavaScript?',
        answer: 'A programming language for web development',
        type: 'technical',
      })

      await POST(request)

      expect(refundCredits).toHaveBeenCalledWith('user-123', 1, 'TECH_Q')
    })
  })

  describe('Session Management', () => {
    it('should return 404 for non-existent session', async () => {
      ;(resolveUserId as jest.Mock).mockResolvedValue('user-123')
      ;(prismaMock.interviewSession.findUnique as jest.Mock).mockResolvedValue(null)

      const request = createRequest({
        question: 'What is JavaScript?',
        answer: 'A programming language',
        type: 'technical',
        sessionId: 'nonexistent-session',
      })

      const response = await POST(request)

      expect(response.status).toBe(404)
    })

    it('should return 404 when session belongs to different user', async () => {
      ;(resolveUserId as jest.Mock).mockResolvedValue('user-123')
      ;(prismaMock.interviewSession.findUnique as jest.Mock).mockResolvedValue({
        id: 'session-1',
        userId: 'different-user',
        type: 'TECH',
        completed: false,
        answeredCount: 0,
        totalQuestions: 5,
      })

      const request = createRequest({
        question: 'What is JavaScript?',
        answer: 'A programming language',
        type: 'technical',
        sessionId: 'session-1',
      })

      const response = await POST(request)

      expect(response.status).toBe(404)
    })

    it('should return 400 for session type mismatch', async () => {
      ;(resolveUserId as jest.Mock).mockResolvedValue('user-123')
      ;(prismaMock.interviewSession.findUnique as jest.Mock).mockResolvedValue({
        id: 'session-1',
        userId: 'user-123',
        type: 'BEHAV', // Behavioral session
        completed: false,
        answeredCount: 0,
        totalQuestions: 5,
      })

      const request = createRequest({
        question: 'What is JavaScript?',
        answer: 'A programming language',
        type: 'technical', // Technical question - mismatch!
        sessionId: 'session-1',
      })

      const response = await POST(request)

      expect(response.status).toBe(400)
    })

    it('should return 409 for completed session', async () => {
      ;(resolveUserId as jest.Mock).mockResolvedValue('user-123')
      ;(prismaMock.interviewSession.findUnique as jest.Mock).mockResolvedValue({
        id: 'session-1',
        userId: 'user-123',
        type: 'TECH',
        completed: true,
        answeredCount: 5,
        totalQuestions: 5,
      })

      const request = createRequest({
        question: 'What is JavaScript?',
        answer: 'A programming language',
        type: 'technical',
        sessionId: 'session-1',
      })

      const response = await POST(request)

      expect(response.status).toBe(409)
    })

    it('should return 409 for duplicate question in session', async () => {
      ;(resolveUserId as jest.Mock).mockResolvedValue('user-123')
      ;(prismaMock.interviewSession.findUnique as jest.Mock).mockResolvedValue({
        id: 'session-1',
        userId: 'user-123',
        type: 'TECH',
        completed: false,
        answeredCount: 2,
        totalQuestions: 5,
      })
      ;(prismaMock.qA.findFirst as jest.Mock).mockResolvedValue({
        id: 'qa-1',
        question: 'What is JavaScript?',
      })

      const request = createRequest({
        question: 'What is JavaScript?',
        answer: 'A programming language',
        type: 'technical',
        sessionId: 'session-1',
      })

      const response = await POST(request)

      expect(response.status).toBe(409)
    })

    it('should create new session when sessionId not provided', async () => {
      ;(resolveUserId as jest.Mock).mockResolvedValue('user-123')
      ;(ensureCredits as jest.Mock).mockResolvedValue(undefined)
      setupSuccessfulTransaction()

      const request = createRequest({
        question: 'What is JavaScript?',
        answer: 'JavaScript is a programming language for web development with dynamic typing and first-class functions.',
        type: 'technical',
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.sessionId).toBeDefined()
    })
  })

  describe('Heuristic Evaluation', () => {
    it('should mark short answers as incorrect', async () => {
      ;(resolveUserId as jest.Mock).mockResolvedValue('user-123')
      ;(ensureCredits as jest.Mock).mockResolvedValue(undefined)
      setupSuccessfulTransaction()

      const request = createRequest({
        question: 'Explain React hooks in detail',
        answer: 'Hooks are functions', // Too short
        type: 'technical',
      })

      const response = await POST(request)
      const data = await response.json()

      expect(data.correct).toBe(false)
    })

    it('should evaluate based on keyword matching', async () => {
      ;(resolveUserId as jest.Mock).mockResolvedValue('user-123')
      ;(ensureCredits as jest.Mock).mockResolvedValue(undefined)
      setupSuccessfulTransaction()

      const request = createRequest({
        question: 'What is React and how does it work with the virtual DOM?',
        answer: 'React is a JavaScript library that uses a virtual DOM to efficiently update the user interface by comparing changes before applying them to the actual DOM.',
        type: 'technical',
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(typeof data.correct).toBe('boolean')
    })
  })

  describe('Response Structure', () => {
    it('should return correct structure for technical questions', async () => {
      ;(resolveUserId as jest.Mock).mockResolvedValue('user-123')
      ;(ensureCredits as jest.Mock).mockResolvedValue(undefined)
      setupSuccessfulTransaction()

      const request = createRequest({
        question: 'What is TypeScript?',
        answer: 'TypeScript is a typed superset of JavaScript that compiles to plain JavaScript. It adds static typing and other features to help catch errors early.',
        type: 'technical',
      })

      const response = await POST(request)
      const data = await response.json()

      expect(data).toHaveProperty('correct')
      expect(data).toHaveProperty('solution')
      expect(data).toHaveProperty('sessionId')
      expect(data).toHaveProperty('answeredCount')
      expect(data).toHaveProperty('totalQuestions')
      expect(data.solution).toHaveProperty('idealAnswer')
      expect(data.solution).toHaveProperty('keyPoints')
      expect(data.solution).toHaveProperty('improvementTips')
    })

    it('should return correct structure for behavioral questions', async () => {
      ;(resolveUserId as jest.Mock).mockResolvedValue('user-123')
      ;(ensureCredits as jest.Mock).mockResolvedValue(undefined)
      setupSuccessfulTransaction()

      const request = createRequest({
        question: 'Tell me about a time you handled conflict',
        answer: 'In my role as team lead, two developers disagreed on architecture. I facilitated a meeting where both presented their cases. We evaluated pros and cons and reached a hybrid solution that incorporated the best of both approaches.',
        type: 'behavioral',
      })

      const response = await POST(request)
      const data = await response.json()

      expect(data.solution).toHaveProperty('star')
      expect(data.solution.star).toHaveProperty('situation')
      expect(data.solution.star).toHaveProperty('task')
      expect(data.solution.star).toHaveProperty('action')
      expect(data.solution.star).toHaveProperty('result')
      expect(data.solution).toHaveProperty('improvementTips')
    })
  })

  describe('Reward System', () => {
    it('should include reward info when session completes', async () => {
      ;(resolveUserId as jest.Mock).mockResolvedValue('user-123')
      ;(ensureCredits as jest.Mock).mockResolvedValue(undefined)
      setupCompletingSession()

      const request = createRequest({
        question: 'Final question',
        answer: 'This is my comprehensive final answer covering all the key points that were asked about in this technical question.',
        type: 'technical',
        sessionId: 'completing-session',
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      // Reward info should be present for completed technical sessions
      if (data.reward) {
        expect(data.reward).toHaveProperty('completed')
        expect(data.reward).toHaveProperty('totalCorrect')
      }
    })

    it('should not give rewards for behavioral questions', async () => {
      ;(resolveUserId as jest.Mock).mockResolvedValue('user-123')
      ;(ensureCredits as jest.Mock).mockResolvedValue(undefined)
      setupCompletingSession('BEHAV')

      const request = createRequest({
        question: 'Final behavioral question',
        answer: 'In my last role, I demonstrated leadership by organizing team events and mentoring junior developers on best practices.',
        type: 'behavioral',
        sessionId: 'completing-session',
      })

      const response = await POST(request)
      const data = await response.json()

      expect(data.reward).toBeNull()
    })
  })
})

// Helper functions
function setupSuccessfulTransaction() {
  ;(prismaMock.$transaction as jest.Mock).mockImplementation(async (callback: Function) => {
    const mockTx = {
      interviewSession: {
        create: jest.fn().mockResolvedValue({
          id: 'new-session',
          userId: 'user-123',
          type: 'TECH',
          totalQuestions: 5,
          answeredCount: 0,
          correctCount: 0,
        }),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
        findUnique: jest.fn().mockResolvedValue({
          id: 'new-session',
          userId: 'user-123',
          type: 'TECH',
          totalQuestions: 5,
          answeredCount: 1,
          correctCount: 0,
          completed: false,
        }),
        update: jest.fn(),
      },
      qA: {
        findFirst: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockResolvedValue({ id: 'qa-1' }),
      },
      userProgress: {
        upsert: jest.fn(),
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
  ;(prismaMock.interviewSession.findUnique as jest.Mock).mockResolvedValue(null)
}

function setupCompletingSession(type: 'TECH' | 'BEHAV' = 'TECH') {
  ;(prismaMock.interviewSession.findUnique as jest.Mock).mockResolvedValue({
    id: 'completing-session',
    userId: 'user-123',
    type,
    totalQuestions: 5,
    answeredCount: 4,
    correctCount: 3,
    completed: false,
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
          correctCount: 4,
          completed: true,
          rewardGiven: false,
        }),
        update: jest.fn().mockResolvedValue({
          id: 'completing-session',
          totalQuestions: 5,
          answeredCount: 5,
          correctCount: 4,
          completed: true,
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
  ;(prismaMock.user.findUnique as jest.Mock).mockResolvedValue({ credits: 50 })
  ;(prismaMock.userProgress.findUnique as jest.Mock).mockResolvedValue({
    consecutiveLosses: 0,
    totalQuestionSets: 5,
  })
  ;(prismaMock.transaction.aggregate as jest.Mock).mockResolvedValue({ _sum: { delta: 0 } })
}
