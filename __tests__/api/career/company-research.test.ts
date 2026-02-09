/**
 * Tests for the Company Research API route
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
  companyOverview: {
    description: 'Leading tech company',
    industry: 'Technology',
    size: '10,000+ employees',
    culture: 'Innovative and collaborative',
    values: ['Innovation', 'Collaboration'],
  },
  interviewProcess: {
    stages: [
      { stage: 'Phone screen', description: 'Initial recruiter call', duration: '30 min', tips: ['Be concise'] },
      { stage: 'Technical', description: 'Coding round', duration: '45 min', tips: ['Practice coding'] },
    ],
    averageDuration: '4-6 weeks',
    difficulty: 'Hard',
  },
  commonQuestions: [
    { question: 'Why Google?', category: 'Motivation', sampleAnswer: 'I value innovation...' },
    { question: 'System design', category: 'Technical', sampleAnswer: 'Start with requirements...' },
    { question: 'Tell me about a challenge', category: 'Behavioral', sampleAnswer: 'I used STAR...' },
    { question: 'Leadership example', category: 'Behavioral', sampleAnswer: 'I led a team...' },
    { question: 'Trade-offs', category: 'Technical', sampleAnswer: 'Compare approaches...' },
  ],
  cultureInsights: [
    { aspect: 'Collaboration', detail: 'Teamwork is key', howToDemonstrate: 'Share cross-team wins' },
    { aspect: 'Innovation', detail: 'Experimentation encouraged', howToDemonstrate: 'Discuss prototypes' },
    { aspect: 'Ownership', detail: 'Leaders take responsibility', howToDemonstrate: 'Highlight outcomes' },
  ],
  talkingPoints: ['Product impact', 'Scaling experience', 'Culture fit', 'Customer focus'],
  questionsToAsk: [
    { question: 'How is success measured?', whyItWorks: 'Shows strategic thinking' },
    { question: 'What are current team priorities?', whyItWorks: 'Shows curiosity' },
    { question: 'How do teams collaborate?', whyItWorks: 'Shows collaboration focus' },
    { question: 'What is the onboarding process?', whyItWorks: 'Shows preparedness' },
  ],
})

jest.mock('@/lib/llm/openrouter', () => ({
  generateStructuredOutput: (...args: unknown[]) => mockGenerateStructuredOutput(...args),
}))

import { NextRequest } from 'next/server'

describe('POST /api/career/company-research', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    process.env.OPENROUTER_API_KEY = 'test-key'
  })

  it('should return company research data for valid input', async () => {
    const { POST } = await import('@/app/api/career/company-research/route')

    const request = new NextRequest('http://localhost/api/career/company-research', {
      method: 'POST',
      body: JSON.stringify({
        companyName: 'Google',
        targetRole: 'Software Engineer',
      }),
    })

    const response = await POST(request)
    expect(response.status).toBe(200)
    const data = await response.json()
    expect(data.companyOverview).toBeDefined()
    expect(data.cultureInsights).toBeDefined()
    expect(data.interviewProcess).toBeDefined()
    expect(data.commonQuestions).toBeDefined()
    expect(data.questionsToAsk).toBeDefined()
  })

  it('should handle missing company name gracefully', async () => {
    const { POST } = await import('@/app/api/career/company-research/route')

    const request = new NextRequest('http://localhost/api/career/company-research', {
      method: 'POST',
      body: JSON.stringify({ targetRole: 'Engineer' }),
    })

    const response = await POST(request)
    // Should still work — the prompt uses "Not provided" for missing fields
    expect(response.status).toBe(200)
  })

  it('should return 500 when AI throws', async () => {
    mockGenerateStructuredOutput.mockRejectedValueOnce(new Error('Service unavailable'))

    const { POST } = await import('@/app/api/career/company-research/route')

    const request = new NextRequest('http://localhost/api/career/company-research', {
      method: 'POST',
      body: JSON.stringify({ companyName: 'Test Corp' }),
    })

    const response = await POST(request)
    expect(response.status).toBe(500)
    const data = await response.json()
    expect(data.error).toBe('Service unavailable')
  })

  it('should handle invalid structured output from AI', async () => {
    mockGenerateStructuredOutput.mockResolvedValueOnce({ invalid: true })

    const { POST } = await import('@/app/api/career/company-research/route')

    const request = new NextRequest('http://localhost/api/career/company-research', {
      method: 'POST',
      body: JSON.stringify({ companyName: 'Test' }),
    })

    const response = await POST(request)
    expect(response.status).toBe(500)
  })
})
