"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Mic, Square, Play, Pause, Loader2, X, Volume2, CheckCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useSpeech } from "@/hooks/use-speech"

interface VoiceRecorderProps {
  onTranscription: (text: string) => void
}

export function VoiceRecorder({ onTranscription }: VoiceRecorderProps) {
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [recordingDuration, setRecordingDuration] = useState(0)
  const [isPlayingBack, setIsPlayingBack] = useState(false)
  const playbackAudioRef = useRef<HTMLAudioElement | null>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const { toast } = useToast()

  const {
    isRecording,
    isTranscribing,
    transcription,
    startRecording: startSpeechRecording,
    stopRecording: stopSpeechRecording,
    cancelRecording,
  } = useSpeech({
    onTranscriptionComplete: (text) => {
      onTranscription(text)
      toast({
        title: "Transcription Complete",
        description: "Your speech has been converted to text using AI.",
      })
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error,
        variant: "destructive",
      })
    },
  })

  // Timer for recording duration
  useEffect(() => {
    if (isRecording) {
      setRecordingDuration(0)
      timerRef.current = setInterval(() => {
        setRecordingDuration((prev) => prev + 1)
      }, 1000)
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    }
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [isRecording])

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const handleStartRecording = async () => {
    try {
      // Start recording with our hook
      await startSpeechRecording()
      
      // Also capture audio blob for playback
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mimeType = MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : "audio/mp4"
      const mediaRecorder = new MediaRecorder(stream, { mimeType })
      mediaRecorderRef.current = mediaRecorder
      chunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = () => {
        stream.getTracks().forEach((track) => track.stop())
        const blob = new Blob(chunksRef.current, { type: mimeType })
        setAudioBlob(blob)
      }

      mediaRecorder.start()
    } catch (error) {
      toast({
        title: "Microphone Error",
        description:
          error instanceof Error
            ? error.message
            : "Could not access microphone. Please check permissions.",
        variant: "destructive",
      })
    }
  }

  const handleStopRecording = () => {
    stopSpeechRecording()
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop()
    }
  }

  const handleCancelRecording = () => {
    cancelRecording()
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop())
      mediaRecorderRef.current = null
    }
    chunksRef.current = []
    setRecordingDuration(0)
    setAudioBlob(null)
  }

  const playAudio = () => {
    if (audioBlob) {
      const audioUrl = URL.createObjectURL(audioBlob)
      const audio = new Audio(audioUrl)
      playbackAudioRef.current = audio

      audio.onended = () => {
        setIsPlayingBack(false)
        URL.revokeObjectURL(audioUrl)
      }
      audio.play()
      setIsPlayingBack(true)
    }
  }

  const pauseAudio = () => {
    if (playbackAudioRef.current) {
      playbackAudioRef.current.pause()
      setIsPlayingBack(false)
    }
  }

  return (
    <Card className="border-0 shadow-lg overflow-hidden bg-gradient-to-br from-purple-50 via-pink-50 to-rose-50 dark:from-purple-900/20 dark:via-pink-900/20 dark:to-rose-900/20">
      <CardContent className="p-6 space-y-6">
        {/* Recording Visualization */}
        <div className="flex flex-col items-center justify-center space-y-4">
          {/* Microphone Button with Animation */}
          <div className="relative">
            {isRecording && (
              <>
                <div className="absolute inset-0 rounded-full bg-red-500/20 animate-ping"></div>
                <div className="absolute inset-[-8px] rounded-full border-4 border-red-500/30 animate-pulse"></div>
              </>
            )}
            <button
              onClick={isRecording ? handleStopRecording : handleStartRecording}
              disabled={isTranscribing}
              className={`relative z-10 w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 shadow-lg hover:shadow-xl ${
                isRecording
                  ? "bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600"
                  : isTranscribing
                  ? "bg-gradient-to-r from-purple-400 to-pink-400 cursor-not-allowed"
                  : "bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
              }`}
            >
              {isTranscribing ? (
                <Loader2 className="w-8 h-8 text-white animate-spin" />
              ) : isRecording ? (
                <Square className="w-8 h-8 text-white" />
              ) : (
                <Mic className="w-8 h-8 text-white" />
              )}
            </button>
          </div>

          {/* Status Text */}
          <div className="text-center">
            {isRecording ? (
              <div className="space-y-1">
                <div className="flex items-center justify-center gap-2">
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                  <span className="text-red-600 dark:text-red-400 font-semibold">Recording</span>
                </div>
                <p className="text-2xl font-mono font-bold text-foreground">
                  {formatDuration(recordingDuration)}
                </p>
              </div>
            ) : isTranscribing ? (
              <div className="space-y-1">
                <p className="text-purple-600 dark:text-purple-400 font-semibold">
                  Processing with AI...
                </p>
                <p className="text-sm text-muted-foreground">
                  Transcribing with OpenAI Whisper
                </p>
              </div>
            ) : (
              <div className="space-y-1">
                <p className="text-foreground/90 font-medium">
                  {transcription ? "Recording complete" : "Tap to start recording"}
                </p>
                <p className="text-sm text-muted-foreground">
                  {transcription ? "Your answer has been transcribed" : "Speak clearly into your microphone"}
                </p>
              </div>
            )}
          </div>

          {/* Cancel Button (while recording) */}
          {isRecording && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleCancelRecording}
              className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
            >
              <X className="w-4 h-4 mr-1" />
              Cancel
            </Button>
          )}
        </div>

        {/* Playback Controls */}
        {audioBlob && !isRecording && !isTranscribing && (
          <div className="flex justify-center">
            <Button
              variant="outline"
              size="sm"
              onClick={isPlayingBack ? pauseAudio : playAudio}
              className="border-purple-300 dark:border-purple-700 hover:bg-purple-50 dark:hover:bg-purple-900/30"
            >
              {isPlayingBack ? (
                <>
                  <Pause className="w-4 h-4 mr-2 text-purple-500" />
                  Pause Playback
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-2 text-purple-500" />
                  Play Recording
                </>
              )}
            </Button>
          </div>
        )}

        {/* Transcription Display */}
        {transcription && (
          <div className="p-4 rounded-xl bg-background/70 dark:bg-background/40 border border-purple-100 dark:border-purple-900/30">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="w-4 h-4 text-emerald-500" />
              <h4 className="font-semibold text-foreground">Transcription</h4>
            </div>
            <p className="text-foreground/90 leading-relaxed">{transcription}</p>
          </div>
        )}

        {/* Powered by Badge */}
        <div className="flex justify-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-background/60 dark:bg-background/40 border border-purple-100 dark:border-purple-800/30">
            <Volume2 className="w-3 h-3 text-purple-500" />
            <span className="text-xs text-muted-foreground">Powered by OpenAI Whisper</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
