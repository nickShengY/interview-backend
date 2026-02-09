import { NextRequest, NextResponse } from 'next/server'
import { requireCredits } from '@/lib/requireCredits'
import { generateStructuredOutput } from '@/lib/llm/openrouter'
import { z } from 'zod'
import { zodToJsonSchema } from 'zod-to-json-schema'

async function handler(req: NextRequest, _userId: string) {
  void _userId
  try {
    const { emailType, recipientRole, recipientCompany, context, yourBackground } = await req.json()
    const key = process.env.OPENROUTER_API_KEY
    if (!key) return NextResponse.json({ error: 'Missing OPENROUTER_API_KEY' }, { status: 500 })

    const responseSchema = z.object({
      emails: z.array(z.object({
        tone: z.string(),
        subject: z.string(),
        body: z.string(),
        tips: z.array(z.string()),
      })).min(2).max(3),
      bestPractices: z.array(z.string()).min(3).max(5),
      followUpSchedule: z.array(z.object({
        day: z.number(),
        action: z.string(),
        template: z.string(),
      })).min(2).max(4),
    })

    const prompt = `You are a professional networking and career communication expert.

Generate networking emails for:
- Email Type: ${emailType} (e.g., cold outreach, follow-up after interview, thank you, informational interview request, referral request, reconnecting)
- Recipient Role: ${recipientRole || 'Not specified'}
- Recipient Company: ${recipientCompany || 'Not specified'}
- Context: ${context || 'Not specified'}
- Your Background: ${yourBackground || 'Not specified'}

Create:
1. 2-3 email versions with different tones (professional, warm, concise)
2. Best practices for this type of email
3. Follow-up schedule with templates

Make emails authentic, not generic. They should feel personal and show genuine interest.

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
    const message = err instanceof Error ? err.message : 'Failed to generate networking email'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export const POST = requireCredits(1, 'TECH_Q', handler)
