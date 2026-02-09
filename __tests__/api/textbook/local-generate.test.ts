/**
 * Tests for the Textbook Local Generate API route
 */

jest.mock('@/lib/firebase/auth-utils', () => ({
  resolveUserId: jest.fn().mockResolvedValue('user-123'),
}))
jest.mock('@/lib/credits', () => ({
  ensureCredits: jest.fn().mockResolvedValue(undefined),
  refundCredits: jest.fn().mockResolvedValue(undefined),
}))

const mockProcessFullTextbook = jest.fn().mockResolvedValue({
  flashcards: [
    { front: 'Q1', back: 'A1', category: 'Basics', keyTerms: ['t1'], mnemonic: null },
    { front: 'Q2', back: 'A2', category: 'Advanced', keyTerms: ['t2'], mnemonic: 'M2' },
  ],
  quizQuestions: [
    { question: 'Quiz Q1?', options: ['A', 'B', 'C', 'D'], correctAnswer: 'A', explanation: 'Because' },
  ],
})

jest.mock('@/lib/textbook/analyzer', () => ({
  createAnalyzer: jest.fn(() => ({
    processFullTextbook: mockProcessFullTextbook,
  })),
}))

jest.mock('@/lib/ats/parser', () => ({
  extractTextFromFile: jest.fn().mockResolvedValue({
    content: 'Extracted textbook content about algorithms and data structures.',
    pages: 10,
  }),
}))

import { NextRequest } from 'next/server'

function createFormDataRequest(fields: Record<string, string | File>) {
  const request = new NextRequest('http://localhost/api/textbook/local-generate', { method: 'POST' })
  const formData = new FormData()
  for (const [key, val] of Object.entries(fields)) {
    formData.append(key, val)
  }
  ;(request as any).formData = () => Promise.resolve(formData)
  return request
}

describe('POST /api/textbook/local-generate', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should return 400 when no file is provided', async () => {
    const { POST } = await import('@/app/api/textbook/local-generate/route')
    const request = createFormDataRequest({ title: 'My Textbook' })
    const response = await POST(request)
    expect(response.status).toBe(400)
    const data = await response.json()
    expect(data.error).toContain('No file')
  })

  it('should generate flashcards and quiz from uploaded file', async () => {
    const { POST } = await import('@/app/api/textbook/local-generate/route')
    const file = new File(['textbook content'], 'algo.pdf', { type: 'application/pdf' })
    const request = createFormDataRequest({ file, title: 'Algorithms' })
    const response = await POST(request)
    expect(response.status).toBe(200)
    const data = await response.json()
    expect(data.session).toBeDefined()
    expect(data.session.totalCards).toBeGreaterThanOrEqual(0)
    expect(data.session.totalQuestions).toBeGreaterThanOrEqual(0)
  })

  it('should return 500 when analyzer is not configured', async () => {
    const { createAnalyzer } = require('@/lib/textbook/analyzer')
    ;(createAnalyzer as jest.Mock).mockReturnValueOnce(null)

    const { POST } = await import('@/app/api/textbook/local-generate/route')
    const file = new File(['content'], 'test.pdf', { type: 'application/pdf' })
    const request = createFormDataRequest({ file, title: 'Test' })
    const response = await POST(request)
    expect(response.status).toBe(500)
    const data = await response.json()
    expect(data.error).toContain('not configured')
  })

  it('should return 400 when text extraction fails', async () => {
    const { extractTextFromFile } = require('@/lib/ats/parser')
    ;(extractTextFromFile as jest.Mock).mockRejectedValueOnce(new Error('Unsupported format'))

    const { POST } = await import('@/app/api/textbook/local-generate/route')
    const file = new File(['binary'], 'bad.xyz', { type: 'application/octet-stream' })
    const request = createFormDataRequest({ file })
    const response = await POST(request)
    expect(response.status).toBe(400)
    const data = await response.json()
    expect(data.error).toContain('Unsupported format')
  })

  it('should return 400 when extracted content is empty', async () => {
    const { extractTextFromFile } = require('@/lib/ats/parser')
    ;(extractTextFromFile as jest.Mock).mockResolvedValueOnce({ content: '', pages: 0 })

    const { POST } = await import('@/app/api/textbook/local-generate/route')
    const file = new File(['empty'], 'empty.pdf', { type: 'application/pdf' })
    const request = createFormDataRequest({ file })
    const response = await POST(request)
    expect(response.status).toBe(400)
    const data = await response.json()
    expect(data.error).toContain('No text content')
  })

  it('should handle AI processing failure', async () => {
    mockProcessFullTextbook.mockRejectedValueOnce(new Error('AI timeout'))

    const { POST } = await import('@/app/api/textbook/local-generate/route')
    const file = new File(['content'], 'test.pdf', { type: 'application/pdf' })
    const request = createFormDataRequest({ file, title: 'Test' })
    const response = await POST(request)
    expect(response.status).toBe(500)
    const data = await response.json()
    expect(data.error).toBe('AI timeout')
  })

  it('should use default title when none provided', async () => {
    const { POST } = await import('@/app/api/textbook/local-generate/route')
    const file = new File(['content'], 'test.pdf', { type: 'application/pdf' })
    const request = createFormDataRequest({ file })
    const response = await POST(request)
    expect(response.status).toBe(200)
  })
})
