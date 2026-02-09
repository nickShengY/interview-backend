import { NextRequest, NextResponse } from 'next/server'
import { requireCredits } from '@/lib/requireCredits'
import { generateStructuredOutput } from '@/lib/llm/openrouter'
import { z } from 'zod'
import { zodToJsonSchema } from 'zod-to-json-schema'

async function handler(req: NextRequest, _userId: string) {
  void _userId
  try {
    const { headline, summary, experience, targetRole } = await req.json()
    const key = process.env.OPENROUTER_API_KEY
    if (!key) return NextResponse.json({ error: 'Missing OPENROUTER_API_KEY' }, { status: 500 })

    const responseSchema = z.object({
      overallScore: z.number().min(0).max(100),
      headlineAnalysis: z.object({
        score: z.number().min(0).max(100),
        current: z.string(),
        suggestions: z.array(z.string()).min(2).max(4),
        optimized: z.string(),
      }),
      summaryAnalysis: z.object({
        score: z.number().min(0).max(100),
        strengths: z.array(z.string()),
        improvements: z.array(z.string()),
        optimizedSummary: z.string(),
      }),
      keywordOptimization: z.object({
        missingKeywords: z.array(z.string()),
        strongKeywords: z.array(z.string()),
        recommendedSkills: z.array(z.string()),
      }),
      sectionRecommendations: z.array(z.object({
        section: z.string(),
        priority: z.enum(['High', 'Medium', 'Low']),
        recommendation: z.string(),
      })),
      networkingTips: z.array(z.string()).min(3).max(5),
      contentIdeas: z.array(z.object({
        topic: z.string(),
        format: z.string(),
        reason: z.string(),
      })).min(3).max(5),
    })

    const prompt = `You are a LinkedIn optimization expert and personal branding strategist.

Analyze and optimize this LinkedIn profile for a ${targetRole || 'professional'} role:

Current Headline: ${headline || 'Not provided'}
Current Summary/About: ${summary || 'Not provided'}
Experience Summary: ${experience || 'Not provided'}
Target Role: ${targetRole || 'Not specified'}

Provide:
1. Overall profile score (0-100)
2. Headline analysis with optimized version
3. Summary/About analysis with optimized version
4. Keyword optimization (missing, strong, recommended)
5. Section-by-section recommendations with priority
6. Networking tips
7. Content ideas for thought leadership

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
    const message = err instanceof Error ? err.message : 'Failed to optimize LinkedIn profile'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export const POST = requireCredits(1, 'TECH_Q', handler)
