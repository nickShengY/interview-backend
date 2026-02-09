/**
 * Tests for the Salary Negotiation API route
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
  marketData: { lowRange: 100000, median: 130000, highRange: 160000, currency: 'USD' },
  scripts: [
    { scenario: 'Initial offer', script: 'Thank you for the offer...', tips: ['Be confident'] },
    { scenario: 'Counter', script: 'I appreciate...', tips: ['Know your worth'] },
    { scenario: 'Competing', script: 'I have another offer...', tips: ['Be transparent'] },
  ],
  counterOfferStrategies: [
    { strategy: 'Anchor high', explanation: 'Start above target', examplePhrase: 'Based on my research...' },
    { strategy: 'Use data', explanation: 'Reference market data', examplePhrase: 'According to industry data...' },
    { strategy: 'Package deal', explanation: 'Negotiate total comp', examplePhrase: 'I am looking at the full package...' },
  ],
  negotiationTimeline: [
    { step: 1, action: 'Research', timing: 'Before offer', details: 'Gather market data' },
  ],
  commonMistakes: ['Accepting too quickly', 'Not negotiating', 'Sharing current salary'],
  benefits: [
    { benefit: 'Remote work', negotiationTip: 'Frame as productivity boost' },
    { benefit: 'PTO', negotiationTip: 'Request additional days' },
    { benefit: 'Equity', negotiationTip: 'Ask for vesting schedule' },
  ],
})

jest.mock('@/lib/llm/openrouter', () => ({
  generateStructuredOutput: (...args: unknown[]) => mockGenerateStructuredOutput(...args),
}))

import { NextRequest } from 'next/server'

describe('POST /api/career/salary-negotiation', () => {
  let POST: any

  beforeEach(() => {
    jest.clearAllMocks()
    process.env.OPENROUTER_API_KEY = 'test-key'
  })

  it('should return salary negotiation data for valid input', async () => {
    const mod = await import('@/app/api/career/salary-negotiation/route')
    POST = mod.POST

    const request = new NextRequest('http://localhost/api/career/salary-negotiation', {
      method: 'POST',
      body: JSON.stringify({
        jobTitle: 'Senior Software Engineer',
        industry: 'Technology',
        experienceLevel: 'Senior',
        currentSalary: '$120,000',
        targetSalary: '$150,000',
        location: 'San Francisco, CA',
      }),
    })

    const response = await POST(request)
    expect(response.status).toBe(200)
    const data = await response.json()
    expect(data.marketData).toBeDefined()
    expect(data.marketData.median).toBe(130000)
    expect(data.scripts).toHaveLength(3)
    expect(data.counterOfferStrategies).toHaveLength(3)
    expect(data.commonMistakes).toHaveLength(3)
    expect(data.benefits).toHaveLength(3)
  })

  it('should return 500 when OPENROUTER_API_KEY is missing', async () => {
    delete process.env.OPENROUTER_API_KEY
    jest.resetModules()
    
    // Re-mock dependencies after resetModules
    jest.mock('@/lib/prisma', () => ({ prisma: prismaMock }))
    jest.mock('@/lib/firebase/auth-utils', () => ({
      resolveUserId: jest.fn().mockResolvedValue('user-123'),
    }))
    jest.mock('@/lib/credits', () => ({
      ensureCredits: jest.fn().mockResolvedValue(undefined),
      refundCredits: jest.fn().mockResolvedValue(undefined),
    }))
    jest.mock('@/lib/llm/openrouter', () => ({
      generateStructuredOutput: jest.fn(),
    }))

    const mod = await import('@/app/api/career/salary-negotiation/route')
    const request = new NextRequest('http://localhost/api/career/salary-negotiation', {
      method: 'POST',
      body: JSON.stringify({
        jobTitle: 'Engineer',
        industry: 'Tech',
        experienceLevel: 'Mid',
      }),
    })

    const response = await mod.POST(request)
    expect(response.status).toBe(500)
    const data = await response.json()
    expect(data.error).toBeDefined()
  })
})
