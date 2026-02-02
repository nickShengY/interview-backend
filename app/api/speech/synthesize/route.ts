import { NextRequest, NextResponse } from "next/server"
import OpenAI from "openai"

const nativeConsole = globalThis.console

function hasMessage(err: unknown): err is { message: string } {
  return (
    typeof err === "object" &&
    err !== null &&
    "message" in err &&
    typeof (err as { message?: unknown }).message === "string"
  )
}

function getErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message
  if (hasMessage(err)) return err.message
  if (typeof err === "string") return err
  return "Unknown error"
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// Available voices: alloy, echo, fable, onyx, nova, shimmer
type Voice = "alloy" | "echo" | "fable" | "onyx" | "nova" | "shimmer"

export async function POST(request: NextRequest) {
  try {
    // Check API key
    if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === "your-openai-api-key") {
      return NextResponse.json(
        { error: "OpenAI API key not configured. Please add OPENAI_API_KEY to your .env file." },
        { status: 500 }
      )
    }

    const body = await request.json()
    const { text, voice = "nova" } = body as { text: string; voice?: Voice }

    if (!text || text.trim().length === 0) {
      return NextResponse.json(
        { error: "No text provided" },
        { status: 400 }
      )
    }

    // Limit text length to prevent abuse (OpenAI has a 4096 character limit)
    if (text.length > 4096) {
      return NextResponse.json(
        { error: "Text too long. Maximum 4096 characters allowed." },
        { status: 400 }
      )
    }

    // Generate speech using OpenAI TTS
    const mp3Response = await openai.audio.speech.create({
      model: "tts-1", // Use "tts-1-hd" for higher quality (slower, more expensive)
      voice: voice,
      input: text,
      response_format: "mp3",
      speed: 1.0, // Can be adjusted 0.25 to 4.0
    })

    // Convert to buffer and return as audio
    const buffer = Buffer.from(await mp3Response.arrayBuffer())

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": "audio/mpeg",
        "Content-Length": buffer.length.toString(),
      },
    })
  } catch (error: unknown) {
    nativeConsole.error("TTS error:", error)
    return NextResponse.json(
      { error: getErrorMessage(error) || "Failed to synthesize speech" },
      { status: 500 }
    )
  }
}
