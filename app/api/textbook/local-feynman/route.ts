import { NextRequest, NextResponse } from 'next/server'
import { requireCredits } from '@/lib/requireCredits'
import { createAnalyzer } from '@/lib/textbook/analyzer'

// Local-only Feynman evaluator: sends only explanation + concept summary to AI
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

async function handler(req: NextRequest, _userId: string) {
  try {
    void _userId
    const { concept, explanation, conceptSummary, examples } = await req.json()

    if (!concept || !explanation || !conceptSummary) {
      return NextResponse.json(
        { error: 'Missing required fields: concept, explanation, conceptSummary' },
        { status: 400 },
      )
    }

    const analyzer = createAnalyzer()
    if (!analyzer) {
      return NextResponse.json({ error: 'AI service not configured' }, { status: 500 })
    }

    const contextPieces: string[] = [
      `Concept summary:\n${conceptSummary}`,
    ]

    if (Array.isArray(examples) && examples.length > 0) {
      contextPieces.push(`Concrete examples or related points:\n${examples.join('\n')}`)
    }

    const syntheticSource = contextPieces.join('\n\n').slice(0, 3000)

    const evaluation = await analyzer.evaluateFeynmanExplanation(
      concept,
      explanation,
      syntheticSource,
    )

    return NextResponse.json({ evaluation, concept })
  } catch (error: unknown) {
    nativeConsole.error('Local Feynman evaluation failed:', error)
    return NextResponse.json(
      { error: getErrorMessage(error) || 'Failed to evaluate explanation' },
      { status: 500 },
    )
  }
}

// Match credit usage with server-backed Feynman: 2 credits per evaluation
export const POST = requireCredits(2, 'TECH_Q', handler)
