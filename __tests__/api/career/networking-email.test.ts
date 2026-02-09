/**
 * Tests for the Networking Email API route
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

const mockGenerateStructuredOutput = jest.fn().mockResolvedValue({
  emails: [
    { tone: 'Professional', subject: 'Introduction', body: 'Dear Sir/Madam...', tips: ['Be concise'] },
    { tone: 'Friendly', subject: 'Quick hello', body: 'Hey there...', tips: ['Be warm'] },
    { tone: 'Assertive', subject: 'Opportunity', body: 'I noticed...', tips: ['Be direct'] },
  ],
  bestPractices: ['Keep it short', 'Personalize', 'Follow up'],
  followUpSchedule: [
    { day: 3, action: 'Send follow-up', template: 'Following up...' },
    { day: 7, action: 'Try different channel', template: 'Checking in...' },
  ],
})

jest.mock('@/lib/llm/openrouter', () => ({
  generateStructuredOutput: (...args: unknown[]) => mockGenerateStructuredOutput(...args),
}))

import { NextRequest } from 'next/server'

describe('POST /api/career/networking-email', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    process.env.OPENROUTER_API_KEY = 'test-key'
  })

  it('should return networking email data for valid input', async () => {
    const { POST } = await import('@/app/api/career/networking-email/route')

    const request = new NextRequest('http://localhost/api/career/networking-email', {
      method: 'POST',
      body: JSON.stringify({
        emailType: 'cold_outreach',
        recipientRole: 'Engineering Manager',
        recipientCompany: 'Google',
        context: 'I am interested in joining the team',
        yourBackground: 'Senior Engineer with 5 years experience',
      }),
    })

    const response = await POST(request)
    expect(response.status).toBe(200)
    const data = await response.json()
    expect(data.emails).toHaveLength(3)
    expect(data.bestPractices).toBeDefined()
    expect(data.followUpSchedule).toBeDefined()
    expect(data.followUpSchedule).toBeDefined()
  })

  it('should handle empty context gracefully', async () => {
    const { POST } = await import('@/app/api/career/networking-email/route')

    const request = new NextRequest('http://localhost/api/career/networking-email', {
      method: 'POST',
      body: JSON.stringify({
        emailType: 'thank_you',
        recipientRole: 'Recruiter',
      }),
    })

    const response = await POST(request)
    expect(response.status).toBe(200)
  })

  it('should return 500 when AI fails', async () => {
    mockGenerateStructuredOutput.mockRejectedValueOnce(new Error('Network error'))

    const { POST } = await import('@/app/api/career/networking-email/route')

    const request = new NextRequest('http://localhost/api/career/networking-email', {
      method: 'POST',
      body: JSON.stringify({ emailType: 'follow_up' }),
    })

    const response = await POST(request)
    expect(response.status).toBe(500)
  })

  it('should handle invalid structured output from AI', async () => {
    mockGenerateStructuredOutput.mockResolvedValueOnce({ invalid: true })

    const { POST } = await import('@/app/api/career/networking-email/route')

    const request = new NextRequest('http://localhost/api/career/networking-email', {
      method: 'POST',
      body: JSON.stringify({ emailType: 'cold_outreach' }),
    })

    const response = await POST(request)
    expect(response.status).toBe(500)
    const data = await response.json()
    expect(data.error).toContain('invalid response')
  })
})
