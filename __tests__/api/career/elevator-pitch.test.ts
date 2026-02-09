/**
 * Tests for the Elevator Pitch API route
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
    pitches: [
      { type: '15-second', duration: '15s', pitch: 'Hi, I am a...', wordCount: 30 },
      { type: '30-second', duration: '30s', pitch: 'Hi, I am a software...', wordCount: 60 },
      { type: '60-second', duration: '60s', pitch: 'Let me tell you...', wordCount: 120 },
    ],
    keyElements: {
      hook: 'Start with a question',
      valueProposition: 'I help companies...',
      proof: '5 years of experience...',
      callToAction: 'Let us connect...',
    },
    deliveryTips: ['Speak slowly', 'Make eye contact', 'Smile', 'Pause between points'],
    commonPitfalls: ['Too long', 'No clear ask', 'Too technical'],
    adaptations: [
      { context: 'Career fair', modification: 'Lead with enthusiasm' },
      { context: 'Interview', modification: 'Align with job description' },
      { context: 'Networking', modification: 'Keep it casual' },
    ],
})

jest.mock('@/lib/llm/openrouter', () => ({
  generateStructuredOutput: (...args: unknown[]) => mockGenerateStructuredOutput(...args),
}))

import { NextRequest } from 'next/server'

describe('POST /api/career/elevator-pitch', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    process.env.OPENROUTER_API_KEY = 'test-key'
  })

  it('should return elevator pitch data for valid input', async () => {
    const { POST } = await import('@/app/api/career/elevator-pitch/route')

    const request = new NextRequest('http://localhost/api/career/elevator-pitch', {
      method: 'POST',
      body: JSON.stringify({
        name: 'John Doe',
        currentRole: 'Software Engineer',
        targetRole: 'Senior Engineer',
        skills: 'React, Node.js',
        uniqueValue: 'Full-stack expertise',
        industry: 'Technology',
      }),
    })

    const response = await POST(request)
    expect(response.status).toBe(200)
    const data = await response.json()
    expect(data.pitches).toHaveLength(3)
    expect(data.keyElements.hook).toBeDefined()
    expect(data.deliveryTips.length).toBeGreaterThanOrEqual(4)
    expect(data.commonPitfalls.length).toBeGreaterThanOrEqual(3)
    expect(data.adaptations.length).toBeGreaterThanOrEqual(3)
  })

  it('should handle minimal input', async () => {
    const { POST } = await import('@/app/api/career/elevator-pitch/route')

    const request = new NextRequest('http://localhost/api/career/elevator-pitch', {
      method: 'POST',
      body: JSON.stringify({ name: 'Jane' }),
    })

    const response = await POST(request)
    expect(response.status).toBe(200)
  })

  it('should handle AI returning invalid response', async () => {
    mockGenerateStructuredOutput.mockResolvedValueOnce({ invalid: true })

    const { POST } = await import('@/app/api/career/elevator-pitch/route')

    const request = new NextRequest('http://localhost/api/career/elevator-pitch', {
      method: 'POST',
      body: JSON.stringify({ name: 'Test' }),
    })

    const response = await POST(request)
    expect(response.status).toBe(500)
    const data = await response.json()
    expect(data.error).toContain('invalid response')
  })

  it('should handle AI throwing an error', async () => {
    mockGenerateStructuredOutput.mockRejectedValueOnce(new Error('API quota exceeded'))

    const { POST } = await import('@/app/api/career/elevator-pitch/route')

    const request = new NextRequest('http://localhost/api/career/elevator-pitch', {
      method: 'POST',
      body: JSON.stringify({ name: 'Test' }),
    })

    const response = await POST(request)
    expect(response.status).toBe(500)
    const data = await response.json()
    expect(data.error).toBe('API quota exceeded')
  })
})
