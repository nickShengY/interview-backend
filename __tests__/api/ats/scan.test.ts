/**
 * Unit tests for ATS scan API route
 */

import { prismaMock } from '../../setup/prisma-mock'

jest.mock('@/lib/prisma', () => ({
  prisma: prismaMock,
}))

jest.mock('@/lib/firebase/auth-utils', () => ({
  resolveUserId: jest.fn().mockResolvedValue('user-123'),
}))

jest.mock('@/lib/credits', () => ({
  ensureCredits: jest.fn(),
  refundCredits: jest.fn(),
}))

// Mock global fetch for backend proxy
const mockFetch = jest.fn()
global.fetch = mockFetch

import { resolveUserId } from '@/lib/firebase/auth-utils'
import { ensureCredits, refundCredits } from '@/lib/credits'

describe('POST /api/ats/scan', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    process.env.NEXT_PUBLIC_ATS_API = 'http://localhost:8000'
  })

  const createScanRequest = (formData: FormData) =>
    ({
      formData: async () => formData,
      url: 'http://localhost/api/ats/scan',
      headers: new Headers(),
    }) as any

  describe('Request Validation', () => {
    it('should require resume file', async () => {
      ;(resolveUserId as jest.Mock).mockResolvedValue('user-123')

      // Import dynamically to get fresh module
      const { POST } = await import('@/app/api/ats/scan/route')

      const formData = new FormData()
      formData.append('jd', 'Job description text')

      const response = await POST(createScanRequest(formData))

      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error).toContain('Missing resume')
    })

    it('should require job description', async () => {
      ;(resolveUserId as jest.Mock).mockResolvedValue('user-123')

      const { POST } = await import('@/app/api/ats/scan/route')

      const formData = new FormData()
      const file = new File(['resume content'], 'resume.pdf', { type: 'application/pdf' })
      formData.append('resume', file)

      const response = await POST(createScanRequest(formData))

      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error).toContain('Missing')
    })
  })

  describe('Credit System Integration', () => {
    it('should deduct 2 credits for ATS scan', async () => {
      ;(resolveUserId as jest.Mock).mockResolvedValue('user-123')
      ;(ensureCredits as jest.Mock).mockResolvedValue(undefined)
      
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        text: () => Promise.resolve(JSON.stringify({ traditional_score: 75 })),
      })

      const { POST } = await import('@/app/api/ats/scan/route')

      const formData = new FormData()
      const file = new File(['resume content'], 'resume.pdf', { type: 'application/pdf' })
      formData.append('resume', file)
      formData.append('jd', 'Looking for a Python developer with 5 years experience')

      await POST(createScanRequest(formData))

      expect(ensureCredits).toHaveBeenCalledWith('user-123', 2, 'ATS_SCAN')
    })

    it('should return 402 for insufficient credits', async () => {
      ;(resolveUserId as jest.Mock).mockResolvedValue('user-123')
      ;(ensureCredits as jest.Mock).mockRejectedValue(new Error('Insufficient credits'))

      const { POST } = await import('@/app/api/ats/scan/route')

      const formData = new FormData()
      const file = new File(['resume content'], 'resume.pdf', { type: 'application/pdf' })
      formData.append('resume', file)
      formData.append('jd', 'Looking for a developer')

      const response = await POST(createScanRequest(formData))

      expect(response.status).toBe(402)
    })

    it('should refund credits on backend failure', async () => {
      ;(resolveUserId as jest.Mock).mockResolvedValue('user-123')
      ;(ensureCredits as jest.Mock).mockResolvedValue(undefined)
      ;(refundCredits as jest.Mock).mockResolvedValue(undefined)
      
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        text: () => Promise.resolve('Backend error'),
      })

      const { POST } = await import('@/app/api/ats/scan/route')

      const formData = new FormData()
      const file = new File(['resume content'], 'resume.pdf', { type: 'application/pdf' })
      formData.append('resume', file)
      formData.append('jd', 'Looking for a developer')

      await POST(createScanRequest(formData))

      expect(refundCredits).toHaveBeenCalledWith('user-123', 2, 'ATS_SCAN')
    })
  })

  describe('Backend Proxy', () => {
    it('should proxy request to Python backend', async () => {
      ;(resolveUserId as jest.Mock).mockResolvedValue('user-123')
      ;(ensureCredits as jest.Mock).mockResolvedValue(undefined)
      
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        text: () => Promise.resolve(JSON.stringify({
          traditional_score: 80,
          ai_score: 75,
          missing_keywords: ['kubernetes'],
        })),
      })

      const { POST } = await import('@/app/api/ats/scan/route')

      const formData = new FormData()
      const file = new File(['resume content'], 'resume.pdf', { type: 'application/pdf' })
      formData.append('resume', file)
      formData.append('jd', 'Looking for a developer')

      await POST(createScanRequest(formData))

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:8000/scan',
        expect.objectContaining({ method: 'POST' })
      )
    })

    it('should return backend response data', async () => {
      ;(resolveUserId as jest.Mock).mockResolvedValue('user-123')
      ;(ensureCredits as jest.Mock).mockResolvedValue(undefined)
      
      const backendResponse = {
        traditional_score: 85.5,
        ai_score: 82.0,
        missing_keywords: ['docker', 'kubernetes'],
        matched_keywords: ['python', 'django'],
        formatting_penalty: 0,
        analysis_id: 'test-id',
      }
      
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        text: () => Promise.resolve(JSON.stringify(backendResponse)),
      })

      const { POST } = await import('@/app/api/ats/scan/route')

      const formData = new FormData()
      const file = new File(['resume'], 'resume.pdf', { type: 'application/pdf' })
      formData.append('resume', file)
      formData.append('jd', 'Looking for a developer')

      const response = await POST(createScanRequest(formData))
      const data = await response.json()

      expect(data.traditional_score).toBe(85.5)
      expect(data.missing_keywords).toContain('docker')
    })
  })
})
