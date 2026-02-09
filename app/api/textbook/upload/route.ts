import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireCredits } from '@/lib/requireCredits'
import { generateStructuredOutput } from '@/lib/llm/openrouter'
import { z } from 'zod'
import { zodToJsonSchema } from 'zod-to-json-schema'
import { extractTextFromFile } from '@/lib/ats/parser'
import { validateFile, sanitizeFilename, globalFileUploadLimiter } from '@/lib/file-security'
import { withRateLimit, RATE_LIMITS } from '@/lib/rate-limit'

// Ensure Node.js runtime for Buffer and native libs
export const runtime = 'nodejs'

const nativeConsole = globalThis.console

function hasMessage(err: unknown): err is { message: string } {
  return (
    typeof err === 'object' &&
    err !== null &&
    'message' in err &&
    typeof (err as { message?: unknown }).message === 'string'
  )
}

function getErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message
  if (hasMessage(err)) return err.message
  if (typeof err === 'string') return err
  return 'Unknown error'
}

function sanitizeText(input: string): string {
  // Remove null bytes and control chars except \n, \r, \t
  return input
    .replace(/\u0000/g, '')
    .replace(/[\u0001-\u0009\u000B-\u001F\u007F]/g, '')
}

async function handler(req: NextRequest, userId: string) {
  try {
    // Rate limiting - 10 uploads per hour per user
    const rateLimitCheck = await withRateLimit(req, RATE_LIMITS.UPLOAD, userId)
    if (!rateLimitCheck.success) {
      return rateLimitCheck.response
    }

    // Additional file upload rate limiting (global)
    if (!globalFileUploadLimiter.canUpload(userId)) {
      const remaining = globalFileUploadLimiter.getRemainingUploads(userId)
      return NextResponse.json(
        {
          error: 'Upload rate limit exceeded',
          message: `You can upload ${remaining} more files in the next hour. Please try again later.`,
        },
        { status: 429 }
      )
    }

    const formData = await req.formData()
    const file = formData.get('file') as File
    const title = formData.get('title') as string

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Validate file security (magic bytes, size, type)
    const validation = await validateFile(file, {
      maxSize: 50 * 1024 * 1024, // 50MB
      allowedTypes: ['PDF', 'TXT', 'MARKDOWN', 'DOCX', 'DOC'],
      strictMimeType: false,
    })

    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }

    // Log warnings if any
    if (validation.warnings && validation.warnings.length > 0) {
      nativeConsole.warn('File upload warnings:', validation.warnings)
    }

    // Sanitize filename to prevent directory traversal
    const fileName = sanitizeFilename(file.name)
    let content: string
    let totalPages: number
    
    try {
      const extracted = await extractTextFromFile(file)
      content = sanitizeText(extracted.content)
      totalPages = extracted.pages
    } catch (err: unknown) {
      return NextResponse.json({ 
        error: getErrorMessage(err) || 'Failed to extract text from file. Please use a text-based PDF or TXT file.' 
      }, { status: 400 })
    }

    if (!content || !content.trim()) {
      return NextResponse.json({ 
        error: 'No text content could be extracted from this file.' 
      }, { status: 400 })
    }

    // Create textbook in database
    const textbook = await prisma.textbook.create({
      data: {
        userId,
        title: title || fileName.replace(/\.[^/.]+$/, ''),
        description: `Uploaded: ${fileName}`,
        content,
        fileName,
        totalPages,
      },
    })

    // Generate chapters using AI if API key available
    const apiKey = process.env.OPENROUTER_API_KEY?.trim()
    if (apiKey && content.length > 100) {
      try {
        const chapterSchema = z.object({
          chapters: z.array(z.object({
            title: z.string(),
            summary: z.string(),
            keyPoints: z.array(z.string()),
          })),
        })

        const prompt = `Analyze this textbook content and extract 3-5 main chapters with summaries and key points.

Content preview:
${content.substring(0, 3000)}

Return JSON in this format: {"chapters": [{"title": "...", "summary": "...", "keyPoints": ["...", "..."]}]}`

        const parsed = await generateStructuredOutput<z.infer<typeof chapterSchema>>({
          prompt,
          schema: zodToJsonSchema(chapterSchema) as Record<string, unknown>,
        })
        const chapters = parsed.chapters || []

        // Create chapters
        for (let i = 0; i < chapters.length; i++) {
          await prisma.textbookChapter.create({
            data: {
              textbookId: textbook.id,
              title: chapters[i].title,
              content: chapters[i].summary,
              orderIndex: i,
              summary: chapters[i].summary,
              keyPoints: chapters[i].keyPoints || [],
            },
          })
        }
      } catch (error: unknown) {
        nativeConsole.warn('Failed to generate chapters:', error)
      }
    }

    return NextResponse.json({ 
      textbook: {
        id: textbook.id,
        title: textbook.title,
        totalPages: textbook.totalPages,
      }
    })
  } catch (error: unknown) {
    nativeConsole.error('Upload failed:', error)
    return NextResponse.json({ error: getErrorMessage(error) || 'Upload failed' }, { status: 500 })
  }
}

// Deduct 10 credits for textbook upload
export const POST = requireCredits(10, 'TEXTBOOK_UPLOAD', handler)
