"use client"

import { useState, useRef, useCallback } from "react"
import { authFetch } from "@/lib/auth-fetch"

type Voice = "alloy" | "echo" | "fable" | "onyx" | "nova" | "shimmer"

interface UseSpeechOptions {
  voice?: Voice
  onTranscriptionComplete?: (text: string) => void
  onError?: (error: string) => void
}

export function useSpeech(options: UseSpeechOptions = {}) {
  const { voice = "nova", onTranscriptionComplete, onError } = options

  // TTS State
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [isLoadingTTS, setIsLoadingTTS] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  // STT State
  const [isRecording, setIsRecording] = useState(false)
  const [isTranscribing, setIsTranscribing] = useState(false)
  const [transcription, setTranscription] = useState("")
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])

  // Text-to-Speech: Speak text aloud
  const speak = useCallback(async (text: string) => {
    if (!text.trim()) return

    try {
      setIsLoadingTTS(true)
      
      // Stop any currently playing audio
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current = null
      }

      const response = await authFetch("/api/speech/synthesize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, voice }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to synthesize speech")
      }

      const audioBlob = await response.blob()
      const audioUrl = URL.createObjectURL(audioBlob)
      const audio = new Audio(audioUrl)
      audioRef.current = audio

      audio.onplay = () => setIsSpeaking(true)
      audio.onended = () => {
        setIsSpeaking(false)
        URL.revokeObjectURL(audioUrl)
      }
      audio.onerror = () => {
        setIsSpeaking(false)
        onError?.("Failed to play audio")
      }

      await audio.play()
    } catch (error: any) {
      onError?.(error.message || "Failed to speak")
    } finally {
      setIsLoadingTTS(false)
    }
  }, [voice, onError])

  // Stop speaking
  const stopSpeaking = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
      audioRef.current = null
      setIsSpeaking(false)
    }
  }, [])

  // Speech-to-Text: Start recording
  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      
      // Determine best supported format
      const mimeType = MediaRecorder.isTypeSupported("audio/webm")
        ? "audio/webm"
        : MediaRecorder.isTypeSupported("audio/mp4")
        ? "audio/mp4"
        : "audio/wav"

      const mediaRecorder = new MediaRecorder(stream, { mimeType })
      mediaRecorderRef.current = mediaRecorder
      chunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = async () => {
        // Stop all tracks
        stream.getTracks().forEach((track) => track.stop())

        // Create blob from chunks
        const audioBlob = new Blob(chunksRef.current, { type: mimeType })
        
        // Transcribe with Whisper
        await transcribeAudio(audioBlob)
      }

      mediaRecorder.start()
      setIsRecording(true)
      setTranscription("")
    } catch (error: any) {
      onError?.(error.message || "Failed to access microphone")
    }
  }, [onError])

  // Stop recording and transcribe
  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
    }
  }, [isRecording])

  // Transcribe audio blob using Whisper API
  const transcribeAudio = useCallback(async (audioBlob: Blob) => {
    try {
      setIsTranscribing(true)

      const formData = new FormData()
      // Whisper expects specific file extensions
      const extension = audioBlob.type.includes("webm") ? "webm" : audioBlob.type.includes("mp4") ? "mp4" : "wav"
      formData.append("audio", audioBlob, `recording.${extension}`)

      const response = await authFetch("/api/speech/transcribe", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to transcribe")
      }

      const data = await response.json()
      setTranscription(data.text)
      onTranscriptionComplete?.(data.text)
    } catch (error: any) {
      onError?.(error.message || "Failed to transcribe audio")
    } finally {
      setIsTranscribing(false)
    }
  }, [onTranscriptionComplete, onError])

  // Cancel recording without transcribing
  const cancelRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop())
      mediaRecorderRef.current = null
      chunksRef.current = []
      setIsRecording(false)
    }
  }, [isRecording])

  return {
    // TTS
    speak,
    stopSpeaking,
    isSpeaking,
    isLoadingTTS,

    // STT
    startRecording,
    stopRecording,
    cancelRecording,
    isRecording,
    isTranscribing,
    transcription,
    setTranscription,
  }
}
