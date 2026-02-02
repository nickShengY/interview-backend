/**
 * Unit tests for flashcard review API route
 */

import { prismaMock } from '../../setup/prisma-mock'

jest.mock('@/lib/prisma', () => ({
  prisma: prismaMock,
}))

jest.mock('@/lib/firebase/auth-utils', () => ({
  resolveUserId: jest.fn(),
}))

import { POST } from '@/app/api/textbook/flashcards/[id]/review/route'
import { resolveUserId } from '@/lib/firebase/auth-utils'
import { NextRequest } from 'next/server'

describe('POST /api/textbook/flashcards/[id]/review', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('returns 400 for invalid quality', async () => {
    ;(resolveUserId as jest.Mock).mockResolvedValue('user-123')

    const request = new NextRequest('http://localhost/api/textbook/flashcards/flash-1/review', {
      method: 'POST',
      body: JSON.stringify({ quality: 7 }),
    })

    const response = await POST(request, { params: Promise.resolve({ id: 'flash-1' }) })

    expect(response.status).toBe(400)
    const data = await response.json()
    expect(data.error).toMatch(/quality must be between 0 and 5/i)
  })

  it('returns 404 when flashcard is missing', async () => {
    ;(resolveUserId as jest.Mock).mockResolvedValue('user-123')
    prismaMock.flashcard.findFirst.mockResolvedValue(null)

    const request = new NextRequest('http://localhost/api/textbook/flashcards/flash-1/review', {
      method: 'POST',
      body: JSON.stringify({ quality: 3 }),
    })

    const response = await POST(request, { params: Promise.resolve({ id: 'flash-1' }) })

    expect(response.status).toBe(404)
    const data = await response.json()
    expect(data.error).toMatch(/flashcard not found/i)
  })

  it('updates flashcard schedule and records review', async () => {
    ;(resolveUserId as jest.Mock).mockResolvedValue('user-123')

    prismaMock.flashcard.findFirst.mockResolvedValue({
      id: 'flash-1',
      userId: 'user-123',
      interval: 6,
      easeFactor: 2.5,
      repetitions: 2,
    })

    prismaMock.flashcard.update.mockResolvedValue({
      id: 'flash-1',
      interval: 15,
      easeFactor: 2.6,
      repetitions: 3,
      nextReview: new Date('2024-02-02'),
      lastReviewed: new Date('2024-01-18'),
    })

    prismaMock.flashcardReview.create.mockResolvedValue({
      id: 'review-1',
      flashcardId: 'flash-1',
      quality: 5,
      createdAt: new Date('2024-01-18'),
    })

    const request = new NextRequest('http://localhost/api/textbook/flashcards/flash-1/review', {
      method: 'POST',
      body: JSON.stringify({ quality: 5 }),
    })

    const response = await POST(request, { params: Promise.resolve({ id: 'flash-1' }) })

    expect(response.status).toBe(200)
    const data = await response.json()
    expect(data.nextReviewDays).toBe(15)
    expect(prismaMock.flashcard.update).toHaveBeenCalledWith({
      where: { id: 'flash-1' },
      data: expect.objectContaining({
        interval: 15,
        easeFactor: 2.6,
        repetitions: 3,
        nextReview: expect.any(Date),
        lastReviewed: expect.any(Date),
      }),
    })
    expect(prismaMock.flashcardReview.create).toHaveBeenCalledWith({
      data: { flashcardId: 'flash-1', quality: 5 },
    })
  })

  it('returns 500 when review fails', async () => {
    ;(resolveUserId as jest.Mock).mockResolvedValue('user-123')
    prismaMock.flashcard.findFirst.mockRejectedValue(new Error('DB down'))

    const request = new NextRequest('http://localhost/api/textbook/flashcards/flash-1/review', {
      method: 'POST',
      body: JSON.stringify({ quality: 2 }),
    })

    const response = await POST(request, { params: Promise.resolve({ id: 'flash-1' }) })

    expect(response.status).toBe(500)
    const data = await response.json()
    expect(data.error).toMatch(/db down/i)
  })
})
