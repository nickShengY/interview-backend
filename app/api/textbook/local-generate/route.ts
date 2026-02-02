import { NextRequest, NextResponse } from 'next/server'
import { requireCredits } from '@/lib/requireCredits'
import { extractTextFromFile } from '@/lib/ats/parser'
import { createAnalyzer } from '@/lib/textbook/analyzer'

// Ensure Node.js runtime for Buffer and server-side libraries
export const runtime = 'nodejs'

const nativeConsole = globalThis.console

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

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

type FlashcardLike = {
  front: string
  back: string
  category?: string
  keyTerms?: string[]
  mnemonic?: string | null
  mnemonics?: string | null
}

type QuizQuestionLike = {
  question: string
  options?: string[]
  correctAnswer?: string
  explanation?: string
}

type CardWithId = {
  id: string
  textbookId: string
  front: string
  back: string
  category: string
  keyTerms: string[]
  mnemonic: string | null
}

type QuestionWithId = {
  id: string
  question: string
  options: string[]
  correctAnswer: string
  explanation: string
}

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

async function handler(req: NextRequest, _userId: string) {
  try {
    void _userId
    const formData = await req.formData()
    const file = formData.get('file') as File | null
    const titleFromForm = (formData.get('title') as string) || 'Untitled Textbook'

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // 1) Extract raw text (PDF/TXT) without persisting textbook content
    let content: string
    let totalPages: number

    try {
      const extracted = await extractTextFromFile(file)
      content = extracted.content
      totalPages = extracted.pages || 1
    } catch (err: unknown) {
      return NextResponse.json({
        error: getErrorMessage(err) || 'Failed to extract text from file. Please use a text-based PDF or TXT file.',
      }, { status: 400 })
    }

    if (!content || !content.trim()) {
      return NextResponse.json({ error: 'No text content could be extracted from this file.' }, { status: 400 })
    }

    const title = titleFromForm.trim() || 'Untitled Textbook'

    // 2) Use multi-agent analyzer to generate flashcards + quiz questions (no DB writes)
    const analyzer = createAnalyzer()
    if (!analyzer) {
      return NextResponse.json({ error: 'AI service not configured' }, { status: 500 })
    }

    const analysis = await analyzer.processFullTextbook(content, title)

    // 3) Deduplicate flashcards by front text and quiz questions by question text
    const seenFront = new Set<string>()
    const uniqueFlashcards = (analysis.flashcards || []).filter((fc: unknown): fc is FlashcardLike => {
      if (!isRecord(fc) || typeof fc.front !== 'string' || !fc.front) return false
      if (typeof fc.back !== 'string') return false
      const key = fc.front.toLowerCase().trim()
      if (seenFront.has(key)) return false
      seenFront.add(key)
      return true
    })

    const seenQuestions = new Set<string>()
    const uniqueQuestions = (analysis.quizQuestions || []).filter((q: unknown): q is QuizQuestionLike => {
      if (!isRecord(q) || typeof q.question !== 'string' || !q.question) return false
      const key = q.question.toLowerCase().trim()
      if (seenQuestions.has(key)) return false
      seenQuestions.add(key)
      return true
    })

    // 4) Compute target counts based on textbook length
    // Guideline: random 20–30 cards and ~10 questions per 20 pages
    const pageGroups = Math.max(1, Math.round(totalPages / 20))

    // Random 20–30 cards per 20-page group to keep sets varied but bounded
    let desiredCards = 0
    for (let i = 0; i < pageGroups; i++) {
      // 20 to 30 inclusive
      desiredCards += 20 + Math.floor(Math.random() * 11)
    }

    // Around 8–12 questions per 20-page group (centered on 10)
    let desiredQuestions = 0
    for (let i = 0; i < pageGroups; i++) {
      // 8 to 12 inclusive
      desiredQuestions += 8 + Math.floor(Math.random() * 5)
    }

    const targetCards = Math.max(10, Math.min(uniqueFlashcards.length, desiredCards))
    const targetQuestions = Math.max(5, Math.min(uniqueQuestions.length, desiredQuestions))

    // Shuffle for variety, then trim to targets
    const sampledFlashcards = shuffleArray(uniqueFlashcards).slice(0, targetCards)
    const sampledQuestions = shuffleArray(uniqueQuestions).slice(0, targetQuestions)

    // 5) Build 10-card and 10-question batches for UX
    const sessionId = `local-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`

    const cardsWithIds: CardWithId[] = sampledFlashcards.map((fc, idx) => ({
      id: `${sessionId}-card-${idx}`,
      textbookId: sessionId,
      front: fc.front,
      back: fc.back,
      category: fc.category || 'General',
      keyTerms: fc.keyTerms || [],
      mnemonic:
        fc.mnemonic ||
        (() => {
          const mnemonics = (fc as Record<string, unknown>).mnemonics
          return typeof mnemonics === 'string' ? mnemonics : null
        })(),
    }))

    const questionsWithIds: QuestionWithId[] = sampledQuestions.map((q, idx) => ({
      id: `${sessionId}-q-${idx}`,
      question: q.question,
      options: q.options || [],
      correctAnswer: q.correctAnswer || 'A',
      explanation: q.explanation || '',
    }))

    const cardBatches: CardWithId[][] = []
    for (let i = 0; i < cardsWithIds.length; i += 10) {
      cardBatches.push(cardsWithIds.slice(i, i + 10))
    }

    const quizBatches: QuestionWithId[][] = []
    for (let i = 0; i < questionsWithIds.length; i += 10) {
      quizBatches.push(questionsWithIds.slice(i, i + 10))
    }

    const session = {
      id: sessionId,
      title,
      createdAt: new Date().toISOString(),
      totalPages,
      totalCards: cardsWithIds.length,
      totalQuestions: questionsWithIds.length,
      cardBatches,
      quizBatches,
    }

    return NextResponse.json({ session })
  } catch (error: unknown) {
    nativeConsole.error('Local textbook generation failed:', error)
    const code = isRecord(error) ? (error.code ?? '') : ''
    const message = getErrorMessage(error).toLowerCase()

    if (code === 'ECONNRESET' || message.includes('aborted')) {
      return NextResponse.json({
        error:
          'The AI service had a temporary connection issue while processing your textbook. Your credits were refunded automatically. Please try again in a moment.',
      }, { status: 502 })
    }

    return NextResponse.json({ error: getErrorMessage(error) || 'Failed to process textbook' }, { status: 500 })
  }
}

// Deduct 10 credits per full-textbook local generation (logged as TEXTBOOK_UPLOAD)
export const POST = requireCredits(10, 'TEXTBOOK_UPLOAD', handler)
