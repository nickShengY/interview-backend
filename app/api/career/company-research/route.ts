import { NextRequest, NextResponse } from 'next/server'
import { requireCredits } from '@/lib/requireCredits'
import { generateStructuredOutput } from '@/lib/llm/openrouter'
import { z } from 'zod'
import { zodToJsonSchema } from 'zod-to-json-schema'

async function handler(req: NextRequest, _userId: string) {
  void _userId
  try {
    const { companyName, role, industry } = await req.json()
    const key = process.env.OPENROUTER_API_KEY
    if (!key) return NextResponse.json({ error: 'Missing OPENROUTER_API_KEY' }, { status: 500 })

    const responseSchema = z.object({
      companyOverview: z.object({
        description: z.string(),
        industry: z.string(),
        size: z.string(),
        culture: z.string(),
        values: z.array(z.string()),
      }),
      interviewProcess: z.object({
        stages: z.array(z.object({
          stage: z.string(),
          description: z.string(),
          duration: z.string(),
          tips: z.array(z.string()),
        })),
        averageDuration: z.string(),
        difficulty: z.string(),
      }),
      commonQuestions: z.array(z.object({
        question: z.string(),
        category: z.string(),
        sampleAnswer: z.string(),
      })).min(5).max(8),
      cultureInsights: z.array(z.object({
        aspect: z.string(),
        detail: z.string(),
        howToDemonstrate: z.string(),
      })).min(3).max(5),
      talkingPoints: z.array(z.string()).min(4).max(6),
      questionsToAsk: z.array(z.object({
        question: z.string(),
        whyItWorks: z.string(),
      })).min(4).max(6),
    })

    const prompt = `You are a career research expert with deep knowledge of company cultures and interview processes.

Research and provide comprehensive interview preparation insights for:
- Company: ${companyName}
- Target Role: ${role || 'General'}
- Industry: ${industry || 'Not specified'}

Provide:
1. Company overview (description, industry, size, culture, values)
2. Interview process (stages, duration, difficulty)
3. 5-8 common interview questions with sample answers
4. Culture insights with how to demonstrate alignment
5. Key talking points to impress
6. Smart questions to ask the interviewer

Base your analysis on widely known information about ${companyName}'s hiring practices, culture, and values. If the company is not well-known, provide industry-typical insights.

Return JSON matching the provided schema.`

    const payload = await generateStructuredOutput<z.infer<typeof responseSchema>>({
      prompt,
      schema: zodToJsonSchema(responseSchema) as Record<string, unknown>,
    })

    const parsed = responseSchema.safeParse(payload)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Model returned invalid response' }, { status: 500 })
    }

    return NextResponse.json(parsed.data)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to research company'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export const POST = requireCredits(1, 'TECH_Q', handler)
