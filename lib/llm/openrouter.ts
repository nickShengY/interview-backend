import OpenAI from "openai"

const OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1"
const OPENROUTER_MODELS = [
  "arcee-ai/trinity-large-preview:free",
  "qwen/qwen3-next-80b-a3b-instruct:free",
  "z-ai/glm-4-32b",
] as const

type StructuredOutputArgs = {
  prompt: string
  schema: Record<string, unknown>
  model?: string
  maxRetries?: number
}

let cachedClient: OpenAI | null = null

function getOpenRouterClient() {
  if (cachedClient) return cachedClient
  const apiKey = process.env.OPENROUTER_API_KEY?.trim()
  if (!apiKey) {
    throw new Error("Missing OPENROUTER_API_KEY")
  }

  cachedClient = new OpenAI({
    apiKey,
    baseURL: OPENROUTER_BASE_URL,
    defaultHeaders: {
      "HTTP-Referer": process.env.OPENROUTER_APP_URL || "",
      "X-Title": process.env.OPENROUTER_APP_NAME || "",
    },
  })

  return cachedClient
}

function isRetryableError(err: unknown) {
  const message = err instanceof Error ? err.message : String(err)
  return message.includes("429") || message.toLowerCase().includes("rate limit")
}

function uniqueModels(primary?: string) {
  const models = primary ? [primary, ...OPENROUTER_MODELS] : [...OPENROUTER_MODELS]
  return Array.from(new Set(models))
}

export async function generateStructuredOutput<T>({
  prompt,
  schema,
  model,
  maxRetries = 1,
}: StructuredOutputArgs): Promise<T> {
  const client = getOpenRouterClient()
  const candidates = uniqueModels(model)
  let lastError: unknown

  for (const candidate of candidates) {
    let attempt = 0
    let delay = 1000

    for (;;) {
      try {
        const response = await client.chat.completions.create({
          model: candidate,
          messages: [{ role: "user", content: prompt }],
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "structured_output",
              schema,
              strict: true,
            },
          },
        })

        const content = response.choices[0]?.message?.content
        if (!content) {
          throw new Error("OpenRouter returned empty response")
        }

        return JSON.parse(content) as T
      } catch (err: unknown) {
        lastError = err
        if (attempt < maxRetries && isRetryableError(err)) {
          await new Promise((resolve) => setTimeout(resolve, delay))
          attempt += 1
          delay *= 2
          continue
        }
        break
      }
    }
  }

  throw lastError instanceof Error ? lastError : new Error("OpenRouter request failed")
}

export type OpenRouterModel = typeof OPENROUTER_MODELS[number]
export { OPENROUTER_MODELS }
