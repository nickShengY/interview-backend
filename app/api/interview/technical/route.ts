import { NextRequest, NextResponse } from 'next/server'
import { requireCredits } from '@/lib/requireCredits'
import { GoogleGenAI } from '@google/genai'
import type { GenerateContentConfig } from '@google/genai'
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

async function handler(req: NextRequest, _userId: string) {
  void _userId
  try {
    const { industry, title, focus } = await req.json()
    const key = process.env.GOOGLE_API_KEY
    if (!key) return NextResponse.json({ error: 'Missing GOOGLE_API_KEY' }, { status: 500 })

    const questionSchema = z.object({
      id: z.number().int().positive().describe('1-based index of the question'),
      question: z.string().min(10).describe('The interview question text.'),
      difficulty: z.enum(['Easy', 'Medium', 'Hard']).describe('Relative difficulty of the question.'),
      category: z.string().describe('Topical category for the question, e.g. React, Algorithms.'),
      expectedAnswer: z.string().describe('Guidance for an ideal answer (brief).')
    })
    const responseSchema = z.object({
      questions: z.array(questionSchema).min(5).max(5)
    })

    const prompt = `You are an expert technical interviewer.
Generate exactly 5 technical interview questions for a ${title} role in the ${industry} industry, focusing on ${focus}.
Return JSON only that matches the provided JSON schema. Include reasonable difficulty, category, and brief expected answer for each.`

    const ai = new GoogleGenAI({ apiKey: key })
    const model = process.env.GEMINI_SMALL_MODEL || 'gemini-2.5-flash-lite'

    const configWithSchema = {
      responseMimeType: 'application/json',
      responseJsonSchema: zodToJsonSchema(responseSchema),
    } satisfies Record<string, unknown>

    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: configWithSchema as unknown as GenerateContentConfig,
    })
    const rawText = response.text ?? ''
    let payload: unknown
    try {
      payload = JSON.parse(rawText)
    } catch {
      return NextResponse.json({ error: 'Model returned non-JSON response' }, { status: 500 })
    }
    // Accept either { questions: [...] } or raw array; then normalize
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
        : (typeof q === 'string' ? q : 'Provide a relevant technical interview question.')

      const categoryValue = qObj?.category
      const category = typeof categoryValue === 'string' && categoryValue
        ? categoryValue
        : `${focus} - ${title}`

      const expectedAnswerValue = qObj?.expectedAnswer
      const expectedAnswer = typeof expectedAnswerValue === 'string' && expectedAnswerValue
        ? expectedAnswerValue
        : 'Provide a detailed, structured answer. Explain reasoning clearly; include trade-offs where relevant.'

      const difficulty = normDiff(qObj?.difficulty)
      const id = typeof qObj?.id === 'number' ? qObj.id : i + 1
      return { id, question: questionText, difficulty, category, expectedAnswer }
    })

    const result = { questions: normalizedQuestions }
    const check = responseSchema.safeParse(result)
    // Return normalized even if strict validation fails, to avoid 500s
    return NextResponse.json(check.success ? check.data : result)
  } catch (err: unknown) {
    return NextResponse.json({ error: getErrorMessage(err) || 'Failed to generate questions' }, { status: 500 })
  }
}

// Deduct 1 credit for generation
export const POST = requireCredits(1, 'TECH_Q', handler)
