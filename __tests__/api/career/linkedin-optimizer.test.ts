/**
 * Tests for the LinkedIn Optimizer API route
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
  overallScore: 72,
  headlineAnalysis: {
    score: 60,
    current: 'Software Engineer',
    suggestions: ['Add specialization', 'Include value proposition'],
    optimized: 'Senior Software Engineer | React & Node.js | Building scalable web apps',
  },
  summaryAnalysis: {
    score: 65,
    strengths: ['Clear experience'],
    improvements: ['Add metrics', 'Include call to action'],
    optimizedSummary: 'Passionate engineer with 5+ years...',
  },
  keywordOptimization: {
    missingKeywords: ['cloud', 'agile', 'CI/CD'],
    strongKeywords: ['JavaScript', 'React'],
    recommendedSkills: ['TypeScript', 'AWS', 'Docker'],
  },
  sectionRecommendations: [
    { section: 'Headline', priority: 'High', recommendation: 'Add specialization' },
    { section: 'Summary', priority: 'Medium', recommendation: 'Include metrics' },
  ],
  networkingTips: ['Engage with content daily', 'Join groups', 'Send personalized connection requests'],
  contentIdeas: [
    { topic: 'Tech trends', format: 'Article', reason: 'Shows thought leadership' },
    { topic: 'Career tips', format: 'Post', reason: 'Builds credibility' },
    { topic: 'Project highlights', format: 'Thread', reason: 'Demonstrates impact' },
  ],
})

jest.mock('@/lib/llm/openrouter', () => ({
  generateStructuredOutput: (...args: unknown[]) => mockGenerateStructuredOutput(...args),
}))

import { NextRequest } from 'next/server'

describe('POST /api/career/linkedin-optimizer', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    process.env.OPENROUTER_API_KEY = 'test-key'
  })

  it('should return LinkedIn optimization data', async () => {
    const { POST } = await import('@/app/api/career/linkedin-optimizer/route')

    const request = new NextRequest('http://localhost/api/career/linkedin-optimizer', {
      method: 'POST',
      body: JSON.stringify({
        headline: 'Software Engineer',
        summary: 'Experienced developer',
        experience: '5 years at various companies',
        targetRole: 'Senior Engineer',
      }),
    })

    const response = await POST(request)
    expect(response.status).toBe(200)
    const data = await response.json()
    expect(data.overallScore).toBe(72)
    expect(data.headlineAnalysis).toBeDefined()
    expect(data.summaryAnalysis).toBeDefined()
    expect(data.keywordOptimization).toBeDefined()
    expect(data.contentIdeas).toBeDefined()
  })

  it('should handle empty profile data', async () => {
    const { POST } = await import('@/app/api/career/linkedin-optimizer/route')

    const request = new NextRequest('http://localhost/api/career/linkedin-optimizer', {
      method: 'POST',
      body: JSON.stringify({}),
    })

    const response = await POST(request)
    expect(response.status).toBe(200)
  })

  it('should handle AI failure gracefully', async () => {
    mockGenerateStructuredOutput.mockRejectedValueOnce(new Error('Rate limited'))

    const { POST } = await import('@/app/api/career/linkedin-optimizer/route')

    const request = new NextRequest('http://localhost/api/career/linkedin-optimizer', {
      method: 'POST',
      body: JSON.stringify({ headline: 'Test' }),
    })

    const response = await POST(request)
    expect(response.status).toBe(500)
    const data = await response.json()
    expect(data.error).toBe('Rate limited')
  })

  it('should handle invalid structured output', async () => {
    mockGenerateStructuredOutput.mockResolvedValueOnce({ invalid: true })

    const { POST } = await import('@/app/api/career/linkedin-optimizer/route')

    const request = new NextRequest('http://localhost/api/career/linkedin-optimizer', {
      method: 'POST',
      body: JSON.stringify({ headline: 'Test' }),
    })

    const response = await POST(request)
    expect(response.status).toBe(500)
    const data = await response.json()
    expect(data.error).toContain('invalid response')
  })
})
