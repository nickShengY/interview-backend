import { NextRequest, NextResponse } from 'next/server'
import { requireCredits } from '@/lib/requireCredits'
import { prisma } from '@/lib/prisma'
import { generateStructuredOutput } from '@/lib/llm/openrouter'
import { z } from 'zod'
import { zodToJsonSchema } from 'zod-to-json-schema'

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

async function handler(req: NextRequest, userId: string) {
  try {
    const user = await prisma.user.findUnique({ where: { id: userId } })
    const { industry, title } = await req.json()
    const key = process.env.OPENROUTER_API_KEY
    if (!key) return NextResponse.json({ error: 'Missing OPENROUTER_API_KEY' }, { status: 500 })

    const questionSchema = z.object({
      id: z.number().int().positive(),
      question: z.string().min(10),
      difficulty: z.enum(['Easy', 'Medium', 'Hard']),
      category: z.string(),
      expectedAnswer: z.string(),
    })
    const responseSchema = z.object({
      questions: z.array(questionSchema).min(5).max(5),
    })

    const prompt = `You are an interview coach.
Generate exactly 5 behavioral interview questions for a ${title} role in the ${industry} industry.
Personalize using MBTI: ${user?.mbti || 'N/A'} and Zodiac: ${user?.sign || 'N/A'}.
Return JSON only that matches the provided JSON schema. Include difficulty, category (behavioral theme), and brief expected answer.`

    let payload: unknown
    try {
      payload = await generateStructuredOutput<z.infer<typeof responseSchema>>({
        prompt,
        schema: zodToJsonSchema(responseSchema) as Record<string, unknown>,
      })
    } catch (err: unknown) {
      return NextResponse.json({ error: getErrorMessage(err) || 'Model returned invalid response' }, { status: 500 })
    }
    let rawArr: unknown[] = []
    if (Array.isArray(payload)) rawArr = payload
    else if (isRecord(payload) && Array.isArray(payload.questions)) rawArr = payload.questions

    const normDiff = (d: unknown): 'Easy' | 'Medium' | 'Hard' => {
      if (typeof d !== 'string') return 'Medium'
      const cap = d.trim().toLowerCase()
      if (cap === 'easy') return 'Easy'
      if (cap === 'medium') return 'Medium'
      if (cap === 'hard') return 'Hard'
      return 'Medium'
    }

    const normalizedQuestions = rawArr.slice(0, 5).map((q: unknown, i: number) => {
      const qObj = isRecord(q) ? q : null

      const questionText = typeof qObj?.question === 'string'
        ? qObj.question
        : (typeof q === 'string' ? q : 'Provide a relevant behavioral interview question.')

      const categoryValue = qObj?.category
      const category = typeof categoryValue === 'string' && categoryValue
        ? categoryValue
        : 'Behavioral'

      const expectedAnswerValue = qObj?.expectedAnswer
      const expectedAnswer = typeof expectedAnswerValue === 'string' && expectedAnswerValue
        ? expectedAnswerValue
        : 'Use STAR: Situation, Task, Action, Result. Be specific and authentic.'

      const difficulty = normDiff(qObj?.difficulty)
      const id = typeof qObj?.id === 'number' ? qObj.id : i + 1
      return { id, question: questionText, difficulty, category, expectedAnswer }
    })

    const result = { questions: normalizedQuestions }
    const check = responseSchema.safeParse(result)
    return NextResponse.json(check.success ? check.data : result)
  } catch (err: unknown) {
    return NextResponse.json({ error: getErrorMessage(err) || 'Failed to generate questions' }, { status: 500 })
  }
}

export const POST = requireCredits(1, 'BEHAV_Q', handler)
