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

export async function POST(request: NextRequest) {
  try {
    // Check API key
    if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === "your-openai-api-key") {
      return NextResponse.json(
        { error: "OpenAI API key not configured. Please add OPENAI_API_KEY to your .env file." },
        { status: 500 }
      )
    }

    const formData = await request.formData()
    const audioFile = formData.get("audio") as File
    
    if (!audioFile) {
      return NextResponse.json(
        { error: "No audio file provided" },
        { status: 400 }
      )
    }

    // Convert File to the format OpenAI expects
    const transcription = await openai.audio.transcriptions.create({
      file: audioFile,
      model: "whisper-1",
      language: "en", // Can be made dynamic based on user preference
      response_format: "json",
    })

    return NextResponse.json({
      text: transcription.text,
      success: true,
    })
  } catch (error: unknown) {
    nativeConsole.error("Transcription error:", error)
    return NextResponse.json(
      { error: getErrorMessage(error) || "Failed to transcribe audio" },
      { status: 500 }
    )
  }
}
