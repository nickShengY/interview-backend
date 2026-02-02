/**
 * Unit tests for speech transcription API route
 */

var mockCreate: jest.Mock

jest.mock('openai', () => {
  mockCreate = jest.fn()
  return jest.fn().mockImplementation(() => ({
    audio: {
      transcriptions: {
        create: mockCreate,
      },
    },
  }))
})

import { POST } from '@/app/api/speech/transcribe/route'
import { NextRequest } from 'next/server'

describe('POST /api/speech/transcribe', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    process.env.OPENAI_API_KEY = 'test-key'
  })

  const createRequest = (formData: FormData) =>
    ({
      formData: async () => formData,
    }) as unknown as NextRequest

  it('returns error when API key missing', async () => {
    process.env.OPENAI_API_KEY = ''
    const formData = new FormData()
    const request = createRequest(formData)

    const response = await POST(request)

    expect(response.status).toBe(500)
  })

  it('returns error when audio missing', async () => {
    const formData = new FormData()
    const request = createRequest(formData)

    const response = await POST(request)

    expect(response.status).toBe(400)
  })

  it('transcribes audio successfully', async () => {
    mockCreate.mockResolvedValue({ text: 'hello world' })

    const formData = new FormData()
    formData.append('audio', new Blob(['audio'], { type: 'audio/wav' }), 'clip.wav')
    const request = createRequest(formData)

    const response = await POST(request)

    expect(response.status).toBe(200)
    const data = await response.json()
    expect(data.text).toBe('hello world')
  })
})
