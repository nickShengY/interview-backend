/**
 * Tests for the ATS Cover Letter API route
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

import { NextRequest } from 'next/server'

function createFormDataRequest(fields: Record<string, string | File>) {
  const request = new NextRequest('http://localhost/api/ats/cover-letter', { method: 'POST' })
  const formData = new FormData()
  for (const [key, val] of Object.entries(fields)) {
    formData.append(key, val)
  }
  // Override formData method to return our FormData
  ;(request as any).formData = () => Promise.resolve(formData)
  return request
}

describe('POST /api/ats/cover-letter', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    process.env.NEXT_PUBLIC_ATS_API = 'http://localhost:8000'
  })

  it('should return 400 when resume is missing', async () => {
    const { POST } = await import('@/app/api/ats/cover-letter/route')
    const request = createFormDataRequest({ jd: 'Some job description' })
    const response = await POST(request)
    expect(response.status).toBe(400)
    const data = await response.json()
    expect(data.error).toContain('Missing')
  })

  it('should return 400 when job description is missing', async () => {
    const { POST } = await import('@/app/api/ats/cover-letter/route')
    const file = new File(['resume content'], 'resume.pdf', { type: 'application/pdf' })
    const request = createFormDataRequest({ resume: file })
    const response = await POST(request)
    expect(response.status).toBe(400)
    const data = await response.json()
    expect(data.error).toContain('Missing')
  })

  it('should proxy request to backend and return JSON response', async () => {
    const mockResponse = { coverLetter: 'Dear Hiring Manager...' }
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: () => Promise.resolve(JSON.stringify(mockResponse)),
    })

    const { POST } = await import('@/app/api/ats/cover-letter/route')
    const file = new File(['resume content'], 'resume.pdf', { type: 'application/pdf' })
    const request = createFormDataRequest({ resume: file, jd: 'Software Engineer position' })
    const response = await POST(request)
    expect(response.status).toBe(200)
    const data = await response.json()
    expect(data.coverLetter).toBe('Dear Hiring Manager...')
  })

  it('should return 500 when backend fails', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('Backend unreachable'))

    const { POST } = await import('@/app/api/ats/cover-letter/route')
    const file = new File(['resume content'], 'resume.pdf', { type: 'application/pdf' })
    const request = createFormDataRequest({ resume: file, jd: 'Position description' })
    const response = await POST(request)
    expect(response.status).toBe(500)
    const data = await response.json()
    expect(data.error).toBe('Backend unreachable')
  })

  it('should handle non-JSON backend response', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: () => Promise.resolve('plain text response'),
    })

    const { POST } = await import('@/app/api/ats/cover-letter/route')
    const file = new File(['resume'], 'resume.pdf', { type: 'application/pdf' })
    const request = createFormDataRequest({ resume: file, jd: 'Job desc' })
    const response = await POST(request)
    const data = await response.json()
    // Route returns the text itself as error or 'Backend returned non-JSON'
    expect(data.error).toBeDefined()
  })
})
