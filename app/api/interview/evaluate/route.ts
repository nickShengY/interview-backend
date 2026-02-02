import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { ensureCredits, refundCredits } from '@/lib/credits'
import { GoogleGenAI } from '@google/genai'
import type { GenerateContentConfig } from '@google/genai'
import { resolveUserId } from '@/lib/firebase/auth-utils'
import { z } from 'zod'
import { zodToJsonSchema } from 'zod-to-json-schema'

const MICRO_REWARD = 5
const JACKPOT_REWARD = 100

const nativeConsole = globalThis.console

const DAILY_MICRO_REWARD_CAP = 25
const JACKPOT_COOLDOWN_DAYS = 7

type BehavioralSolution = {
  star: { situation: string; task: string; action: string; result: string }
  improvementTips: string[]
}

type TechnicalSolution = {
  idealAnswer: string
  keyPoints: string[]
  improvementTips: string[]
}

type Solution = BehavioralSolution | TechnicalSolution

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

const requestSchema = z.object({
  question: z.string().min(1),
  answer: z.string().min(1),
  type: z.enum(['technical', 'behavioral']),
  sessionId: z.string().optional().nullable(),
})

function extractKeywords(question: string) {
  const lowered = question.toLowerCase()
  const backtickMatches = Array.from(question.matchAll(/`([^`]+)`/g)).map((match) => match[1].toLowerCase())
  const emphasizedMatches = Array.from(question.matchAll(/\b([A-Z][a-zA-Z0-9+.#-]{2,})\b/g)).map((match) => match[1].toLowerCase())
  const commonTokens = lowered
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((token) => token.length > 3 && token !== 'question' && token !== 'explain')
  const all = [...backtickMatches, ...emphasizedMatches, ...commonTokens]
  return Array.from(new Set(all)).slice(0, 8)
}

function heuristicEvaluate(question: string, answer: string) {
  const trimmed = answer.trim().toLowerCase()
  if (trimmed.length < 40) return false
  const keywords = extractKeywords(question)
  if (!keywords.length) return trimmed.split(/\s+/).length > 12
  const matched = keywords.filter((keyword) => keyword && trimmed.includes(keyword))
  return matched.length >= Math.max(1, Math.floor(keywords.length / 4))
}

/**
 * Calculate dynamic reward probability based on user state
 * - Profit-focused (expected value < 5 credits per 5-question set)
 * - Performance-gated + soft boosts for low-credits / early users
 */
function calculateReward(userCredits: number, consecutiveLosses: number, totalSets: number, totalCorrect: number): number {
  if (totalCorrect <= 1) return 0

  if (totalSets === 0 && totalCorrect >= 3) return MICRO_REWARD

  if (consecutiveLosses >= 4 && totalCorrect >= 3) return MICRO_REWARD

  let microChance = 0
  let jackpotChance = 0

  if (totalCorrect === 2) {
    microChance = 0.10
  } else if (totalCorrect === 3) {
    microChance = 0.18
  } else if (totalCorrect === 4) {
    microChance = 0.26
    jackpotChance = 0.001
  } else {
    microChance = 0.32
    jackpotChance = 0.003
  }

  if (userCredits < 10) microChance += 0.05
  if (totalSets < 3) microChance += 0.05
  if (consecutiveLosses >= 2) microChance += 0.03
  if (userCredits >= 50) microChance = Math.max(0, microChance - 0.06)
  if (userCredits >= 150) microChance = Math.max(0, microChance - 0.08)

  microChance = Math.min(microChance, 0.60)
  if (totalCorrect < 5) jackpotChance = 0

  const roll = Math.random()
  if (roll < jackpotChance) return JACKPOT_REWARD
  if (roll < jackpotChance + microChance) return MICRO_REWARD
  return 0
}

export async function POST(req: NextRequest) {
  let userId: string | null = null
  let didDebit = false
  let txType: 'BEHAV_Q' | 'TECH_Q' = 'TECH_Q'

  try {
    // Resolve user ID - ensures user exists in database
    userId = await resolveUserId(req)
    if (!userId) throw new Error('User not found')

    const resolvedUserId = userId

    const parsedBody = requestSchema.safeParse(await req.json())
    if (!parsedBody.success) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
    }

    const { question, answer, type, sessionId } = parsedBody.data
    const isBehavioral = type === 'behavioral'
    const expectedSessionType = isBehavioral ? 'BEHAV' : 'TECH'

    // Deduct 1 credit per evaluated answer (dynamic tx type)
    txType = isBehavioral ? 'BEHAV_Q' : 'TECH_Q'

    const session = sessionId
      ? await prisma.interviewSession.findUnique({ where: { id: sessionId } })
      : null

    if (sessionId && !session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    if (session) {
      if (session.userId !== userId) {
        return NextResponse.json({ error: 'Session not found' }, { status: 404 })
      }
      if (session.type !== expectedSessionType) {
        return NextResponse.json({ error: 'Session type mismatch' }, { status: 400 })
      }
      if (session.completed || session.answeredCount >= session.totalQuestions) {
        return NextResponse.json({ error: 'Session already completed' }, { status: 409 })
      }
      const existing = await prisma.qA.findFirst({
        where: {
          sessionId: session.id,
          userId,
          question,
        },
        select: { id: true },
      })
      if (existing) {
        return NextResponse.json({ error: 'Question already answered' }, { status: 409 })
      }
    }

    await ensureCredits(userId, 1, txType)
    didDebit = true

    const apiKey = process.env.GOOGLE_API_KEY?.trim() || ''
    let verdict = false
    let usedFallback = false
    let solution: Solution = isBehavioral
      ? { star: { situation: '', task: '', action: '', result: '' }, improvementTips: [] as string[] }
      : { idealAnswer: '', keyPoints: [] as string[], improvementTips: [] as string[] }

    if (apiKey) {
      try {
        const ai = new GoogleGenAI({ apiKey })
        const model = process.env.GEMINI_SMALL_MODEL || 'gemini-2.5-flash-lite'

        const techSchema = z.object({
          verdict: z.enum(['correct','incorrect']),
          solution: z.object({
            idealAnswer: z.string(),
            keyPoints: z.array(z.string()).min(1),
            improvementTips: z.array(z.string()).min(1)
          })
        })
        const behavSchema = z.object({
          verdict: z.enum(['correct','incorrect']),
          solution: z.object({
            star: z.object({
              situation: z.string(),
              task: z.string(),
              action: z.string(),
              result: z.string()
            }),
            improvementTips: z.array(z.string()).min(1)
          })
        })
        const schema = isBehavioral ? behavSchema : techSchema

        const prompt = isBehavioral 
          ? `Evaluate this behavioral interview answer using STAR. Then provide an ideal STAR-form solution and concrete improvement tips.
Return ONLY JSON that matches the provided schema.

Question: ${question}

Answer: ${answer}`
          : `Evaluate if the answer is correct for the technical interview question. Then provide an ideal concise solution and key points with improvement tips.
Return ONLY JSON that matches the provided schema.

Question: ${question}

Answer: ${answer}`

        const result = await ai.models.generateContent({
          model,
          contents: prompt,
          config: (
            {
              responseMimeType: 'application/json',
              responseJsonSchema: zodToJsonSchema(schema),
            } satisfies Record<string, unknown>
          ) as unknown as GenerateContentConfig,
        })
        const text = result.text ?? ''
        const parsedJson: unknown = JSON.parse(text)
        const parsed = schema.safeParse(parsedJson)
        if (parsed.success) {
          verdict = parsed.data.verdict === 'correct'
          solution = parsed.data.solution
        } else {
          usedFallback = true
          verdict = heuristicEvaluate(question, answer)
          solution = isBehavioral
            ? { star: { situation: 'Describe the context', task: 'State the goal', action: 'Explain key actions', result: 'Quantify the outcome' }, improvementTips: ['Use STAR', 'Be specific', 'Quantify results'] }
            : { idealAnswer: 'Outline a correct and concise solution', keyPoints: ['Core concept', 'Key steps', 'Common pitfalls'], improvementTips: ['Address complexity', 'Compare trade-offs'] }
        }
      } catch (error: unknown) {
        nativeConsole.warn('AI evaluation failed, using heuristic fallback:', error)
        usedFallback = true
        verdict = heuristicEvaluate(question, answer)
        solution = isBehavioral
          ? { star: { situation: 'Describe the context', task: 'State the goal', action: 'Explain key actions', result: 'Quantify the outcome' }, improvementTips: ['Use STAR', 'Be specific', 'Quantify results'] }
          : { idealAnswer: 'Outline a correct and concise solution', keyPoints: ['Core concept', 'Key steps', 'Common pitfalls'], improvementTips: ['Address complexity', 'Compare trade-offs'] }
      }
    } else {
      usedFallback = true
      verdict = heuristicEvaluate(question, answer)
      solution = isBehavioral
        ? { star: { situation: 'Describe the context', task: 'State the goal', action: 'Explain key actions', result: 'Quantify the outcome' }, improvementTips: ['Use STAR', 'Be specific', 'Quantify results'] }
        : { idealAnswer: 'Outline a correct and concise solution', keyPoints: ['Core concept', 'Key steps', 'Common pitfalls'], improvementTips: ['Address complexity', 'Compare trade-offs'] }
    }

    const feedbackLabel = verdict ? 'Correct' : 'Incorrect'
    const feedback = usedFallback ? `${feedbackLabel} (fallback evaluation)` : feedbackLabel

    const updatedSession = await prisma.$transaction(async (tx) => {
      let activeSession = session
      if (!activeSession) {
        activeSession = await tx.interviewSession.create({
          data: {
            userId: resolvedUserId,
            type: expectedSessionType,
            totalQuestions: 5,
            answeredCount: 0,
            correctCount: 0,
          },
        })
      }

      const progressed = await tx.interviewSession.updateMany({
        where: {
          id: activeSession.id,
          userId: resolvedUserId,
          completed: false,
          answeredCount: { lt: activeSession.totalQuestions },
        },
        data: {
          answeredCount: { increment: 1 },
          correctCount: { increment: verdict ? 1 : 0 },
        },
      })

      if (progressed.count === 0) {
        throw new Error('Session already completed')
      }

      const existingInTx = await tx.qA.findFirst({
        where: {
          sessionId: activeSession.id,
          userId: resolvedUserId,
          question,
        },
        select: { id: true },
      })
      if (existingInTx) {
        throw new Error('Question already answered')
      }

      await tx.qA.create({
        data: {
          userId: resolvedUserId,
          kind: expectedSessionType,
          question,
          answer,
          feedback,
          sessionId: activeSession.id,
        },
      })

      const fresh = await tx.interviewSession.findUnique({
        where: { id: activeSession.id },
      })
      if (!fresh) throw new Error('Session not found')

      const completedNow = fresh.answeredCount >= fresh.totalQuestions
      if (completedNow && !fresh.completed) {
        return await tx.interviewSession.update({
          where: { id: fresh.id },
          data: { completed: true, completedAt: new Date() },
        })
      }

      return fresh
    })

    const newAnsweredCount = updatedSession.answeredCount
    const newCorrectCount = updatedSession.correctCount
    const isCompleted = updatedSession.answeredCount >= updatedSession.totalQuestions

    let rewardResult = null

    // Only award rewards after completing all 5 questions for TECH interviews
    if (isCompleted && !isBehavioral) {
      const user = await prisma.user.findUnique({ where: { id: userId }, select: { credits: true } })
      const progress = await prisma.userProgress.findUnique({
        where: { userId },
        select: { consecutiveLosses: true, totalQuestionSets: true }
      })

      const consecutiveLosses = progress?.consecutiveLosses ?? 0
      const totalSets = progress?.totalQuestionSets ?? 0

      let rewardAmount = calculateReward(
        user?.credits ?? 0,
        consecutiveLosses,
        totalSets,
        newCorrectCount
      )

      const now = new Date()
      const startOfToday = new Date(now)
      startOfToday.setHours(0, 0, 0, 0)

      const microEarnedTodayAgg = await prisma.transaction.aggregate({
        where: {
          userId,
          type: 'REWARD',
          createdAt: { gte: startOfToday },
          delta: { gt: 0, lt: JACKPOT_REWARD },
        },
        _sum: { delta: true },
      })
      const microEarnedToday = microEarnedTodayAgg._sum.delta ?? 0
      const microRemaining = Math.max(0, DAILY_MICRO_REWARD_CAP - microEarnedToday)

      if (rewardAmount === MICRO_REWARD && microRemaining < MICRO_REWARD) {
        rewardAmount = 0
      }

      if (rewardAmount === JACKPOT_REWARD) {
        const jackpotSince = new Date(now)
        jackpotSince.setDate(jackpotSince.getDate() - JACKPOT_COOLDOWN_DAYS)
        const recentJackpot = await prisma.transaction.findFirst({
          where: {
            userId,
            type: 'REWARD',
            delta: JACKPOT_REWARD,
            createdAt: { gte: jackpotSince },
          },
          select: { id: true },
        })

        if (recentJackpot) {
          rewardAmount = microRemaining >= MICRO_REWARD ? MICRO_REWARD : 0
        }
      }

      const rewardCommit = await prisma.$transaction(async (tx) => {
        const claim = await tx.interviewSession.updateMany({
          where: { id: updatedSession.id, rewardGiven: false },
          data: { rewardGiven: true, rewardAmount },
        })

        if (claim.count === 0) {
          const existing = await tx.interviewSession.findUnique({
            where: { id: updatedSession.id },
            select: { rewardAmount: true },
          })
          return { rewardAmount: existing?.rewardAmount ?? 0 }
        }

        if (rewardAmount > 0) {
          await tx.user.update({
            where: { id: resolvedUserId },
            data: { credits: { increment: rewardAmount } },
          })
          await tx.transaction.create({
            data: { userId: resolvedUserId, type: 'REWARD', delta: rewardAmount },
          })
        }

        if (rewardAmount > 0) {
          await tx.userProgress.upsert({
            where: { userId: resolvedUserId },
            create: {
              userId: resolvedUserId,
              lastRewardWon: now,
              totalRewardsWon: 1,
              consecutiveLosses: 0,
              totalQuestionSets: 1,
            },
            update: {
              lastRewardWon: now,
              totalRewardsWon: { increment: 1 },
              consecutiveLosses: 0,
              totalQuestionSets: { increment: 1 },
            },
          })
        } else {
          await tx.userProgress.upsert({
            where: { userId: resolvedUserId },
            create: {
              userId: resolvedUserId,
              consecutiveLosses: 1,
              totalQuestionSets: 1,
            },
            update: {
              consecutiveLosses: { increment: 1 },
              totalQuestionSets: { increment: 1 },
            },
          })
        }

        return { rewardAmount }
      })

      rewardResult = {
        completed: true,
        rewardAmount: rewardCommit.rewardAmount,
        totalCorrect: newCorrectCount,
        totalQuestions: updatedSession.totalQuestions
      }
    }

    return NextResponse.json({ 
      correct: verdict,
      solution,
      sessionId: updatedSession.id,
      answeredCount: newAnsweredCount,
      totalQuestions: updatedSession.totalQuestions,
      reward: rewardResult
    })
  } catch (err: unknown) {
    // Refund 1 credit on failure
    // Note: userId was resolved at the start of the handler, so we need to resolve again
    // This is safe because resolveUserId is idempotent
    try {
      if (didDebit && userId) {
        await refundCredits(userId, 1, txType)
      }
    } catch {
      // Ignore refund errors - user may not exist or other issues
    }

    const message = getErrorMessage(err) || 'Evaluation failed'
    const status = message === 'Insufficient credits'
      ? 402
      : message === 'Invalid request'
        ? 400
        : message === 'Session not found'
          ? 404
          : message === 'Session already completed' || message === 'Question already answered' || message === 'Session type mismatch'
            ? 409
            : 500
    return NextResponse.json({ error: message }, { status })
  }
}
