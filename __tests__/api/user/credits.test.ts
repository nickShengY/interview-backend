/**
 * Unit tests for credits API route
 */

import { prismaMock } from '../../setup/prisma-mock'

// Mock dependencies
jest.mock('@/lib/prisma', () => ({
  prisma: prismaMock,
}))

jest.mock('@/lib/firebase/auth-utils', () => ({
  resolveUserId: jest.fn(),
}))

import { GET } from '@/app/api/user/credits/route'
import { resolveUserId } from '@/lib/firebase/auth-utils'

describe('GET /api/user/credits', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should return user credits and plan', async () => {
    ;(resolveUserId as jest.Mock).mockResolvedValue('user-123')
    ;(prismaMock.user.findUnique as jest.Mock).mockResolvedValue({
      credits: 50,
      plan: 'PRO',
    })

    const request = new Request('http://localhost/api/user/credits')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.credits).toBe(50)
    expect(data.plan).toBe('PRO')
  })

  it('should return 404 when user not found', async () => {
    ;(resolveUserId as jest.Mock).mockResolvedValue('nonexistent-user')
    ;(prismaMock.user.findUnique as jest.Mock).mockResolvedValue(null)

    const request = new Request('http://localhost/api/user/credits')
    const response = await GET(request)

    expect(response.status).toBe(404)
  })

  it('should handle database errors gracefully', async () => {
    ;(resolveUserId as jest.Mock).mockResolvedValue('user-123')
    ;(prismaMock.user.findUnique as jest.Mock).mockRejectedValue(new Error('DB Error'))

    const request = new Request('http://localhost/api/user/credits')
    const response = await GET(request)

    expect(response.status).toBe(500)
  })

  it('should select only credits and plan fields', async () => {
    ;(resolveUserId as jest.Mock).mockResolvedValue('user-123')
    ;(prismaMock.user.findUnique as jest.Mock).mockResolvedValue({
      credits: 10,
      plan: 'FREE',
    })

    const request = new Request('http://localhost/api/user/credits')
    await GET(request)

    expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
      where: { id: 'user-123' },
      select: { credits: true, plan: true },
    })
  })
})
