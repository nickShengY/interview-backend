import { NextRequest, NextResponse } from 'next/server'
import { requireCredits } from '@/lib/requireCredits'
import { generateStructuredOutput } from '@/lib/llm/openrouter'
import { z } from 'zod'
import { zodToJsonSchema } from 'zod-to-json-schema'

async function handler(req: NextRequest, _userId: string) {
  void _userId
  try {
    const { currentRole, targetRole, currentSkills, yearsExperience, timeline } = await req.json()
    const key = process.env.OPENROUTER_API_KEY
    if (!key) return NextResponse.json({ error: 'Missing OPENROUTER_API_KEY' }, { status: 500 })

    const responseSchema = z.object({
      roadmap: z.object({
        title: z.string(),
        estimatedTimeline: z.string(),
        phases: z.array(z.object({
          phase: z.number(),
          title: z.string(),
          duration: z.string(),
          description: z.string(),
          skills: z.array(z.object({
            name: z.string(),
            priority: z.enum(['Critical', 'Important', 'Nice-to-have']),
            resources: z.array(z.string()),
          })),
          milestones: z.array(z.string()),
          projects: z.array(z.string()),
        })),
      }),
      skillGap: z.object({
        currentStrengths: z.array(z.string()),
        criticalGaps: z.array(z.object({
          skill: z.string(),
          importance: z.string(),
          learningPath: z.string(),
          estimatedTime: z.string(),
        })),
        matchPercentage: z.number().min(0).max(100),
      }),
      certifications: z.array(z.object({
        name: z.string(),
        provider: z.string(),
        difficulty: z.string(),
        estimatedTime: z.string(),
        value: z.string(),
      })),
      salaryProgression: z.array(z.object({
        stage: z.string(),
        expectedRange: z.string(),
        timeframe: z.string(),
      })),
      actionItems: z.array(z.object({
        week: z.string(),
        action: z.string(),
        details: z.string(),
      })).min(5).max(10),
    })

    const prompt = `You are an expert career strategist and professional development coach.

Create a comprehensive career roadmap for:
- Current Role: ${currentRole || 'Not specified'}
- Target Role: ${targetRole || 'Not specified'}
- Current Skills: ${currentSkills || 'Not specified'}
- Years of Experience: ${yearsExperience || 'Not specified'}
- Desired Timeline: ${timeline || '6-12 months'}

Provide:
1. A phased roadmap with specific skills, milestones, and projects for each phase
2. Skill gap analysis (current strengths, critical gaps with learning paths)
3. Relevant certifications with provider, difficulty, time, and value
4. Expected salary progression at each stage
5. Immediate action items for the first weeks

Be realistic and specific. Include actual course names, platforms, and concrete project ideas.

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
    const message = err instanceof Error ? err.message : 'Failed to generate career roadmap'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export const POST = requireCredits(1, 'TECH_Q', handler)
