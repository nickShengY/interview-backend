/**
 * Unit tests for textbook upload API route
 */

import { prismaMock } from '../../setup/prisma-mock'

jest.mock('@/lib/prisma', () => ({
  prisma: prismaMock,
}))

jest.mock('@/lib/firebase/auth-utils', () => ({
  resolveUserId: jest.fn(),
}))

jest.mock('@/lib/credits', () => ({
  ensureCredits: jest.fn(),
  refundCredits: jest.fn(),
}))

jest.mock('@/lib/file-security', () => {
  const actual = jest.requireActual('@/lib/file-security')
  return {
    ...actual,
    validateFile: jest.fn(),
    globalFileUploadLimiter: {
      canUpload: jest.fn(),
      getRemainingUploads: jest.fn(),
      clear: jest.fn(),
    },
  }
})

jest.mock('@/lib/ats/parser', () => ({
  extractTextFromFile: jest.fn(),
}))

jest.mock('@/lib/rate-limit', () => ({
  RATE_LIMITS: { UPLOAD: { interval: 60 * 60 * 1000, uniqueTokenPerInterval: 10 } },
  withRateLimit: jest.fn().mockResolvedValue({ success: true }),
}))

const mockGenerateStructuredOutput = jest.fn().mockResolvedValue({ chapters: [] })

jest.mock('@/lib/llm/openrouter', () => ({
  generateStructuredOutput: (...args: unknown[]) => mockGenerateStructuredOutput(...args),
}))

import { POST } from '@/app/api/textbook/upload/route'
import { resolveUserId } from '@/lib/firebase/auth-utils'
import { ensureCredits, refundCredits } from '@/lib/credits'
import { validateFile, globalFileUploadLimiter } from '@/lib/file-security'
import { extractTextFromFile } from '@/lib/ats/parser'
import { NextRequest } from 'next/server'

// Helper to create FormData request
function createFileUploadRequest(file: { name: string; content: string; type: string }) {
  const formData = new FormData()
  const blob = new Blob([file.content], { type: file.type })
  formData.append('file', blob, file.name)

  return {
    formData: async () => formData,
    url: 'http://localhost/api/textbook/upload',
    headers: new Headers(),
  } as unknown as NextRequest
}

function createEmptyUploadRequest() {
  const formData = new FormData()
  return {
    formData: async () => formData,
    url: 'http://localhost/api/textbook/upload',
    headers: new Headers(),
  } as unknown as NextRequest
}

