import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireCredits } from '@/lib/requireCredits'
import { createAnalyzer, splitIntoChunks } from '@/lib/textbook/analyzer'
import type { Flashcard } from '@prisma/client'

const nativeConsole = globalThis.console

type AnalyzerFlashcard = {
  front: string
  back: string
  category?: string
  keyTerms?: string[]
  mnemonic?: string | null
  difficulty?: 'basic' | 'intermediate' | 'advanced'
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

async function handler(req: NextRequest, userId: string) {
  try {
    const { textbookId } = await req.json()

    if (!textbookId) {
      return NextResponse.json({ error: 'Textbook ID required' }, { status: 400 })
    }

    // Verify ownership
    const textbook = await prisma.textbook.findFirst({
      where: { id: textbookId, userId },
      include: { chapters: true },
    })

    if (!textbook) {
      return NextResponse.json({ error: 'Textbook not found' }, { status: 404 })
    }

    // Create multi-agent analyzer
    const analyzer = createAnalyzer()
    if (!analyzer) {
      return NextResponse.json({ error: 'AI service not configured' }, { status: 500 })
    }

    // Split content into chunks for comprehensive coverage
    const chunks = splitIntoChunks(textbook.content)
    nativeConsole.log(`Processing ${chunks.length} chunks from textbook...`)

    // Process chunks in parallel (max 10 at a time for rate limiting)
    const batchSize = 5
    const allFlashcards: AnalyzerFlashcard[] = []

    for (let i = 0; i < chunks.length && i < 10; i += batchSize) {
      const batch = chunks.slice(i, i + batchSize)
      const promises = batch.map((chunk, idx) =>
        analyzer.generateFlashcardsFromChunk(chunk, i + idx, textbook.title)
          .catch((err: unknown) => {
            nativeConsole.warn(`Chunk ${i + idx} failed:`, getErrorMessage(err))
            return { flashcards: [] as AnalyzerFlashcard[] }
          })
      )
      const results = await Promise.all(promises)
      results.forEach(r => allFlashcards.push(...r.flashcards))
    }

    // Deduplicate by front text (similar questions)
    const seen = new Set<string>()
    const uniqueFlashcards = allFlashcards.filter(fc => {
      const key = fc.front.toLowerCase().trim()
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })

    // Create flashcards in database
    const now = new Date()
    const createdFlashcards: Flashcard[] = []
    let chunkCounter = 0

    for (const card of uniqueFlashcards) {
      const chunkId = `chunk-${Math.floor(chunkCounter / 5)}`
      chunkCounter++

      const flashcard = await prisma.flashcard.create({
        data: {
          userId,
          textbookId,
          front: card.front,
          back: card.back,
          chunkId,
          category: card.category || 'General',
          keyTerms: card.keyTerms || [],
          mnemonics: card.mnemonic || null,
          difficulty: card.difficulty === 'advanced' ? 2 : card.difficulty === 'intermediate' ? 1 : 0,
          nextReview: now,
          interval: 1,
          easeFactor: 2.5,
          repetitions: 0,
        },
      })
      createdFlashcards.push(flashcard)
    }

    // Update textbook last studied
    await prisma.textbook.update({
      where: { id: textbookId },
      data: { lastStudied: now },
    })

    return NextResponse.json({ 
      flashcards: createdFlashcards,
      count: createdFlashcards.length,
      chunksProcessed: chunks.length,
    })
  } catch (error: unknown) {
    nativeConsole.error('Flashcard generation failed:', error)
    return NextResponse.json({ error: getErrorMessage(error) || 'Failed to generate flashcards' }, { status: 500 })
  }
}

// Deduct 5 credits for flashcard generation
export const POST = requireCredits(5, 'TEXTBOOK_GENERATE_FLASHCARDS', handler)
