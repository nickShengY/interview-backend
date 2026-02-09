import { NextRequest, NextResponse } from 'next/server'
import { requireCredits } from '@/lib/requireCredits'
import { generateStructuredOutput } from '@/lib/llm/openrouter'
import { z } from 'zod'
import { zodToJsonSchema } from 'zod-to-json-schema'

async function handler(req: NextRequest, _userId: string) {
  void _userId
  try {
    const { jobTitle, industry, experienceLevel, currentSalary, targetSalary, location } = await req.json()
    const key = process.env.OPENROUTER_API_KEY
    if (!key) return NextResponse.json({ error: 'Missing OPENROUTER_API_KEY' }, { status: 500 })

    const responseSchema = z.object({
      marketData: z.object({
        lowRange: z.number(),
        median: z.number(),
        highRange: z.number(),
        currency: z.string(),
      }),
      scripts: z.array(z.object({
        scenario: z.string(),
        script: z.string(),
        tips: z.array(z.string()),
      })).min(3).max(5),
      counterOfferStrategies: z.array(z.object({
        strategy: z.string(),
        explanation: z.string(),
        examplePhrase: z.string(),
      })).min(3).max(5),
      negotiationTimeline: z.array(z.object({
        step: z.number(),
        action: z.string(),
        timing: z.string(),
        details: z.string(),
      })),
      commonMistakes: z.array(z.string()).min(3).max(5),
      benefits: z.array(z.object({
        benefit: z.string(),
        negotiationTip: z.string(),
      })).min(3).max(5),
    })

    const prompt = `You are an expert salary negotiation coach and career advisor.

Provide comprehensive salary negotiation guidance for:
- Job Title: ${jobTitle}
- Industry: ${industry}
- Experience Level: ${experienceLevel}
- Current Salary: ${currentSalary || 'Not provided'}
- Target Salary: ${targetSalary || 'Not provided'}
- Location: ${location || 'Not provided'}

Include:
1. Realistic market salary data (low, median, high ranges in USD)
2. 3-5 negotiation scripts for different scenarios (initial offer, counter-offer, competing offers, etc.)
3. Counter-offer strategies with example phrases
4. A step-by-step negotiation timeline
5. Common mistakes to avoid
6. Non-salary benefits to negotiate with tips

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
    const message = err instanceof Error ? err.message : 'Failed to generate salary negotiation advice'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export const POST = requireCredits(1, 'TECH_Q', handler)