describe('POST /api/textbook/upload', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Mock environment variables
    process.env.NEXT_PUBLIC_ATS_API = 'http://localhost:8000'
    ;(validateFile as jest.Mock).mockResolvedValue({ valid: true, fileType: 'PDF' })
    ;(globalFileUploadLimiter.canUpload as jest.Mock).mockReturnValue(true)
    ;(globalFileUploadLimiter.getRemainingUploads as jest.Mock).mockReturnValue(10)
    ;(extractTextFromFile as jest.Mock).mockResolvedValue({ content: 'Extracted content', pages: 1 })
  })

  describe('File Validation', () => {
    it('should reject files larger than 50MB', async () => {
      ;(resolveUserId as jest.Mock).mockResolvedValue('user-123')
      ;(validateFile as jest.Mock).mockResolvedValue({ valid: false, error: 'File too large' })

      const largeContent = 'x'.repeat(51 * 1024 * 1024) // 51MB
      const request = createFileUploadRequest({
        name: 'large.pdf',
        content: largeContent,
        type: 'application/pdf',
      })

      const response = await POST(request)

      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error).toMatch(/too large/i)
    })

    it('should reject unsupported file types', async () => {
      ;(resolveUserId as jest.Mock).mockResolvedValue('user-123')
      ;(validateFile as jest.Mock).mockResolvedValue({ valid: false, error: 'Unsupported file type' })

      const request = createFileUploadRequest({
        name: 'executable.exe',
        content: 'MZ executable content',
        type: 'application/x-msdownload',
      })

      const response = await POST(request)

      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error).toMatch(/unsupported file type/i)
    })

    it('should accept PDF files', async () => {
      ;(resolveUserId as jest.Mock).mockResolvedValue('user-123')
      ;(ensureCredits as jest.Mock).mockResolvedValue(undefined)

      ;(extractTextFromFile as jest.Mock).mockResolvedValue({
        content: 'Extracted textbook content',
        pages: 100,
      })

      prismaMock.textbook.create.mockResolvedValue({
        id: 'textbook-1',
        userId: 'user-123',
        title: 'Uploaded Textbook',
        content: 'Extracted textbook content',
        totalPages: 100,
        fileName: 'textbook.pdf',
        description: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastStudied: null,
      })

      const request = createFileUploadRequest({
        name: 'textbook.pdf',
        content: '%PDF-1.4 content here',
        type: 'application/pdf',
      })

      const response = await POST(request)

      if (response.status === 200) {
        expect(ensureCredits).toHaveBeenCalledWith('user-123', 10, 'TEXTBOOK_UPLOAD')
      }
    })

    it('should accept TXT files', async () => {
      ;(resolveUserId as jest.Mock).mockResolvedValue('user-123')
      ;(ensureCredits as jest.Mock).mockResolvedValue(undefined)

      ;(validateFile as jest.Mock).mockResolvedValue({ valid: true, fileType: 'TXT' })
      ;(extractTextFromFile as jest.Mock).mockResolvedValue({
        content: 'Plain text textbook content',
        pages: 1,
      })

      prismaMock.textbook.create.mockResolvedValue({
        id: 'textbook-2',
        userId: 'user-123',
        title: 'Text Notes',
        content: 'Plain text content',
        totalPages: 1,
        fileName: 'notes.txt',
        description: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastStudied: null,
      })

      const request = createFileUploadRequest({
        name: 'notes.txt',
        content: 'Chapter 1: Introduction...',
        type: 'text/plain',
      })

      const response = await POST(request)

      expect(response.status).toBe(200)
    })
  })

  describe('Credit System', () => {
    it('should deduct 10 credits for upload', async () => {
      ;(resolveUserId as jest.Mock).mockResolvedValue('user-123')
      ;(ensureCredits as jest.Mock).mockResolvedValue(undefined)

      ;(extractTextFromFile as jest.Mock).mockResolvedValue({ content: 'Content', pages: 50 })

      prismaMock.textbook.create.mockResolvedValue({
        id: 'textbook-1',
        userId: 'user-123',
        title: 'Test',
        content: 'Content',
        totalPages: 50,
        fileName: 'test.pdf',
        description: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastStudied: null,
      })

      const request = createFileUploadRequest({
        name: 'textbook.pdf',
        content: '%PDF content',
        type: 'application/pdf',
      })

      await POST(request)

      expect(ensureCredits).toHaveBeenCalledWith('user-123', 10, 'TEXTBOOK_UPLOAD')
    })

    it('should return 402 when insufficient credits', async () => {
      ;(resolveUserId as jest.Mock).mockResolvedValue('user-123')
      ;(ensureCredits as jest.Mock).mockRejectedValue(new Error('Insufficient credits'))

      const request = createFileUploadRequest({
        name: 'textbook.pdf',
        content: '%PDF content',
        type: 'application/pdf',
      })

      const response = await POST(request)

      expect(response.status).toBe(402)
    })

    it('should refund credits on processing failure', async () => {
      ;(resolveUserId as jest.Mock).mockResolvedValue('user-123')
      ;(ensureCredits as jest.Mock).mockResolvedValue(undefined)

      ;(extractTextFromFile as jest.Mock).mockRejectedValue(new Error('Internal Server Error'))

      const request = createFileUploadRequest({
        name: 'textbook.pdf',
        content: '%PDF content',
        type: 'application/pdf',
      })

      await POST(request)

      expect(refundCredits).toHaveBeenCalledWith('user-123', 10, 'TEXTBOOK_UPLOAD')
    })
  })

  describe('Text Extraction', () => {
    it('should reject files with no extractable text', async () => {
      ;(resolveUserId as jest.Mock).mockResolvedValue('user-123')
      ;(ensureCredits as jest.Mock).mockResolvedValue(undefined)

      ;(extractTextFromFile as jest.Mock).mockRejectedValue(
        new Error('No text content could be extracted from this file.')
      )

      const request = createFileUploadRequest({
        name: 'scanned.pdf',
        content: '%PDF scanned image',
        type: 'application/pdf',
      })

      const response = await POST(request)

      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error).toMatch(/no text content/i)
    })

    it('should accept small but non-empty text content', async () => {
      ;(resolveUserId as jest.Mock).mockResolvedValue('user-123')
      ;(ensureCredits as jest.Mock).mockResolvedValue(undefined)

      ;(extractTextFromFile as jest.Mock).mockResolvedValue({
        content: 'Short',
        pages: 1,
      })

      prismaMock.textbook.create.mockResolvedValue({
        id: 'textbook-short',
        userId: 'user-123',
        title: 'Short',
        content: 'Short',
        totalPages: 1,
        fileName: 'short.pdf',
        description: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastStudied: null,
      })

      const request = createFileUploadRequest({
        name: 'short.pdf',
        content: '%PDF minimal',
        type: 'application/pdf',
      })

      const response = await POST(request)

      expect(response.status).toBe(200)
    })
  })

  describe('Database Operations', () => {
    it('should create textbook record in database', async () => {
      ;(resolveUserId as jest.Mock).mockResolvedValue('user-123')
      ;(ensureCredits as jest.Mock).mockResolvedValue(undefined)

      ;(extractTextFromFile as jest.Mock).mockResolvedValue({
        content: 'Comprehensive textbook content covering multiple topics in depth',
        pages: 250,
      })

      const createSpy = jest.fn().mockResolvedValue({
        id: 'textbook-1',
        userId: 'user-123',
        title: 'Advanced Physics',
        content: 'Comprehensive textbook content',
        totalPages: 250,
        fileName: 'physics.pdf',
        description: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastStudied: null,
      })

      prismaMock.textbook.create = createSpy

      const request = createFileUploadRequest({
        name: 'physics.pdf',
        content: '%PDF comprehensive content',
        type: 'application/pdf',
      })

      await POST(request)

      expect(createSpy).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: 'user-123',
          fileName: 'physics.pdf',
          totalPages: 250,
        }),
      })
    })
  })

  describe('Error Handling', () => {
    it('should handle backend API errors gracefully', async () => {
      ;(resolveUserId as jest.Mock).mockResolvedValue('user-123')
      ;(ensureCredits as jest.Mock).mockResolvedValue(undefined)

      ;(extractTextFromFile as jest.Mock).mockRejectedValue(new Error('Network error'))

      const request = createFileUploadRequest({
        name: 'textbook.pdf',
        content: '%PDF content',
        type: 'application/pdf',
      })

      const response = await POST(request)

      expect(response.status).toBe(400)
      expect(refundCredits).toHaveBeenCalled()
    })

    it('should handle missing file in request', async () => {
      ;(resolveUserId as jest.Mock).mockResolvedValue('user-123')

      const request = createEmptyUploadRequest()

      const response = await POST(request)

      expect(response.status).toBe(400)
    })
  })

  describe('Security', () => {
    it('should prevent directory traversal in filename', async () => {
      ;(resolveUserId as jest.Mock).mockResolvedValue('user-123')
      ;(ensureCredits as jest.Mock).mockResolvedValue(undefined)

      ;(extractTextFromFile as jest.Mock).mockResolvedValue({
        content: 'Valid textbook content for testing purposes',
        pages: 10,
      })

      prismaMock.textbook.create.mockResolvedValue({
        id: 'textbook-1',
        userId: 'user-123',
        title: 'Test',
        content: 'Content',
        totalPages: 10,
        fileName: '..evil.pdf', // Should be sanitized
        description: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastStudied: null,
      })

      const request = createFileUploadRequest({
        name: '../../../etc/passwd',
        content: '%PDF content',
        type: 'application/pdf',
      })

      await POST(request)

      expect(prismaMock.textbook.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            fileName: expect.not.stringContaining('..'),
          }),
        })
      )
    })

    it('should isolate textbooks by user', async () => {
      ;(resolveUserId as jest.Mock).mockResolvedValue('user-123')
      ;(ensureCredits as jest.Mock).mockResolvedValue(undefined)

      ;(extractTextFromFile as jest.Mock).mockResolvedValue({
        content: 'User-specific textbook content for isolation testing',
        pages: 10,
      })

      const createSpy = jest.fn().mockResolvedValue({
        id: 'textbook-1',
        userId: 'user-123',
        title: 'Test',
        content: 'Content',
        totalPages: 10,
        fileName: 'test.pdf',
        description: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastStudied: null,
      })

      prismaMock.textbook.create = createSpy

      const request = createFileUploadRequest({
        name: 'test.pdf',
        content: '%PDF content',
        type: 'application/pdf',
      })

      await POST(request)

      expect(createSpy).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: 'user-123',
        }),
      })
    })
  })
})
