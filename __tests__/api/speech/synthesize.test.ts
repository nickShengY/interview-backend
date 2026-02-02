/**
 * Unit tests for speech synthesis API route
 */

var mockCreate: jest.Mock

jest.mock('openai', () => {
  mockCreate = jest.fn()
  return jest.fn().mockImplementation(() => ({
    audio: {
      speech: {
        create: mockCreate,
      },
    },
  }))
})

import { POST } from '@/app/api/speech/synthesize/route'
import { NextRequest } from 'next/server'

describe('POST /api/speech/synthesize', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    process.env.OPENAI_API_KEY = 'test-key'
  })

  const createRequest = (body: Record<string, unknown>) =>
    ({
      json: async () => body,
    }) as unknown as NextRequest

  it('returns error when API key missing', async () => {
    process.env.OPENAI_API_KEY = ''
    const request = createRequest({ text: 'hello' })

    const response = await POST(request)

    expect(response.status).toBe(500)
  })

  it('returns error when text missing', async () => {
    const request = createRequest({ text: '' })

    const response = await POST(request)

    expect(response.status).toBe(400)
  })

  it('returns error when text too long', async () => {
    const request = createRequest({ text: 'a'.repeat(5000) })

    const response = await POST(request)

    expect(response.status).toBe(400)
  })

  it('returns mp3 response on success', async () => {
    mockCreate.mockResolvedValue({
      arrayBuffer: async () => new Uint8Array([1, 2, 3]).buffer,
    })

    const request = createRequest({ text: 'hello', voice: 'nova' })

    const response = await POST(request)

    expect(response.status).toBe(200)
    expect(response.headers.get('Content-Type')).toBe('audio/mpeg')
  })
})
