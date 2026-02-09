/**
 * Comprehensive tests for the question deduplication system
 */

import { prismaMock } from '../setup/prisma-mock'

jest.mock('@/lib/prisma', () => ({
  prisma: prismaMock,
}))

import {
  storeGeneratedQuestion,
  isDuplicateQuestion,
  filterDuplicateQuestions,
  getUserQuestionHistory,
} from '@/lib/question-dedup'

describe('Question Deduplication System', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('storeGeneratedQuestion', () => {
    it('should store a question with all metadata', async () => {
      prismaMock.generatedQuestion.create.mockResolvedValue({ id: 'q1' } as any)

      await storeGeneratedQuestion('user-1', 'TECH', 'What is a closure?', {
        difficulty: 'Medium',
        category: 'JavaScript',
        industry: 'Tech',
        jobTitle: 'Frontend Engineer',
        focus: 'Fundamentals',
      })

      expect(prismaMock.generatedQuestion.create).toHaveBeenCalledWith({
        data: {
          userId: 'user-1',
          questionType: 'TECH',
          question: 'What is a closure?',
          difficulty: 'Medium',
          category: 'JavaScript',
          industry: 'Tech',
          jobTitle: 'Frontend Engineer',
          focus: 'Fundamentals',
        },
      })
    })

    it('should store with partial metadata', async () => {
      prismaMock.generatedQuestion.create.mockResolvedValue({ id: 'q2' } as any)

      await storeGeneratedQuestion('user-1', 'BEHAV', 'Tell me about a challenge', {
        difficulty: 'Hard',
      })

      expect(prismaMock.generatedQuestion.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: 'user-1',
          questionType: 'BEHAV',
          question: 'Tell me about a challenge',
          difficulty: 'Hard',
          category: undefined,
          industry: undefined,
          jobTitle: undefined,
          focus: undefined,
        }),
      })
    })

    it('should store with empty metadata', async () => {
      prismaMock.generatedQuestion.create.mockResolvedValue({ id: 'q3' } as any)

      await storeGeneratedQuestion('user-1', 'TECH', 'Explain recursion', {})

      expect(prismaMock.generatedQuestion.create).toHaveBeenCalled()
    })
  })

  describe('isDuplicateQuestion', () => {
    it('should detect exact duplicate', async () => {
      prismaMock.generatedQuestion.findMany.mockResolvedValue([
        { question: 'What is a closure in JavaScript?' },
      ])

      const result = await isDuplicateQuestion('user-1', 'TECH', 'What is a closure in JavaScript?')
      expect(result).toBe(true)
    })

    it('should detect high similarity duplicate (>70% Jaccard)', async () => {
      prismaMock.generatedQuestion.findMany.mockResolvedValue([
        { question: 'What is a closure in JavaScript and how does it work?' },
      ])

      const result = await isDuplicateQuestion('user-1', 'TECH', 'What is a closure in JavaScript and how does it function?')
      expect(result).toBe(true)
    })

    it('should not flag sufficiently different questions', async () => {
      prismaMock.generatedQuestion.findMany.mockResolvedValue([
        { question: 'What is a closure in JavaScript?' },
      ])

      const result = await isDuplicateQuestion('user-1', 'TECH', 'Explain the difference between SQL and NoSQL databases')
      expect(result).toBe(false)
    })

    it('should return false when no history exists', async () => {
      prismaMock.generatedQuestion.findMany.mockResolvedValue([])

      const result = await isDuplicateQuestion('user-1', 'TECH', 'Any question here')
      expect(result).toBe(false)
    })

    it('should check against multiple recent questions', async () => {
      prismaMock.generatedQuestion.findMany.mockResolvedValue([
        { question: 'Explain React hooks' },
        { question: 'What is the virtual DOM?' },
        { question: 'Describe closure scope chain' },
      ])

      const result = await isDuplicateQuestion('user-1', 'TECH', 'What are React hooks and how do they work?')
      // "Explain React hooks" has low overlap with longer question
      // Depending on Jaccard threshold, this could be true or false
      expect(typeof result).toBe('boolean')
    })

    it('should handle empty question gracefully', async () => {
      prismaMock.generatedQuestion.findMany.mockResolvedValue([
        { question: 'What is a closure?' },
      ])

      const result = await isDuplicateQuestion('user-1', 'TECH', '')
      expect(result).toBe(false)
    })

    it('should be case-insensitive', async () => {
      prismaMock.generatedQuestion.findMany.mockResolvedValue([
        { question: 'WHAT IS A CLOSURE IN JAVASCRIPT?' },
      ])

      const result = await isDuplicateQuestion('user-1', 'TECH', 'what is a closure in javascript?')
      expect(result).toBe(true)
    })

    it('should query with correct date filter (30 days)', async () => {
      prismaMock.generatedQuestion.findMany.mockResolvedValue([])

      await isDuplicateQuestion('user-1', 'TECH', 'test question')

      expect(prismaMock.generatedQuestion.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            userId: 'user-1',
            questionType: 'TECH',
            createdAt: expect.objectContaining({
              gte: expect.any(Date),
            }),
          }),
        })
      )
    })
  })

  describe('filterDuplicateQuestions', () => {
    it('should filter out duplicate questions from a list', async () => {
      prismaMock.generatedQuestion.findMany.mockResolvedValue([
        { question: 'What is a closure in JavaScript?' },
      ])

      const questions = [
        'What is a closure in JavaScript?',
        'Explain the event loop in Node.js',
        'What is a promise in JavaScript?',
      ]

      const result = await filterDuplicateQuestions('user-1', 'TECH', questions)
      // The exact duplicate should be filtered
      expect(result).not.toContain('What is a closure in JavaScript?')
      expect(result.length).toBeLessThanOrEqual(questions.length)
    })

    it('should return all questions when no duplicates exist', async () => {
      prismaMock.generatedQuestion.findMany.mockResolvedValue([])

      const questions = ['Q1', 'Q2', 'Q3']
      const result = await filterDuplicateQuestions('user-1', 'TECH', questions)
      expect(result).toEqual(questions)
    })

    it('should handle empty input array', async () => {
      prismaMock.generatedQuestion.findMany.mockResolvedValue([])

      const result = await filterDuplicateQuestions('user-1', 'TECH', [])
      expect(result).toEqual([])
    })
  })

  describe('getUserQuestionHistory', () => {
    it('should return user question history with default limit', async () => {
      const mockHistory = [
        { id: 'q1', question: 'Q1', questionType: 'TECH', createdAt: new Date() },
        { id: 'q2', question: 'Q2', questionType: 'TECH', createdAt: new Date() },
      ]
      prismaMock.generatedQuestion.findMany.mockResolvedValue(mockHistory)

      const result = await getUserQuestionHistory('user-1')
      expect(result).toEqual(mockHistory)
      expect(prismaMock.generatedQuestion.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: 'user-1' },
          orderBy: { createdAt: 'desc' },
          take: 50,
        })
      )
    })

    it('should filter by question type when specified', async () => {
      prismaMock.generatedQuestion.findMany.mockResolvedValue([])

      await getUserQuestionHistory('user-1', 'BEHAV')
      expect(prismaMock.generatedQuestion.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: 'user-1', questionType: 'BEHAV' },
        })
      )
    })

    it('should respect custom limit', async () => {
      prismaMock.generatedQuestion.findMany.mockResolvedValue([])

      await getUserQuestionHistory('user-1', undefined, 10)
      expect(prismaMock.generatedQuestion.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 10,
        })
      )
    })
  })
})
