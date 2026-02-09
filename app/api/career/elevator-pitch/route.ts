import { NextRequest, NextResponse } from 'next/server'
import { requireCredits } from '@/lib/requireCredits'
import { generateStructuredOutput } from '@/lib/llm/openrouter'
import { z } from 'zod'
import { zodToJsonSchema } from 'zod-to-json-schema'

async function handler(req: NextRequest, _userId: string) {
  void _userId
  try {
    const { name, currentRole, targetRole, skills, uniqueValue, industry } = await req.json()
    const key = process.env.OPENROUTER_API_KEY
    if (!key) return NextResponse.json({ error: 'Missing OPENROUTER_API_KEY' }, { status: 500 })

    const responseSchema = z.object({
      pitches: z.array(z.object({
        type: z.string(),
        duration: z.string(),
        pitch: z.string(),
        wordCount: z.number(),
      })).min(3).max(4),
      keyElements: z.object({
        hook: z.string(),
        valueProposition: z.string(),
        proof: z.string(),
        callToAction: z.string(),
      }),
      deliveryTips: z.array(z.string()).min(4).max(6),
      commonPitfalls: z.array(z.string()).min(3).max(5),
      adaptations: z.array(z.object({
        context: z.string(),
        modification: z.string(),
      })).min(3).max(5),
    })

    const prompt = `You are a personal branding and communication expert.

Generate elevator pitches for:
- Name: ${name || 'the candidate'}
- Current Role: ${currentRole || 'Not specified'}
- Target Role: ${targetRole || 'Not specified'}
- Key Skills: ${skills || 'Not specified'}
- Unique Value: ${uniqueValue || 'Not specified'}
- Industry: ${industry || 'Not specified'}

Create:
1. Multiple pitch versions (15-sec, 30-sec, 60-sec, networking event)
2. Key elements breakdown (hook, value proposition, proof, call to action)
3. Delivery tips for confidence and impact
4. Common pitfalls to avoid
5. Context-specific adaptations (career fair, interview, LinkedIn message, cold email, coffee chat)

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
    const message = err instanceof Error ? err.message : 'Failed to generate elevator pitch'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export const POST = requireCredits(1, 'TECH_Q', handler)
