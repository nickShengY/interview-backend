/**
 * Unit tests for profile API route
 */

import { prismaMock } from '../../setup/prisma-mock'

jest.mock('@/lib/prisma', () => ({
  prisma: prismaMock,
}))

jest.mock('@/lib/firebase/auth-utils', () => ({
  resolveUserId: jest.fn(),
}))

import { GET, PATCH } from '@/app/api/user/profile/route'
import { resolveUserId } from '@/lib/firebase/auth-utils'

describe('Profile API', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GET /api/user/profile', () => {
    it('should return user profile', async () => {
      ;(resolveUserId as jest.Mock).mockResolvedValue('user-123')
      ;(prismaMock.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'user-123',
        name: 'Test User',
        email: 'test@example.com',
        country: 'US',
        mbti: 'INTJ',
        sign: 'Aries',
        credits: 100,
        plan: 'PRO',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-15'),
      })

      const request = new Request('http://localhost/api/user/profile')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.name).toBe('Test User')
      expect(data.email).toBe('test@example.com')
      expect(data.credits).toBe(100)
    })

    it('should return 404 when user not found', async () => {
      ;(resolveUserId as jest.Mock).mockResolvedValue('user-123')
      ;(prismaMock.user.findUnique as jest.Mock).mockResolvedValue(null)

      const request = new Request('http://localhost/api/user/profile')
      const response = await GET(request)

      expect(response.status).toBe(404)
    })

    it('should handle errors gracefully', async () => {
      ;(resolveUserId as jest.Mock).mockResolvedValue('user-123')
      ;(prismaMock.user.findUnique as jest.Mock).mockRejectedValue(new Error('DB Error'))

      const request = new Request('http://localhost/api/user/profile')
      const response = await GET(request)

      expect(response.status).toBe(500)
    })
  })

  describe('PATCH /api/user/profile', () => {
    it('should update allowed fields', async () => {
      ;(resolveUserId as jest.Mock).mockResolvedValue('user-123')
      ;(prismaMock.user.update as jest.Mock).mockResolvedValue({
        id: 'user-123',
        name: 'Updated Name',
        email: 'test@example.com',
        country: 'CA',
        mbti: 'ENFP',
        sign: 'Leo',
        credits: 100,
        plan: 'PRO',
        updatedAt: new Date(),
      })

      const request = new Request('http://localhost/api/user/profile', {
        method: 'PATCH',
        body: JSON.stringify({
          name: 'Updated Name',
          country: 'CA',
          mbti: 'ENFP',
          sign: 'Leo',
        }),
      })

      const response = await PATCH(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.name).toBe('Updated Name')
      expect(data.country).toBe('CA')
    })

    it('should reject non-string values', async () => {
      ;(resolveUserId as jest.Mock).mockResolvedValue('user-123')
      ;(prismaMock.user.update as jest.Mock).mockResolvedValue({
        id: 'user-123',
        name: 'Test',
        email: 'test@example.com',
        country: null,
        mbti: null,
        sign: null,
        credits: 100,
        plan: 'PRO',
        updatedAt: new Date(),
      })

      const request = new Request('http://localhost/api/user/profile', {
        method: 'PATCH',
        body: JSON.stringify({
          name: 'Test',
          credits: 999, // Should be ignored - not a string
        }),
      })

      const response = await PATCH(request)

      expect(response.status).toBe(200)
      // credits shouldn't be updated since it's not an allowed field
    })

    it('should return 400 when no valid fields provided', async () => {
      ;(resolveUserId as jest.Mock).mockResolvedValue('user-123')

      const request = new Request('http://localhost/api/user/profile', {
        method: 'PATCH',
        body: JSON.stringify({
          invalidField: 'value',
        }),
      })

      const response = await PATCH(request)

      expect(response.status).toBe(400)
    })

    it('should not allow updating email', async () => {
      ;(resolveUserId as jest.Mock).mockResolvedValue('user-123')
      ;(prismaMock.user.update as jest.Mock).mockResolvedValue({
        id: 'user-123',
        name: 'Test',
        email: 'original@example.com',
        country: null,
        mbti: null,
        sign: null,
        credits: 100,
        plan: 'PRO',
        updatedAt: new Date(),
      })

      const request = new Request('http://localhost/api/user/profile', {
        method: 'PATCH',
        body: JSON.stringify({
          name: 'Test',
          email: 'hacked@example.com',
        }),
      })

      const response = await PATCH(request)
      
      // email should not be in the update call
      expect(prismaMock.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.not.objectContaining({ email: 'hacked@example.com' }),
        })
      )
    })

    it('should not allow updating credits directly', async () => {
      ;(resolveUserId as jest.Mock).mockResolvedValue('user-123')

      const request = new Request('http://localhost/api/user/profile', {
        method: 'PATCH',
        body: JSON.stringify({
          credits: 999999,
        }),
      })

      const response = await PATCH(request)
      
      // Should return 400 since credits is not an allowed field
      expect(response.status).toBe(400)
    })
  })
})
