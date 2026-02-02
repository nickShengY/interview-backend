/**
 * Unit tests for transactions API route
 */

import { prismaMock } from '../../setup/prisma-mock'

jest.mock('@/lib/prisma', () => ({
  prisma: prismaMock,
}))

jest.mock('@/lib/firebase/auth-utils', () => ({
  resolveUserId: jest.fn(),
}))

import { GET } from '@/app/api/user/transactions/route'
import { resolveUserId } from '@/lib/firebase/auth-utils'

describe('GET /api/user/transactions', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should return user transactions', async () => {
    ;(resolveUserId as jest.Mock).mockResolvedValue('user-123')
    ;(prismaMock.transaction.findMany as jest.Mock).mockResolvedValue([
      { id: 'tx-1', type: 'ATS_SCAN', delta: -2, createdAt: new Date() },
      { id: 'tx-2', type: 'REWARD', delta: 5, createdAt: new Date() },
    ])

    const request = new Request('http://localhost/api/user/transactions')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data).toHaveLength(2)
    expect(data[0].type).toBe('ATS_SCAN')
    expect(data[1].delta).toBe(5)
  })

  it('should return empty array for user with no transactions', async () => {
    ;(resolveUserId as jest.Mock).mockResolvedValue('user-123')
    ;(prismaMock.transaction.findMany as jest.Mock).mockResolvedValue([])

    const request = new Request('http://localhost/api/user/transactions')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data).toHaveLength(0)
  })

  it('should respect limit parameter', async () => {
    ;(resolveUserId as jest.Mock).mockResolvedValue('user-123')
    ;(prismaMock.transaction.findMany as jest.Mock).mockResolvedValue([
      { id: 'tx-1', type: 'ATS_SCAN', delta: -2, createdAt: new Date() },
    ])

    const request = new Request('http://localhost/api/user/transactions?limit=10')
    const response = await GET(request)

    expect(prismaMock.transaction.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        take: 10,
      })
    )
  })

  it('should cap limit at 100', async () => {
    ;(resolveUserId as jest.Mock).mockResolvedValue('user-123')
    ;(prismaMock.transaction.findMany as jest.Mock).mockResolvedValue([])

    const request = new Request('http://localhost/api/user/transactions?limit=500')
    await GET(request)

    expect(prismaMock.transaction.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        take: 100, // Capped at 100
      })
    )
  })

  it('should default to 50 transactions', async () => {
    ;(resolveUserId as jest.Mock).mockResolvedValue('user-123')
    ;(prismaMock.transaction.findMany as jest.Mock).mockResolvedValue([])

    const request = new Request('http://localhost/api/user/transactions')
    await GET(request)

    expect(prismaMock.transaction.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        take: 50,
      })
    )
  })

  it('should order by createdAt descending', async () => {
    ;(resolveUserId as jest.Mock).mockResolvedValue('user-123')
    ;(prismaMock.transaction.findMany as jest.Mock).mockResolvedValue([])

    const request = new Request('http://localhost/api/user/transactions')
    await GET(request)

    expect(prismaMock.transaction.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: { createdAt: 'desc' },
      })
    )
  })

  it('should only select specific fields', async () => {
    ;(resolveUserId as jest.Mock).mockResolvedValue('user-123')
    ;(prismaMock.transaction.findMany as jest.Mock).mockResolvedValue([])

    const request = new Request('http://localhost/api/user/transactions')
    await GET(request)

    expect(prismaMock.transaction.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        select: {
          id: true,
          type: true,
          delta: true,
          createdAt: true,
        },
      })
    )
  })

  it('should handle database errors', async () => {
    ;(resolveUserId as jest.Mock).mockResolvedValue('user-123')
    ;(prismaMock.transaction.findMany as jest.Mock).mockRejectedValue(new Error('DB Error'))

    const request = new Request('http://localhost/api/user/transactions')
    const response = await GET(request)

    expect(response.status).toBe(500)
  })
})
