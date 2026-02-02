/**
 * Unit tests for textbook list API route
 */

import { prismaMock } from '../../setup/prisma-mock'

jest.mock('@/lib/prisma', () => ({
  prisma: prismaMock,
}))

jest.mock('@/lib/firebase/auth-utils', () => ({
  resolveUserId: jest.fn(),
}))

import { GET } from '@/app/api/textbook/list/route'
import { resolveUserId } from '@/lib/firebase/auth-utils'
import { NextRequest } from 'next/server'

describe('GET /api/textbook/list', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('returns textbooks with counts for the user', async () => {
    ;(resolveUserId as jest.Mock).mockResolvedValue('user-123')
    prismaMock.textbook.findMany.mockResolvedValue([
      {
        id: 'textbook-1',
        userId: 'user-123',
        title: 'Calculus',
        description: 'Limits and derivatives',
        fileName: 'calc.pdf',
        totalPages: 240,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-02'),
        lastStudied: null,
        _count: { chapters: 10, flashcards: 50, quizzes: 4 },
      },
    ])

    const request = new NextRequest('http://localhost/api/textbook/list')
    const response = await GET(request)

    expect(response.status).toBe(200)
    const data = await response.json()
    expect(data.textbooks).toHaveLength(1)
    expect(data.textbooks[0].title).toBe('Calculus')
    expect(prismaMock.textbook.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: 'user-123' },
        orderBy: { createdAt: 'desc' },
      })
    )
  })

  it('returns an empty list when no textbooks exist', async () => {
    ;(resolveUserId as jest.Mock).mockResolvedValue('user-123')
    prismaMock.textbook.findMany.mockResolvedValue([])

    const request = new NextRequest('http://localhost/api/textbook/list')
    const response = await GET(request)

    expect(response.status).toBe(200)
    const data = await response.json()
    expect(data.textbooks).toEqual([])
  })

  it('handles errors gracefully', async () => {
    ;(resolveUserId as jest.Mock).mockResolvedValue('user-123')
    prismaMock.textbook.findMany.mockRejectedValue(new Error('DB issue'))

    const request = new NextRequest('http://localhost/api/textbook/list')
    const response = await GET(request)

    expect(response.status).toBe(500)
    const data = await response.json()
    expect(data.error).toMatch(/db issue/i)
  })
})
