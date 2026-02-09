/**
 * Tests for the Career Roadmap API route
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
  roadmap: {
    title: 'ML Engineer Roadmap',
    estimatedTimeline: '12 months',
    phases: [
      {
        phase: 1,
        title: 'Foundation',
        duration: '3 months',
        description: 'Build fundamentals',
        skills: [
          { name: 'Python', priority: 'Critical', resources: ['Coursera'] },
        ],
        milestones: ['Complete Python course'],
        projects: ['Data cleaning project'],
      },
      {
        phase: 2,
        title: 'Intermediate',
        duration: '3 months',
        description: 'Build ML skills',
        skills: [
          { name: 'ML basics', priority: 'Important', resources: ['Fast.ai'] },
        ],
        milestones: ['Build ML model'],
        projects: ['Classification project'],
      },
    ],
  },
  skillGap: {
    currentStrengths: ['Python', 'SQL'],
    criticalGaps: [
      { skill: 'ML', importance: 'High', learningPath: 'Complete ML course', estimatedTime: '3 months' },
    ],
    matchPercentage: 40,
  },
  certifications: [
    { name: 'AWS ML Specialty', provider: 'AWS', difficulty: 'High', estimatedTime: '3 months', value: 'Recognized credential' },
  ],
  salaryProgression: [
    { stage: 'Current', expectedRange: '$70-90K', timeframe: 'Now' },
    { stage: 'Mid-term', expectedRange: '$120-150K', timeframe: '12 months' },
  ],
  actionItems: [
    { week: 'Week 1', action: 'Study Python', details: 'Complete exercises' },
    { week: 'Week 2', action: 'Start ML course', details: 'Module 1' },
    { week: 'Week 3', action: 'Build project', details: 'Mini project' },
    { week: 'Week 4', action: 'Review', details: 'Assess progress' },
    { week: 'Week 5', action: 'Next steps', details: 'Plan ahead' },
  ],
})

jest.mock('@/lib/llm/openrouter', () => ({
  generateStructuredOutput: (...args: unknown[]) => mockGenerateStructuredOutput(...args),
}))

import { NextRequest } from 'next/server'

describe('POST /api/career/roadmap', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    process.env.OPENROUTER_API_KEY = 'test-key'
  })

  it('should return career roadmap data', async () => {
    const { POST } = await import('@/app/api/career/roadmap/route')

    const request = new NextRequest('http://localhost/api/career/roadmap', {
      method: 'POST',
      body: JSON.stringify({
        currentRole: 'Data Analyst',
        targetRole: 'ML Engineer',
        currentSkills: 'Python, SQL',
        experience: '3-5',
        timeline: '12 months',
      }),
    })

    const response = await POST(request)
    expect(response.status).toBe(200)
    const data = await response.json()
    expect(data.roadmap).toBeDefined()
    expect(data.roadmap.phases).toHaveLength(2)
    expect(data.skillGap.matchPercentage).toBe(40)
    expect(data.certifications).toBeDefined()
    expect(data.salaryProgression).toBeDefined()
  })

  it('should handle minimal input', async () => {
    const { POST } = await import('@/app/api/career/roadmap/route')

    const request = new NextRequest('http://localhost/api/career/roadmap', {
      method: 'POST',
      body: JSON.stringify({
        currentRole: 'Junior Dev',
        targetRole: 'Senior Dev',
      }),
    })

    const response = await POST(request)
    expect(response.status).toBe(200)
  })

  it('should handle AI error', async () => {
    mockGenerateStructuredOutput.mockRejectedValueOnce(new Error('Timeout'))

    const { POST } = await import('@/app/api/career/roadmap/route')

    const request = new NextRequest('http://localhost/api/career/roadmap', {
      method: 'POST',
      body: JSON.stringify({ currentRole: 'Dev', targetRole: 'Lead' }),
    })

    const response = await POST(request)
    expect(response.status).toBe(500)
  })
})
