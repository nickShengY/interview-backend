import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireCredits } from '@/lib/requireCredits'
import { createAnalyzer } from '@/lib/textbook/analyzer'

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

async function handler(req: NextRequest, userId: string) {
  try {
    const { textbookId, concept, explanation } = await req.json()

    if (!textbookId || !concept || !explanation) {
      return NextResponse.json({ 
        error: 'Missing required fields: textbookId, concept, explanation' 
      }, { status: 400 })
    }

    // Verify ownership
    const textbook = await prisma.textbook.findFirst({
      where: { id: textbookId, userId },
    })

    if (!textbook) {
      return NextResponse.json({ error: 'Textbook not found' }, { status: 404 })
    }

    // Create analyzer
    const analyzer = createAnalyzer()
    if (!analyzer) {
      return NextResponse.json({ error: 'AI service not configured' }, { status: 500 })
    }

    // Evaluate the explanation using the Feynman technique
    const evaluation = await analyzer.evaluateFeynmanExplanation(
      concept,
      explanation,
      textbook.content
    )

    // Update textbook last studied
    await prisma.textbook.update({
      where: { id: textbookId },
      data: { lastStudied: new Date() },
    })

    return NextResponse.json({
      evaluation,
      concept,
    })
  } catch (error: unknown) {
    nativeConsole.error('Feynman evaluation failed:', error)
    return NextResponse.json({ 
      error: getErrorMessage(error) || 'Failed to evaluate explanation' 
    }, { status: 500 })
  }
}

// Deduct 2 credits for Feynman evaluation
export const POST = requireCredits(2, 'TECH_Q', handler)
