import { GoogleGenAI } from '@google/genai'
import type { GenerateContentConfig } from '@google/genai'
import type { GenerateContentParameters } from '@google/genai'
import { z } from 'zod'
import { zodToJsonSchema } from 'zod-to-json-schema'

const CHUNK_SIZE = 6000 // Characters per chunk for processing
const MAX_CHUNKS = 20 // Maximum chunks to process (120k chars total)

const nativeConsole = globalThis.console

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

// Schemas for structured outputs
export const ChapterSchema = z.object({
  chapters: z.array(z.object({
    title: z.string().describe('Chapter or section title'),
    summary: z.string().describe('Concise summary of main concepts'),
    // Gemini sometimes omits these arrays; treat them as optional with sensible defaults
    keyPoints: z.array(z.string()).describe('3-5 key points from this section').optional().default([]),
    concepts: z.array(z.string()).describe('Important concepts/terms introduced').optional().default([]),
    startIndex: z.number().optional().describe('Approximate position in content'),
  })),
})

export const FlashcardChunkSchema = z.object({
  flashcards: z.array(z.object({
    front: z.string().describe('Clear question or prompt'),
    back: z.string().describe('Comprehensive answer'),
    keyTerms: z.array(z.string()).describe('Key vocabulary from this concept'),
    mnemonic: z.string().optional().describe('Memory aid if applicable'),
    difficulty: z.enum(['basic', 'intermediate', 'advanced']).describe('Concept difficulty'),
    category: z.string().describe('Topic category for interleaving'),
  })),
})

export const QuizChunkSchema = z.object({
  questions: z.array(z.object({
    question: z.string().describe('Clear, specific question'),
    options: z.array(z.string()).min(4).max(4).describe('Exactly 4 answer options'),
    correctAnswer: z.string().describe('The correct option (A, B, C, or D)'),
    explanation: z.string().describe('Why this answer is correct'),
    concept: z.string().describe('The concept being tested'),
    difficulty: z.enum(['easy', 'medium', 'hard']).describe('Question difficulty'),
  })),
})

export const FeynmanEvalSchema = z.object({
  score: z.number().min(0).max(100).describe('Understanding score 0-100'),
  understood: z.array(z.string()).describe('Concepts correctly explained'),
  misunderstood: z.array(z.string()).describe('Concepts explained incorrectly'),
  missing: z.array(z.string()).describe('Important concepts not mentioned'),
  feedback: z.string().describe('Specific feedback to improve understanding'),
  simpleExplanation: z.string().describe('How an expert would explain this simply'),
})

/**
 * Split content into overlapping chunks for better context
 */
export function splitIntoChunks(content: string, chunkSize = CHUNK_SIZE): string[] {
  const chunks: string[] = []
  let start = 0
  const overlap = Math.floor(chunkSize * 0.1) // 10% overlap for context

  while (start < content.length && chunks.length < MAX_CHUNKS) {
    const end = Math.min(start + chunkSize, content.length)
    chunks.push(content.slice(start, end))
    start = end - overlap
    if (end >= content.length) break
  }

  return chunks
}

/**
 * Multi-agent analyzer: Orchestrates multiple specialized AI calls
 */
export class TextbookAnalyzer {
  private ai: GoogleGenAI
  private model: string

  constructor(apiKey: string) {
    this.ai = new GoogleGenAI({ apiKey })
    this.model = process.env.GEMINI_SMALL_MODEL || 'gemini-2.5-flash-lite'
  }

  private async generateContentWithRetry(
    request: GenerateContentParameters,
    options?: { maxRetries?: number; initialDelayMs?: number; backoffFactor?: number },
  ) {
    const maxRetries = options?.maxRetries ?? 2
    let delay = options?.initialDelayMs ?? 3000
    const backoffFactor = options?.backoffFactor ?? 2

    let attempt = 0

    for (;;) {
      try {
        return await this.ai.models.generateContent(request)
      } catch (err: unknown) {
        const statusRaw = isRecord(err)
          ? (err.status ?? err.code ?? (isRecord(err.error) ? err.error.status : undefined))
          : undefined
        const status = typeof statusRaw === 'number' || typeof statusRaw === 'string'
          ? Number(statusRaw)
          : undefined
        const message = getErrorMessage(err)
        const is429 =
          status === 429 ||
          message.includes('429') ||
          message.toLowerCase().includes('too many requests')

        if (!is429 || attempt >= maxRetries) {
          throw err
        }

        attempt += 1
        nativeConsole.warn(
          `Gemini 429 Too Many Requests. Retry ${attempt}/${maxRetries} after ${delay}ms`,
        )
        await new Promise((resolve) => setTimeout(resolve, delay))
        delay = Math.round(delay * backoffFactor)
      }
    }
  }

