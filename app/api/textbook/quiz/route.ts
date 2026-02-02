import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireCredits } from '@/lib/requireCredits'
import { GoogleGenAI } from '@google/genai'
import type { GenerateContentConfig } from '@google/genai'
import { z } from 'zod'
import { zodToJsonSchema } from 'zod-to-json-schema'

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

async function handler(req: NextRequest, userId: string) {
  try {
    const { textbookId } = await req.json()

    if (!textbookId) {
      return NextResponse.json({ error: 'Textbook ID required' }, { status: 400 })
    }

    // Verify ownership
    const textbook = await prisma.textbook.findFirst({
      where: { id: textbookId, userId },
    })

    if (!textbook) {
      return NextResponse.json({ error: 'Textbook not found' }, { status: 404 })
    }

    // Generate quiz using AI
    const apiKey = process.env.GOOGLE_API_KEY?.trim()
    if (!apiKey) {
      return NextResponse.json({ error: 'AI service not configured' }, { status: 500 })
    }

    const ai = new GoogleGenAI({ apiKey })
    const model = process.env.GEMINI_SMALL_MODEL || 'gemini-2.5-flash-lite'

    const quizSchema = z.object({
      title: z.string(),
      questions: z.array(z.object({
        question: z.string(),
        options: z.array(z.string()),
        correctAnswer: z.string(),
        explanation: z.string(),
      })),
    })

    const contentPreview = textbook.content.substring(0, 4000)
    const prompt = `Generate a quiz with 5-10 multiple choice questions from this textbook content.
Each question should have 4 options (A, B, C, D), the correct answer, and an explanation.

Content:
${contentPreview}

Return JSON in this format: {"title": "Quiz Title", "questions": [{"question": "...", "options": ["A", "B", "C", "D"], "correctAnswer": "A", "explanation": "..."}]}`

    const configWithSchema = {
      responseMimeType: 'application/json',
      responseJsonSchema: zodToJsonSchema(quizSchema),
    } satisfies Record<string, unknown>

    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: configWithSchema as unknown as GenerateContentConfig,
    })

    const parsed = JSON.parse(response.text ?? '{"title":"Quiz","questions":[]}')
    const quizData = parsed

    // Create quiz
    const quiz = await prisma.quiz.create({
      data: {
        userId,
        textbookId,
        title: quizData.title || `${textbook.title} Quiz`,
        totalQuestions: quizData.questions?.length || 0,
      },
    })

    // Create quiz questions
    const questions = quizData.questions || []
    for (let i = 0; i < questions.length; i++) {
      await prisma.quizQuestion.create({
        data: {
          quizId: quiz.id,
          question: questions[i].question,
          options: questions[i].options || [],
          correctAnswer: questions[i].correctAnswer,
          explanation: questions[i].explanation,
          orderIndex: i,
        },
      })
    }

    // Fetch complete quiz with questions
    const completeQuiz = await prisma.quiz.findUnique({
      where: { id: quiz.id },
      include: {
        questions: {
          orderBy: { orderIndex: 'asc' },
        },
      },
    })

    return NextResponse.json({ quiz: completeQuiz })
  } catch (error: unknown) {
    nativeConsole.error('Quiz generation failed:', error)
    return NextResponse.json({ error: getErrorMessage(error) || 'Failed to generate quiz' }, { status: 500 })
  }
}

// Deduct 5 credits for quiz generation
export const POST = requireCredits(5, 'TEXTBOOK_GENERATE_QUIZ', handler)
