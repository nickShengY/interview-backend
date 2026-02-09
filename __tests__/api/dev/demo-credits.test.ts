/**
 * Tests for the dev demo-credits API route
 */

import { prismaMock } from '../../setup/prisma-mock'

jest.mock('@/lib/prisma', () => ({ prisma: prismaMock }))

jest.mock('@/lib/firebase/auth-utils', () => ({
  resolveUserId: jest.fn().mockResolvedValue('user-123'),
}))

import { NextRequest } from 'next/server'
import { POST } from '@/app/api/dev/demo-credits/route'
import { resolveUserId } from '@/lib/firebase/auth-utils'

describe('POST /api/dev/demo-credits', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should add 100 credits in non-production (test env)', async () => {
    prismaMock.$transaction.mockResolvedValue([
      { id: 'user-123', credits: 200 },
      { id: 'tx-1' },
    ])

    const request = new NextRequest('http://localhost/api/dev/demo-credits', { method: 'POST' })
    const response = await POST(request)
    expect(response.status).toBe(200)
    const data = await response.json()
    expect(data.credits).toBe(200)
  })

  it('should resolve user ID from request', async () => {
    prismaMock.$transaction.mockResolvedValue([
      { id: 'user-123', credits: 110 },
      { id: 'tx-2' },
    ])

    const request = new NextRequest('http://localhost/api/dev/demo-credits', { method: 'POST' })
    await POST(request)
    expect(resolveUserId).toHaveBeenCalledWith(request)
  })

  it('should call $transaction to add credits', async () => {
    prismaMock.$transaction.mockResolvedValue([
      { id: 'user-123', credits: 300 },
      { id: 'tx-3' },
    ])

    const request = new NextRequest('http://localhost/api/dev/demo-credits', { method: 'POST' })
    await POST(request)
    expect(prismaMock.$transaction).toHaveBeenCalled()
  })
})
