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
    // Resolve user ID - ensures user exists in database
    const userId = await resolveUserId(req)

    const textbooks = await prisma.textbook.findMany({
      where: { userId },
      select: {
        id: true,
        userId: true,
        title: true,
        description: true,
        // omit heavy content in list view
        fileName: true,
        totalPages: true,
        createdAt: true,
        updatedAt: true,
        lastStudied: true,
        _count: {
          select: {
            chapters: true,
            flashcards: true,
            quizzes: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ textbooks })
  } catch (error: unknown) {
    nativeConsole.error('Failed to list textbooks:', error)
    return NextResponse.json({ error: getErrorMessage(error) || 'Failed to list textbooks' }, { status: 500 })
  }
}