  /**
   * Agent 1: Analyze structure and extract chapters
   */
  async analyzeStructure(content: string): Promise<z.infer<typeof ChapterSchema>> {
    // For structure analysis, use more content
    const preview = content.substring(0, 15000)
    
    const prompt = `You are an expert textbook analyst. Analyze this educational content and identify its main sections/chapters.

For each chapter:
1. Give it a descriptive title
2. Summarize the main ideas (2-3 sentences)
3. List 3-5 key points
4. Extract important concepts/terms introduced

Content:
${preview}

If the content continues beyond this preview, extrapolate likely additional chapters based on the structure.`

    const response = await this.generateContentWithRetry({
      model: this.model,
      contents: prompt,
      config: (
        {
          responseMimeType: 'application/json',
          responseJsonSchema: zodToJsonSchema(ChapterSchema),
        } satisfies Record<string, unknown>
      ) as unknown as GenerateContentConfig,
    })

    const raw = (response.text || '').trim()
    if (!raw) {
      return { chapters: [] }
    }

    let parsed: unknown
    try {
      parsed = JSON.parse(raw) as unknown
    } catch (err: unknown) {
      nativeConsole.warn('Failed to parse chapter structure JSON:', err)
      return { chapters: [] }
    }

    // Gemini may occasionally return a bare array instead of { chapters: [...] }
    let normalized: unknown
    if (Array.isArray(parsed)) {
      normalized = { chapters: parsed }
    } else if (isRecord(parsed)) {
      if (Array.isArray(parsed.chapters)) {
        normalized = parsed
      } else if (Array.isArray(parsed.sections)) {
        // Gracefully accept an alternate property name
        normalized = { chapters: parsed.sections }
      } else {
        // Last resort: treat the whole object as a single chapter-like entry
        normalized = { chapters: [parsed] }
      }
    } else {
      return { chapters: [] }
    }

    return ChapterSchema.parse(normalized)
  }

