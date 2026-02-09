/**
 * Tests for the Textbook Quiz Generation API route
 */

import { prismaMock } from '../../setup/prisma-mock'

jest.mock('@/lib/prisma', () => ({ prisma: prismaMock }))
jest.mock('@/lib/firebase/auth-utils', () => ({
  resolveUserId: jest.fn().mockResolvedValue('user-123'),
}))
jest.mock('@/lib/credits', () => ({
  ensureCredits: jest.fn().mockResolvedValue(undefined),
  refundCredits: jest.fn().mockResolvedValue(undefined),
}))

const mockGenerateStructuredOutput = jest.fn().mockResolvedValue({
  title: 'Chapter 1 Quiz',
  questions: [
    { question: 'What is X?', options: ['A', 'B', 'C', 'D'], correctAnswer: 'A', explanation: 'Because...' },
    { question: 'What is Y?', options: ['A', 'B', 'C', 'D'], correctAnswer: 'B', explanation: 'Since...' },
  ],
})

jest.mock('@/lib/llm/openrouter', () => ({
  generateStructuredOutput: (...args: unknown[]) => mockGenerateStructuredOutput(...args),
}))

import { NextRequest } from 'next/server'

describe('POST /api/textbook/quiz', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    process.env.OPENROUTER_API_KEY = 'test-key'
  })

  it('should return 400 when textbookId is missing', async () => {
    const { POST } = await import('@/app/api/textbook/quiz/route')

    const request = new NextRequest('http://localhost/api/textbook/quiz', {
      method: 'POST',
      body: JSON.stringify({}),
    })

    const response = await POST(request)
    expect(response.status).toBe(400)
    const data = await response.json()
    expect(data.error).toContain('Textbook ID required')
  })

  it('should return 404 when textbook not found', async () => {
    prismaMock.textbook.findFirst.mockResolvedValue(null)

    const { POST } = await import('@/app/api/textbook/quiz/route')

    const request = new NextRequest('http://localhost/api/textbook/quiz', {
      method: 'POST',
      body: JSON.stringify({ textbookId: 'nonexistent' }),
    })

    const response = await POST(request)
    expect(response.status).toBe(404)
    const data = await response.json()
    expect(data.error).toContain('not found')
  })

  it('should generate quiz successfully', async () => {
    prismaMock.textbook.findFirst.mockResolvedValue({
      id: 'tb-1',
      userId: 'user-123',
      title: 'Test Textbook',
      content: 'Some textbook content about programming...',
      filename: 'test.pdf',
      fileSize: 1000,
      fileType: 'PDF',
      pageCount: 10,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any)

    prismaMock.quiz.create.mockResolvedValue({
      id: 'quiz-1',
      userId: 'user-123',
      textbookId: 'tb-1',
      title: 'Chapter 1 Quiz',
      totalQuestions: 2,
      createdAt: new Date(),
    } as any)

    prismaMock.quizQuestion.create.mockResolvedValue({} as any)

    prismaMock.quiz.findUnique.mockResolvedValue({
      id: 'quiz-1',
      title: 'Chapter 1 Quiz',
      totalQuestions: 2,
      questions: [
        { question: 'What is X?', options: ['A', 'B', 'C', 'D'], correctAnswer: 'A', explanation: 'Because...' },
        { question: 'What is Y?', options: ['A', 'B', 'C', 'D'], correctAnswer: 'B', explanation: 'Since...' },
      ],
    } as any)

    const { POST } = await import('@/app/api/textbook/quiz/route')

    const request = new NextRequest('http://localhost/api/textbook/quiz', {
      method: 'POST',
      body: JSON.stringify({ textbookId: 'tb-1' }),
    })

    const response = await POST(request)
    expect(response.status).toBe(200)
    const data = await response.json()
    expect(data.quiz).toBeDefined()
    expect(data.quiz.title).toBe('Chapter 1 Quiz')
  })

  it('should return 500 when AI service is not configured', async () => {
    delete process.env.OPENROUTER_API_KEY

    prismaMock.textbook.findFirst.mockResolvedValue({
      id: 'tb-1',
      userId: 'user-123',
      title: 'Test',
      content: 'Content',
      filename: 'test.pdf',
      fileSize: 100,
      fileType: 'PDF',
      pageCount: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any)

    const { POST } = await import('@/app/api/textbook/quiz/route')

    const request = new NextRequest('http://localhost/api/textbook/quiz', {
      method: 'POST',
      body: JSON.stringify({ textbookId: 'tb-1' }),
    })

    const response = await POST(request)
    expect(response.status).toBe(500)
    const data = await response.json()
    expect(data.error).toContain('not configured')
  })

  it('should return 500 when AI generation fails', async () => {
    mockGenerateStructuredOutput.mockRejectedValueOnce(new Error('AI timeout'))

    prismaMock.textbook.findFirst.mockResolvedValue({
      id: 'tb-1',
      userId: 'user-123',
      title: 'Test',
      content: 'Content',
      filename: 'test.pdf',
      fileSize: 100,
      fileType: 'PDF',
      pageCount: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any)

    const { POST } = await import('@/app/api/textbook/quiz/route')

    const request = new NextRequest('http://localhost/api/textbook/quiz', {
      method: 'POST',
      body: JSON.stringify({ textbookId: 'tb-1' }),
    })

    const response = await POST(request)
    expect(response.status).toBe(500)
    const data = await response.json()
    expect(data.error).toBe('AI timeout')
  })
})
