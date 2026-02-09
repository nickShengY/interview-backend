/**
 * Tests for the Textbook Feynman Evaluation API route
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

const mockEvaluateFeynman = jest.fn().mockResolvedValue({
  score: 8,
  feedback: 'Good explanation',
  gaps: [],
  suggestions: ['Try adding more examples'],
})

jest.mock('@/lib/textbook/analyzer', () => ({
  createAnalyzer: jest.fn(() => ({
    evaluateFeynmanExplanation: mockEvaluateFeynman,
  })),
}))

import { NextRequest } from 'next/server'

describe('POST /api/textbook/feynman', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should return 400 when required fields are missing', async () => {
    const { POST } = await import('@/app/api/textbook/feynman/route')
    const request = new NextRequest('http://localhost/api/textbook/feynman', {
      method: 'POST',
      body: JSON.stringify({ textbookId: 'tb-1' }),
    })
    const response = await POST(request)
    expect(response.status).toBe(400)
    const data = await response.json()
    expect(data.error).toContain('Missing required fields')
  })

  it('should return 404 when textbook not found', async () => {
    prismaMock.textbook.findFirst.mockResolvedValue(null)

    const { POST } = await import('@/app/api/textbook/feynman/route')
    const request = new NextRequest('http://localhost/api/textbook/feynman', {
      method: 'POST',
      body: JSON.stringify({ textbookId: 'nonexistent', concept: 'X', explanation: 'Y' }),
    })
    const response = await POST(request)
    expect(response.status).toBe(404)
  })

  it('should evaluate explanation successfully', async () => {
    prismaMock.textbook.findFirst.mockResolvedValue({
      id: 'tb-1', userId: 'user-123', title: 'Test', content: 'Content',
      filename: 'f.pdf', fileSize: 100, fileType: 'PDF', pageCount: 1,
      createdAt: new Date(), updatedAt: new Date(),
    } as any)
    prismaMock.textbook.update.mockResolvedValue({} as any)

    const { POST } = await import('@/app/api/textbook/feynman/route')
    const request = new NextRequest('http://localhost/api/textbook/feynman', {
      method: 'POST',
      body: JSON.stringify({ textbookId: 'tb-1', concept: 'Recursion', explanation: 'A function that calls itself' }),
    })
    const response = await POST(request)
    expect(response.status).toBe(200)
    const data = await response.json()
    expect(data.evaluation).toBeDefined()
    expect(data.concept).toBe('Recursion')
  })

  it('should return 500 when evaluation fails', async () => {
    prismaMock.textbook.findFirst.mockResolvedValue({
      id: 'tb-1', userId: 'user-123', title: 'Test', content: 'Content',
      filename: 'f.pdf', fileSize: 100, fileType: 'PDF', pageCount: 1,
      createdAt: new Date(), updatedAt: new Date(),
    } as any)
    mockEvaluateFeynman.mockRejectedValueOnce(new Error('AI error'))

    const { POST } = await import('@/app/api/textbook/feynman/route')
    const request = new NextRequest('http://localhost/api/textbook/feynman', {
      method: 'POST',
      body: JSON.stringify({ textbookId: 'tb-1', concept: 'X', explanation: 'Y' }),
    })
    const response = await POST(request)
    expect(response.status).toBe(500)
    const data = await response.json()
    expect(data.error).toBe('AI error')
  })

  it('should return 400 when concept is empty', async () => {
    const { POST } = await import('@/app/api/textbook/feynman/route')
    const request = new NextRequest('http://localhost/api/textbook/feynman', {
      method: 'POST',
      body: JSON.stringify({ textbookId: 'tb-1', concept: '', explanation: 'Y' }),
    })
    const response = await POST(request)
    expect(response.status).toBe(400)
  })

  it('should update textbook lastStudied timestamp', async () => {
    prismaMock.textbook.findFirst.mockResolvedValue({
      id: 'tb-1', userId: 'user-123', title: 'Test', content: 'Content',
      filename: 'f.pdf', fileSize: 100, fileType: 'PDF', pageCount: 1,
      createdAt: new Date(), updatedAt: new Date(),
    } as any)
    prismaMock.textbook.update.mockResolvedValue({} as any)

    const { POST } = await import('@/app/api/textbook/feynman/route')
    const request = new NextRequest('http://localhost/api/textbook/feynman', {
      method: 'POST',
      body: JSON.stringify({ textbookId: 'tb-1', concept: 'Loops', explanation: 'Repeating code' }),
    })
    await POST(request)
    expect(prismaMock.textbook.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'tb-1' } })
    )
  })
})
