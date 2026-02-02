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

// SuperMemo SM-2 algorithm implementation
function calculateNextReview(quality: number, currentInterval: number, currentEaseFactor: number, currentRepetitions: number) {
  let newEaseFactor = currentEaseFactor
  let newInterval = currentInterval
  let newRepetitions = currentRepetitions

  if (quality >= 3) {
    // Correct answer
    newRepetitions += 1
    if (newRepetitions === 1) {
      newInterval = 1
    } else if (newRepetitions === 2) {
      newInterval = 6
    } else {
      newInterval = Math.round(currentInterval * newEaseFactor)
    }
    newEaseFactor = Math.max(1.3, newEaseFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)))
  } else {
    // Incorrect answer - restart
    newRepetitions = 0
    newInterval = 1
  }

  return { newInterval, newEaseFactor, newRepetitions }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Resolve user ID - ensures user exists in database
    const userId = await resolveUserId(req)

    const { id: flashcardId } = await params
    const { quality } = await req.json() // 0-5 rating

    if (quality < 0 || quality > 5) {
      return NextResponse.json({ error: 'Quality must be between 0 and 5' }, { status: 400 })
    }

    // Get flashcard
    const flashcard = await prisma.flashcard.findFirst({
      where: { id: flashcardId, userId },
    })

    if (!flashcard) {
      return NextResponse.json({ error: 'Flashcard not found' }, { status: 404 })
    }

    // Calculate next review using SM-2
    const { newInterval, newEaseFactor, newRepetitions } = calculateNextReview(
      quality,
      flashcard.interval,
      flashcard.easeFactor,
      flashcard.repetitions
    )

    const nextReview = new Date()
    nextReview.setDate(nextReview.getDate() + newInterval)

    // Update flashcard
    const updatedFlashcard = await prisma.flashcard.update({
      where: { id: flashcardId },
      data: {
        interval: newInterval,
        easeFactor: newEaseFactor,
        repetitions: newRepetitions,
        nextReview,
        lastReviewed: new Date(),
      },
    })

    // Create review record
    await prisma.flashcardReview.create({
      data: {
        flashcardId,
        quality,
      },
    })

    return NextResponse.json({ 
      flashcard: updatedFlashcard,
      nextReviewDays: newInterval,
    })
  } catch (error: unknown) {
    nativeConsole.error('Review failed:', error)
    return NextResponse.json({ error: getErrorMessage(error) || 'Failed to record review' }, { status: 500 })
  }
}
