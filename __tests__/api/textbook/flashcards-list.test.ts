/**
 * Unit tests for flashcards list API route
 */

import { prismaMock } from '../../setup/prisma-mock'

jest.mock('@/lib/prisma', () => ({
  prisma: prismaMock,
}))

jest.mock('@/lib/firebase/auth-utils', () => ({
  resolveUserId: jest.fn(),
}))

import { GET } from '@/app/api/textbook/flashcards/list/route'
import { resolveUserId } from '@/lib/firebase/auth-utils'
import { NextRequest } from 'next/server'

describe('GET /api/textbook/flashcards/list', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('returns flashcards for the user', async () => {
    ;(resolveUserId as jest.Mock).mockResolvedValue('user-123')
    prismaMock.flashcard.findMany.mockResolvedValue([
      {
        id: 'flash-1',
        textbookId: 'textbook-1',
        front: 'Q1',
        back: 'A1',
        chunkId: 'chunk-1',
        category: 'Basics',
        keyTerms: ['term1'],
        mnemonics: ['memory'],
        difficulty: 2,
        nextReview: new Date('2024-02-01'),
        interval: 6,
        easeFactor: 2.5,
        repetitions: 2,
        createdAt: new Date('2024-01-01'),
      },
    ])

    const request = new NextRequest('http://localhost/api/textbook/flashcards/list?limit=5')
    const response = await GET(request)

    expect(response.status).toBe(200)
    const data = await response.json()
    expect(data.flashcards).toHaveLength(1)
    expect(prismaMock.flashcard.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: 'user-123' },
        take: 5,
      })
    )
  })

  it('filters by textbook when provided', async () => {
    ;(resolveUserId as jest.Mock).mockResolvedValue('user-123')
    prismaMock.flashcard.findMany.mockResolvedValue([])

    const request = new NextRequest('http://localhost/api/textbook/flashcards/list?textbookId=textbook-9')
    const response = await GET(request)

    expect(response.status).toBe(200)
    expect(prismaMock.flashcard.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: 'user-123', textbookId: 'textbook-9' },
      })
    )
  })

  it('clamps invalid limits to the default', async () => {
    ;(resolveUserId as jest.Mock).mockResolvedValue('user-123')
    prismaMock.flashcard.findMany.mockResolvedValue([])

    const request = new NextRequest('http://localhost/api/textbook/flashcards/list?limit=abc')
    await GET(request)

    expect(prismaMock.flashcard.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        take: 100,
      })
    )
  })

  it('handles errors gracefully', async () => {
    ;(resolveUserId as jest.Mock).mockResolvedValue('user-123')
    prismaMock.flashcard.findMany.mockRejectedValue(new Error('DB error'))

    const request = new NextRequest('http://localhost/api/textbook/flashcards/list')
    const response = await GET(request)

    expect(response.status).toBe(500)
    const data = await response.json()
    expect(data.error).toMatch(/db error/i)
  })
})
