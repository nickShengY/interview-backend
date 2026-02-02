import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { resolveUserId } from '@/lib/firebase/auth-utils'

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

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const textbookId = searchParams.get('textbookId') || undefined
    const limitParam = Number(searchParams.get('limit') ?? 100)
    const limit = Number.isFinite(limitParam) ? Math.min(200, Math.max(1, limitParam)) : 100

    // Resolve user ID - ensures user exists in database
    const userId = await resolveUserId(req)

    const where = { userId, ...(textbookId ? { textbookId } : {}) }

    const flashcards = await prisma.flashcard.findMany({
      where,
      orderBy: [{ createdAt: 'desc' }],
      take: limit,
      select: {
        id: true,
        textbookId: true,
        front: true,
        back: true,
        chunkId: true,
        category: true,
        keyTerms: true,
        mnemonics: true,
        difficulty: true,
        nextReview: true,
        interval: true,
        easeFactor: true,
        repetitions: true,
        createdAt: true,
      },
    })

    return NextResponse.json({ flashcards })
  } catch (error: unknown) {
    nativeConsole.error('Failed to list flashcards:', error)
    return NextResponse.json({ error: getErrorMessage(error) || 'Failed to list flashcards' }, { status: 500 })
  }
}
