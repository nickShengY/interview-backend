/**
 * Unit tests for technical interview question generation
 */

jest.mock('@/lib/requireCredits', () => ({
  requireCredits: (_cost: number, _tx: string, handler: any) => handler,
}))

const mockGenerateContent = jest.fn()

jest.mock('@google/genai', () => ({
  GoogleGenAI: jest.fn().mockImplementation(() => ({
    models: {
      generateContent: mockGenerateContent,
    },
  })),
}))

import { POST } from '@/app/api/interview/technical/route'
import { NextRequest } from 'next/server'

const createRequest = (body: object) =>
  new NextRequest('http://localhost/api/interview/technical', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  })

describe('POST /api/interview/technical', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    process.env.GOOGLE_API_KEY = 'test-key'
  })

  it('returns 500 when GOOGLE_API_KEY missing', async () => {
    process.env.GOOGLE_API_KEY = ''

    const request = createRequest({ industry: 'Tech', title: 'Engineer', focus: 'React' })
    const response = await POST(request)

    expect(response.status).toBe(500)
  })

  it('returns 500 on non-JSON model response', async () => {
    mockGenerateContent.mockResolvedValue({ text: 'not json' })

    const request = createRequest({ industry: 'Tech', title: 'Engineer', focus: 'React' })
    const response = await POST(request)

    expect(response.status).toBe(500)
  })

  it('normalizes payload and fills defaults', async () => {
    mockGenerateContent.mockResolvedValue({
      text: JSON.stringify({
        questions: [
          { question: 'Explain hooks', difficulty: 'easy' },
          { question: 'Explain memoization', category: 'Performance' },
          { question: 'What is the virtual DOM?' },
          { question: 'Explain useEffect', difficulty: 'medium' },
          { question: 'Explain keys in lists', difficulty: 'hard' },
        ],
      }),
    })

    const request = createRequest({ industry: 'Tech', title: 'Engineer', focus: 'React' })
    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.questions).toHaveLength(5)
    expect(data.questions[0].difficulty).toBe('Easy')
    expect(data.questions[0].category).toBe('React - Engineer')
    expect(data.questions[0].expectedAnswer).toMatch(/Provide a detailed/i)
  })
})