  /**
   * Agent 2: Generate flashcards from a chunk
   */
  async generateFlashcardsFromChunk(
    chunk: string,
    chunkIndex: number,
    context: string
  ): Promise<z.infer<typeof FlashcardChunkSchema>> {
    const prompt = `You are an expert learning scientist using evidence-based learning techniques.

Generate 5-8 high-quality flashcards from this content using these principles:
- **Active Recall**: Questions that require retrieval, not recognition
- **Elaborative Interrogation**: "Why?" and "How?" questions
- **Concrete Examples**: Include specific examples when helpful
- **Dual Coding**: Describe visual/spatial relationships when relevant

Context (overall topic): ${context}

Content chunk ${chunkIndex + 1}:
${chunk}

Create flashcards that:
1. Test understanding, not just memorization
2. Include key vocabulary with definitions
3. Add mnemonics for complex concepts (acronyms, rhymes, imagery)
4. Vary difficulty levels`

    const response = await this.generateContentWithRetry({
      model: this.model,
      contents: prompt,
      config: (
        {
          responseMimeType: 'application/json',
          responseJsonSchema: zodToJsonSchema(FlashcardChunkSchema),
        } satisfies Record<string, unknown>
      ) as unknown as GenerateContentConfig,
    })

    const rawText = response.text ?? '{"flashcards":[]}'

    let raw: unknown
    try {
      raw = JSON.parse(rawText) as unknown
    } catch (err: unknown) {
      nativeConsole.warn('Flashcard JSON parse failed for chunk', chunkIndex, err)
      // Second chance: sometimes the model emits invalid escape sequences.
      try {
        const repairedText = rawText.replace(/\\(?!["\\/bfnrtu])/g, '')
        raw = JSON.parse(repairedText) as unknown
      } catch (err2: unknown) {
        nativeConsole.warn('Flashcard JSON repair also failed for chunk', chunkIndex, err2)
        return { flashcards: [] }
      }
    }

    const normalizedForSchema = Array.isArray(raw) ? { flashcards: raw } : raw

    const parsed = FlashcardChunkSchema.safeParse(normalizedForSchema)
    if (parsed.success) {
      return parsed.data
    }

    nativeConsole.warn('Flashcard schema validation failed for chunk', chunkIndex, parsed.error.issues)

    // Best-effort recovery: try to coerce whatever structure we received into valid flashcards.
    // Gemini sometimes returns a bare array instead of { flashcards: [...] }.
    const source: unknown = normalizedForSchema
    const candidates = isRecord(source) && Array.isArray(source.flashcards)
      ? source.flashcards
      : Array.isArray(source)
        ? source
        : []

    const takeStringField = (obj: unknown, keys: string[]): string => {
      const record = isRecord(obj) ? obj : null
      for (const key of keys) {
        const val = record?.[key]
        if (typeof val === 'string' && val.trim()) return val.trim()
      }
      return ''
    }

    const takeStringArrayField = (obj: unknown, keys: string[]): string[] => {
      const record = isRecord(obj) ? obj : null
      for (const key of keys) {
        const val = record?.[key]
        if (Array.isArray(val)) {
          const arr = val.map((v: unknown) => String(v).trim()).filter(Boolean)
          if (arr.length) return arr
        }
      }
      return []
    }

    const recovered = candidates
      .map((card: unknown): {
        front: string
        back: string
        keyTerms: string[]
        mnemonic: string | undefined
        difficulty: 'basic' | 'intermediate' | 'advanced'
        category: string
      } | null => {
        const front = takeStringField(card, [
          'front',
          'question',
          'q',
          'prompt',
          'term',
          'title',
        ])

        const back = takeStringField(card, [
          'back',
          'answer',
          'a',
          'definition',
          'explanation',
          'response',
          'content',
        ])

        if (!front || !back) return null

        const keyTerms = takeStringArrayField(card, [
          'keyTerms',
          'key_terms',
          'keywords',
          'tags',
          'concepts',
        ])

        const mnemonicCandidate = takeStringField(card, [
          'mnemonic',
          'memoryAid',
          'hint',
        ])

        const difficultyRaw = takeStringField(card, ['difficulty', 'level'])
        const difficulty: 'basic' | 'intermediate' | 'advanced' =
          difficultyRaw === 'intermediate'
            ? 'intermediate'
            : difficultyRaw === 'advanced'
              ? 'advanced'
              : 'basic'

        const category =
          takeStringField(card, ['category', 'topic', 'section', 'chapter']) || 'General'

        return {
          front,
          back,
          keyTerms,
          mnemonic: mnemonicCandidate || undefined,
          difficulty,
          category,
        }
      })
      .filter((value): value is Exclude<typeof value, null> => value !== null)

    return { flashcards: recovered }
  }

  /**
   * Agent 3: Generate quiz questions from a chunk
   */
  async generateQuizFromChunk(
    chunk: string,
    chunkIndex: number,
    context: string
  ): Promise<z.infer<typeof QuizChunkSchema>> {
    const prompt = `You are an expert test creator. Generate 3-5 high-quality multiple choice questions from this content.

Guidelines:
- Create questions at different difficulty levels (easy, medium, hard)
- Include questions that test application, not just recall
- Make distractors (wrong answers) plausible but clearly incorrect
- Provide clear explanations for why the correct answer is right

Context (overall topic): ${context}

Content chunk ${chunkIndex + 1}:
${chunk}

Create questions that test:
1. Key concepts and definitions
2. Relationships between ideas
3. Application to scenarios
4. Critical analysis`

    const response = await this.generateContentWithRetry({
      model: this.model,
      contents: prompt,
      config: (
        {
          responseMimeType: 'application/json',
          responseJsonSchema: zodToJsonSchema(QuizChunkSchema),
        } satisfies Record<string, unknown>
      ) as unknown as GenerateContentConfig,
    })

    const rawText = response.text ?? '{"questions":[]}'

    let raw: unknown
    try {
      raw = JSON.parse(rawText) as unknown
    } catch (err: unknown) {
      nativeConsole.warn('Quiz JSON parse failed for chunk', chunkIndex, err)
      // Second chance: sometimes the model emits invalid escape sequences.
      try {
        const repairedText = rawText.replace(/\\(?!["\\/bfnrtu])/g, '')
        raw = JSON.parse(repairedText) as unknown
      } catch (err2: unknown) {
        nativeConsole.warn('Quiz JSON repair also failed for chunk', chunkIndex, err2)
        return { questions: [] }
      }
    }

    const normalizedForSchema = Array.isArray(raw) ? { questions: raw } : raw

    const parsed = QuizChunkSchema.safeParse(normalizedForSchema)
    if (parsed.success) {
      return parsed.data
    }

    nativeConsole.warn('Quiz schema validation failed for chunk', chunkIndex, parsed.error.issues)

    // Best-effort recovery: coerce loosely structured output into valid quiz questions
    const source: unknown = normalizedForSchema
    const candidates = isRecord(source) && Array.isArray(source.questions)
      ? source.questions
      : Array.isArray(source)
        ? source
        : []

    const takeStringField = (obj: unknown, keys: string[]): string => {
      const record = isRecord(obj) ? obj : null
      for (const key of keys) {
        const val = record?.[key]
        if (typeof val === 'string' && val.trim()) return val.trim()
      }
      return ''
    }

    const takeStringArrayField = (obj: unknown, keys: string[]): string[] => {
      const record = isRecord(obj) ? obj : null
      for (const key of keys) {
        const val = record?.[key]
        if (Array.isArray(val)) {
          const arr = val.map((v: unknown) => String(v).trim()).filter(Boolean)
          if (arr.length >= 2) return arr
        }
      }
      return []
    }

    const recovered = candidates
      .map((q: unknown) => {
        const qRecord = isRecord(q) ? q : null
        const question = takeStringField(q, ['question', 'prompt', 'q', 'text', 'stem'])
        if (!question) return null

        const optionsRaw = takeStringArrayField(q, ['options', 'choices', 'answers', 'alternatives'])
        if (optionsRaw.length < 2) return null

        const trimmedOptions = optionsRaw.slice(0, 4)

        const explanation = takeStringField(q, ['explanation', 'rationale', 'reason', 'feedback'])

        // Determine correct answer label (A/B/C/D) from various possible hints
        let correctAnswer = takeStringField(q, ['correctAnswer'])

        if (!correctAnswer) {
          const answerText = takeStringField(q, ['answer', 'correct', 'correctOption'])
          if (answerText) {
            const idx = trimmedOptions.findIndex((opt) => opt.toLowerCase() === answerText.toLowerCase())
            if (idx >= 0 && idx < 4) {
              correctAnswer = String.fromCharCode('A'.charCodeAt(0) + idx)
            }
          }
        }

        if (!correctAnswer) {
          const indexLike = qRecord
            ? (qRecord.correctIndex ?? qRecord.answerIndex ?? qRecord.correctOptionIndex)
            : undefined
          if (typeof indexLike === 'number' && indexLike >= 0 && indexLike < trimmedOptions.length) {
            correctAnswer = String.fromCharCode('A'.charCodeAt(0) + indexLike)
          }
        }

        if (!correctAnswer) {
          // Default to first option label if model didn't follow the schema exactly
          correctAnswer = 'A'
        }

        const concept =
          takeStringField(q, ['concept', 'topic', 'category', 'tag']) || 'General'

        let difficulty = takeStringField(q, ['difficulty', 'level'])
        if (difficulty !== 'easy' && difficulty !== 'medium' && difficulty !== 'hard') {
          difficulty = 'medium'
        }

        return {
          question,
          options: trimmedOptions,
          correctAnswer,
          explanation,
          concept,
          difficulty,
        }
      })
      .filter((value): value is z.infer<typeof QuizChunkSchema>["questions"][number] => Boolean(value))

    return { questions: recovered }
  }

  /**
   * Agent 4: Evaluate Feynman technique explanation
   */
  async evaluateFeynmanExplanation(
    concept: string,
    userExplanation: string,
    originalContent: string
  ): Promise<z.infer<typeof FeynmanEvalSchema>> {
    const prompt = `You are an expert educator using the Feynman Technique.

The Feynman Technique requires explaining a concept in simple terms as if teaching a child. 
Evaluate this student's explanation:

**Concept:** ${concept}

**Original Source Material:**
${originalContent.substring(0, 3000)}

**Student's Explanation:**
${userExplanation}

Evaluate:
1. What concepts did they explain correctly?
2. What did they misunderstand or explain incorrectly?
3. What important concepts did they miss?
4. Provide specific, actionable feedback
5. Give a model simple explanation they could learn from`

    const response = await this.generateContentWithRetry({
      model: this.model,
      contents: prompt,
      config: (
        {
          responseMimeType: 'application/json',
          responseJsonSchema: zodToJsonSchema(FeynmanEvalSchema),
        } satisfies Record<string, unknown>
      ) as unknown as GenerateContentConfig,
    })

    return FeynmanEvalSchema.parse(JSON.parse(response.text ?? '{}'))
  }

  /**
   * Process entire textbook: Orchestrates all agents
   */
  async processFullTextbook(content: string, title: string) {
    const chunks = splitIntoChunks(content)

    // Helper: pick indices evenly across all chunks to maximize coverage
    const pickEvenlySpacedIndices = (total: number, count: number): number[] => {
      if (total <= 0 || count <= 0) return []
      if (total <= count) return Array.from({ length: total }, (_, i) => i)

      const step = (total - 1) / (count - 1)
      const indices = new Set<number>()
      for (let i = 0; i < count; i++) {
        const idx = Math.round(i * step)
        indices.add(Math.min(total - 1, Math.max(0, idx)))
      }
      return Array.from(indices).sort((a, b) => a - b)
    }

    // Step 1: Analyze structure on full content (non-fatal if it fails)
    let structure: z.infer<typeof ChapterSchema>
    try {
      structure = await this.analyzeStructure(content)
    } catch (err: unknown) {
      nativeConsole.error('Textbook structure analysis failed:', err)
      structure = { chapters: [] }
    }

    // Step 2: Generate flashcards from a limited number of evenly spaced chunks
    // Free tier has a strict per-minute request limit per model. To stay well
    // under that, we cap flashcard chunk calls to a small representative sample.
    const MAX_FLASHCARD_CHUNK_CALLS = 6
    const flashcardChunkCount = Math.min(
      MAX_FLASHCARD_CHUNK_CALLS,
      Math.max(0, chunks.length),
    )

    let allFlashcards: z.infer<typeof FlashcardChunkSchema>["flashcards"] = []
    if (flashcardChunkCount > 0) {
      const flashcardChunkIndices = pickEvenlySpacedIndices(
        chunks.length,
        flashcardChunkCount,
      )
      const flashcardPromises = flashcardChunkIndices.map((chunkIndex) =>
        this.generateFlashcardsFromChunk(
          chunks[chunkIndex],
          chunkIndex,
          title,
        ).catch((err: unknown) => {
          nativeConsole.warn('Flashcard generation failed for chunk', chunkIndex, err)
          return { flashcards: [] }
        }),
      )
      const flashcardResults = await Promise.all(flashcardPromises)
      allFlashcards = flashcardResults.flatMap((r) => r.flashcards)
    }

    // Step 3: Generate quizzes from a smaller subset of chunks
    const MAX_QUIZ_CHUNK_CALLS = 2
    const quizChunkCount = Math.min(
      MAX_QUIZ_CHUNK_CALLS,
      Math.max(0, chunks.length),
    )

    let allQuestions: z.infer<typeof QuizChunkSchema>["questions"] = []
    if (quizChunkCount > 0) {
      const quizChunkIndices = pickEvenlySpacedIndices(
        chunks.length,
        quizChunkCount,
      )
      const quizPromises = quizChunkIndices.map((chunkIndex) =>
        this.generateQuizFromChunk(
          chunks[chunkIndex],
          chunkIndex,
          title,
        ).catch((err: unknown) => {
          nativeConsole.warn('Quiz generation failed for chunk', chunkIndex, err)
          return { questions: [] }
        }),
      )
      const quizResults = await Promise.all(quizPromises)
      allQuestions = quizResults.flatMap((r) => r.questions)
    }

    return {
      structure,
      flashcards: allFlashcards,
      quizQuestions: allQuestions,
      processedChunks: chunks.length,
    }
  }
}

/**
 * Create analyzer instance
 */
export function createAnalyzer(): TextbookAnalyzer | null {
  const apiKey = process.env.GOOGLE_API_KEY?.trim()
  if (!apiKey) return null
  return new TextbookAnalyzer(apiKey)
}
