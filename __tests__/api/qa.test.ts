/**
 * Unit tests for QA API route
 */

import { prismaMock } from '../setup/prisma-mock'

jest.mock('@/lib/prisma', () => ({
  prisma: prismaMock,
}))

jest.mock('@/lib/firebase/auth-utils', () => ({
  resolveUserId: jest.fn(),
}))

import { GET } from '@/app/api/qa/route'
import { resolveUserId } from '@/lib/firebase/auth-utils'
import { NextRequest } from 'next/server'

describe('GET /api/qa', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('returns user QAs', async () => {
    ;(resolveUserId as jest.Mock).mockResolvedValue('user-123')
    prismaMock.qA.findMany.mockResolvedValue([
      { id: 'qa-1', question: 'Q', answer: 'A', userId: 'user-123' },
    ])

    const request = new NextRequest('http://localhost/api/qa')
    const response = await GET(request)

    expect(response.status).toBe(200)
    const data = await response.json()
    expect(data.qas).toHaveLength(1)
  })

  it('handles errors gracefully', async () => {
    ;(resolveUserId as jest.Mock).mockResolvedValue('user-123')
    prismaMock.qA.findMany.mockRejectedValue(new Error('DB error'))

    const request = new NextRequest('http://localhost/api/qa')
    const response = await GET(request)

    expect(response.status).toBe(500)
    const data = await response.json()
    expect(data.error).toMatch(/failed to fetch/i)
  })
})
