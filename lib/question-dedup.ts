import { prisma } from './prisma'
import { GeneratedQuestion } from '@prisma/client'

/**
 * Store generated question to avoid duplicates
 */
export async function storeGeneratedQuestion(
  userId: string,
  questionType: 'TECH' | 'BEHAV',
  question: string,
  metadata: {
    difficulty?: string
    category?: string
    industry?: string
    jobTitle?: string
    focus?: string
  }
): Promise<void> {
  await prisma.generatedQuestion.create({
    data: {
      userId,
      questionType,
      question,
      difficulty: metadata.difficulty,
      category: metadata.category,
      industry: metadata.industry,
      jobTitle: metadata.jobTitle,
      focus: metadata.focus,
    },
  })
}

/**
 * Check if user has seen similar questions recently (last 30 days)
 * Returns true if question is too similar to recent ones
 */
export async function isDuplicateQuestion(
  userId: string,
  questionType: 'TECH' | 'BEHAV',
  newQuestion: string
): Promise<boolean> {
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const recentQuestions = await prisma.generatedQuestion.findMany({
    where: {
      userId,
      questionType,
      createdAt: {
        gte: thirtyDaysAgo,
      },
    },
    select: {
      question: true,
    },
  })

  // Simple similarity check: if exact match or very high word overlap
  const newQuestionWords = new Set(
    newQuestion
      .toLowerCase()
      .split(/\s+/)
      .filter(Boolean)
  )
  
  for (const existingQ of recentQuestions) {
    const existingWords = new Set(
      existingQ.question
        .toLowerCase()
        .split(/\s+/)
        .filter(Boolean)
    )
    
    // Calculate Jaccard similarity
    const intersection = new Set([...newQuestionWords].filter(x => existingWords.has(x)))
    const union = new Set([...newQuestionWords, ...existingWords])
    const similarity = union.size === 0 ? 0 : intersection.size / union.size
    
    // If >70% similar, consider it a duplicate
    if (similarity > 0.7) {
      return true
    }
  }

  return false
}

/**
 * Filter out duplicate questions from a list
 */
export async function filterDuplicateQuestions(
  userId: string,
  questionType: 'TECH' | 'BEHAV',
  questions: string[]
): Promise<string[]> {
  const uniqueQuestions: string[] = []
  
  for (const question of questions) {
    const isDup = await isDuplicateQuestion(userId, questionType, question)
    if (!isDup) {
      uniqueQuestions.push(question)
    }
  }
  
  return uniqueQuestions
}

/**
 * Get user's question history
 */
export async function getUserQuestionHistory(
  userId: string,
  questionType?: 'TECH' | 'BEHAV',
  limit: number = 50
): Promise<GeneratedQuestion[]> {
  return prisma.generatedQuestion.findMany({
    where: {
      userId,
      ...(questionType && { questionType }),
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: limit,
  })
}
