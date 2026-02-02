/**
 * Unit tests for behavioral interview question generation
 */

import { prismaMock } from '../../setup/prisma-mock'

jest.mock('@/lib/prisma', () => ({
  prisma: prismaMock,
}))

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

import { POST } from '@/app/api/interview/behavioral/route'
import { NextRequest } from 'next/server'

const createRequest = (body: object) =>
  new NextRequest('http://localhost/api/interview/behavioral', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  })

describe('POST /api/interview/behavioral', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    process.env.GOOGLE_API_KEY = 'test-key'
    prismaMock.user.findUnique.mockResolvedValue({ mbti: 'INTJ', sign: 'Aries' })
  })

  it('returns 500 when GOOGLE_API_KEY missing', async () => {
    process.env.GOOGLE_API_KEY = ''

    const request = createRequest({ industry: 'Tech', title: 'Engineer' })
    const response = await POST(request)

    expect(response.status).toBe(500)
  })

  it('returns 500 on non-JSON model response', async () => {
    mockGenerateContent.mockResolvedValue({ text: 'not json' })

    const request = createRequest({ industry: 'Tech', title: 'Engineer' })
    const response = await POST(request)

    expect(response.status).toBe(500)
  })

  it('normalizes array payload into 5 questions', async () => {
    mockGenerateContent.mockResolvedValue({
      text: JSON.stringify([
        { question: 'Q1', difficulty: 'easy', category: 'Leadership', expectedAnswer: 'A1' },
        { question: 'Q2', difficulty: 'hard', category: 'Conflict', expectedAnswer: 'A2' },
        { question: 'Q3', difficulty: 'medium', category: 'Growth', expectedAnswer: 'A3' },
        { question: 'Q4', difficulty: 'easy', category: 'Teamwork', expectedAnswer: 'A4' },
        { question: 'Q5', difficulty: 'medium', category: 'Adaptability', expectedAnswer: 'A5' },
      ]),
    })

    const request = createRequest({ industry: 'Tech', title: 'Engineer' })
    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.questions).toHaveLength(5)
    expect(data.questions[0].difficulty).toBe('Easy')
  })

  it('fills defaults when model output incomplete', async () => {
    mockGenerateContent.mockResolvedValue({
      text: JSON.stringify({ questions: ['Describe a challenge you faced.'] }),
    })

    const request = createRequest({ industry: 'Tech', title: 'Engineer' })
    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.questions).toHaveLength(1)
    expect(data.questions[0].category).toBe('Behavioral')
    expect(data.questions[0].expectedAnswer).toMatch(/STAR/i)
  })
})
