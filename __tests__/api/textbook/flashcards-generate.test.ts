/**
 * Tests for the Textbook Flashcards Generation API route
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

const mockGenerateFlashcards = jest.fn().mockResolvedValue({
  flashcards: [
    { front: 'What is X?', back: 'X is...', category: 'Basics', keyTerms: ['X'], mnemonic: null, difficulty: 'basic' },
    { front: 'What is Y?', back: 'Y is...', category: 'Advanced', keyTerms: ['Y'], mnemonic: 'Remember Y', difficulty: 'intermediate' },
  ],
})

jest.mock('@/lib/textbook/analyzer', () => ({
  createAnalyzer: jest.fn(() => ({
    generateFlashcardsFromChunk: mockGenerateFlashcards,
  })),
  splitIntoChunks: jest.fn((content: string) => [content.substring(0, 2000)]),
}))

import { NextRequest } from 'next/server'

describe('POST /api/textbook/flashcards (generate)', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should return 400 when textbookId is missing', async () => {
    const { POST } = await import('@/app/api/textbook/flashcards/route')
    const request = new NextRequest('http://localhost/api/textbook/flashcards', {
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

    const { POST } = await import('@/app/api/textbook/flashcards/route')
    const request = new NextRequest('http://localhost/api/textbook/flashcards', {
      method: 'POST',
      body: JSON.stringify({ textbookId: 'nonexistent' }),
    })
    const response = await POST(request)
    expect(response.status).toBe(404)
  })

  it('should generate flashcards successfully', async () => {
    prismaMock.textbook.findFirst.mockResolvedValue({
      id: 'tb-1', userId: 'user-123', title: 'Algorithms',
      content: 'Some content about algorithms and data structures...',
      chapters: [], filename: 'algo.pdf', fileSize: 5000, fileType: 'PDF',
      pageCount: 50, createdAt: new Date(), updatedAt: new Date(),
    } as any)

    prismaMock.flashcard.create.mockResolvedValue({
      id: 'fc-1', front: 'What is X?', back: 'X is...',
    } as any)

    prismaMock.textbook.update.mockResolvedValue({} as any)

    const { POST } = await import('@/app/api/textbook/flashcards/route')
    const request = new NextRequest('http://localhost/api/textbook/flashcards', {
      method: 'POST',
      body: JSON.stringify({ textbookId: 'tb-1' }),
    })
    const response = await POST(request)
    expect(response.status).toBe(200)
    const data = await response.json()
    expect(data.flashcards).toBeDefined()
    expect(data.count).toBeGreaterThanOrEqual(0)
  })

  it('should return 500 when analyzer is not configured', async () => {
    const { createAnalyzer } = require('@/lib/textbook/analyzer')
    ;(createAnalyzer as jest.Mock).mockReturnValueOnce(null)

    prismaMock.textbook.findFirst.mockResolvedValue({
      id: 'tb-1', userId: 'user-123', title: 'Test', content: 'Content',
      chapters: [], filename: 'f.pdf', fileSize: 100, fileType: 'PDF',
      pageCount: 1, createdAt: new Date(), updatedAt: new Date(),
    } as any)

    const { POST } = await import('@/app/api/textbook/flashcards/route')
    const request = new NextRequest('http://localhost/api/textbook/flashcards', {
      method: 'POST',
      body: JSON.stringify({ textbookId: 'tb-1' }),
    })
    const response = await POST(request)
    expect(response.status).toBe(500)
    const data = await response.json()
    expect(data.error).toContain('not configured')
  })

  it('should handle chunk processing failure gracefully', async () => {
    mockGenerateFlashcards.mockRejectedValueOnce(new Error('Chunk failed'))

    prismaMock.textbook.findFirst.mockResolvedValue({
      id: 'tb-1', userId: 'user-123', title: 'Test', content: 'Content',
      chapters: [], filename: 'f.pdf', fileSize: 100, fileType: 'PDF',
      pageCount: 1, createdAt: new Date(), updatedAt: new Date(),
    } as any)
    prismaMock.textbook.update.mockResolvedValue({} as any)

    const { POST } = await import('@/app/api/textbook/flashcards/route')
    const request = new NextRequest('http://localhost/api/textbook/flashcards', {
      method: 'POST',
      body: JSON.stringify({ textbookId: 'tb-1' }),
    })
    // Should not throw - chunk failures are caught internally
    const response = await POST(request)
    expect(response.status).toBe(200)
  })
})
