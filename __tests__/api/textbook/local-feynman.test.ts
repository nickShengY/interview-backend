/**
 * Tests for the Local Feynman Evaluation API route
 */

jest.mock('@/lib/firebase/auth-utils', () => ({
  resolveUserId: jest.fn().mockResolvedValue('user-123'),
}))
jest.mock('@/lib/credits', () => ({
  ensureCredits: jest.fn().mockResolvedValue(undefined),
  refundCredits: jest.fn().mockResolvedValue(undefined),
}))

const mockEvaluateFeynman = jest.fn().mockResolvedValue({
  score: 7,
  feedback: 'Decent explanation',
  gaps: ['Missing edge cases'],
  suggestions: ['Add examples'],
})

jest.mock('@/lib/textbook/analyzer', () => ({
  createAnalyzer: jest.fn(() => ({
    evaluateFeynmanExplanation: mockEvaluateFeynman,
  })),
}))

import { NextRequest } from 'next/server'

describe('POST /api/textbook/local-feynman', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should return 400 when required fields are missing', async () => {
    const { POST } = await import('@/app/api/textbook/local-feynman/route')
    const request = new NextRequest('http://localhost/api/textbook/local-feynman', {
      method: 'POST',
      body: JSON.stringify({ concept: 'X' }),
    })
    const response = await POST(request)
    expect(response.status).toBe(400)
    const data = await response.json()
    expect(data.error).toContain('Missing required fields')
  })

  it('should evaluate explanation successfully', async () => {
    const { POST } = await import('@/app/api/textbook/local-feynman/route')
    const request = new NextRequest('http://localhost/api/textbook/local-feynman', {
      method: 'POST',
      body: JSON.stringify({
        concept: 'Binary Search',
        explanation: 'Divide and conquer to find element',
        conceptSummary: 'An efficient search algorithm',
      }),
    })
    const response = await POST(request)
    expect(response.status).toBe(200)
    const data = await response.json()
    expect(data.evaluation).toBeDefined()
    expect(data.concept).toBe('Binary Search')
  })

  it('should include examples in context when provided', async () => {
    const { POST } = await import('@/app/api/textbook/local-feynman/route')
    const request = new NextRequest('http://localhost/api/textbook/local-feynman', {
      method: 'POST',
      body: JSON.stringify({
        concept: 'Sorting',
        explanation: 'Arranging elements',
        conceptSummary: 'Ordering data',
        examples: ['Bubble sort', 'Quick sort'],
      }),
    })
    const response = await POST(request)
    expect(response.status).toBe(200)
    expect(mockEvaluateFeynman).toHaveBeenCalledWith(
      'Sorting',
      'Arranging elements',
      expect.stringContaining('Bubble sort'),
    )
  })

  it('should return 500 when evaluation fails', async () => {
    mockEvaluateFeynman.mockRejectedValueOnce(new Error('AI unavailable'))
    const { POST } = await import('@/app/api/textbook/local-feynman/route')
    const request = new NextRequest('http://localhost/api/textbook/local-feynman', {
      method: 'POST',
      body: JSON.stringify({
        concept: 'X',
        explanation: 'Y',
        conceptSummary: 'Z',
      }),
    })
    const response = await POST(request)
    expect(response.status).toBe(500)
    const data = await response.json()
    expect(data.error).toBe('AI unavailable')
  })

  it('should return 500 when analyzer is not configured', async () => {
    const { createAnalyzer } = require('@/lib/textbook/analyzer')
    ;(createAnalyzer as jest.Mock).mockReturnValueOnce(null)

    const { POST } = await import('@/app/api/textbook/local-feynman/route')
    const request = new NextRequest('http://localhost/api/textbook/local-feynman', {
      method: 'POST',
      body: JSON.stringify({
        concept: 'X',
        explanation: 'Y',
        conceptSummary: 'Z',
      }),
    })
    const response = await POST(request)
    expect(response.status).toBe(500)
    const data = await response.json()
    expect(data.error).toContain('not configured')
  })
})
