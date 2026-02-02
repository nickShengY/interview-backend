"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge, type BadgeProps } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { SpinWheel } from "@/components/spin-wheel"
import { VoiceRecorder } from "@/components/voice-recorder"
import { MessageSquare, Mic, Type, RotateCcw, CheckCircle, XCircle, Volume2, VolumeX, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useSpeech } from "@/hooks/use-speech"
import { authFetch } from "@/lib/auth-fetch"

interface Question {
  id: number
  question: string
  difficulty: string
  category: string
  expectedAnswer: string
}

type BehavioralSolution = {
  star?: {
    situation?: string
    task?: string
    action?: string
    result?: string
  }
  improvementTips?: string[]
}

type TechnicalSolution = {
  idealAnswer?: string
  keyPoints?: string[]
  improvementTips?: string[]
}

type Solution = BehavioralSolution | TechnicalSolution

interface InterviewQuestionsProps {
  questions: Question[]
  type: "technical" | "behavioral"
  onReset: () => void
}

export function InterviewQuestions({ questions, type, onReset }: InterviewQuestionsProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<number, string>>({})
  const [inputMode, setInputMode] = useState<"text" | "voice">("text")
  const [showSpinWheel, setShowSpinWheel] = useState(false)
  const [evaluatedAnswers, setEvaluatedAnswers] = useState<Record<number, boolean>>({})
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [sessionReward, setSessionReward] = useState<{rewardAmount: number, totalCorrect: number} | null>(null)
  const [solutions, setSolutions] = useState<Record<number, Solution>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  // TTS hook for reading questions aloud
  const { speak, stopSpeaking, isSpeaking, isLoadingTTS } = useSpeech({
    voice: "nova", // Natural sounding voice
    onError: (error) => {
      toast({
        title: "Text-to-Speech Error",
        description: error,
        variant: "destructive",
      })
    },
  })

  const currentQuestion = questions[currentQuestionIndex]
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100

  const solutionForCurrent = solutions[currentQuestion.id]
  const starForCurrent =
    type === "behavioral" && solutionForCurrent && "star" in solutionForCurrent
      ? solutionForCurrent.star
      : undefined
  const idealAnswerForCurrent =
    type === "technical" && solutionForCurrent && "idealAnswer" in solutionForCurrent
      ? solutionForCurrent.idealAnswer
      : undefined
  const keyPointsForCurrent =
    type === "technical" && solutionForCurrent && "keyPoints" in solutionForCurrent
      ? solutionForCurrent.keyPoints
      : undefined

  // Function to read the current question aloud
  const handleReadQuestion = () => {
    if (isSpeaking) {
      stopSpeaking()
    } else {
      speak(currentQuestion.question)
    }
  }

  const handleAnswerSubmit = async () => {
    const answer = answers[currentQuestion.id]
    const trimmedAnswer = answer?.trim() || ""
    if (!trimmedAnswer) {
      toast({
        title: "Empty Answer",
        description: "Please provide an answer before submitting.",
        variant: "destructive",
      })
      return
    }

    if (isSubmitting) return

    try {
      setIsSubmitting(true)
      const answerSig = `${trimmedAnswer.length}:${trimmedAnswer.length ? trimmedAnswer.charCodeAt(0) : 0}:${
        trimmedAnswer.length ? trimmedAnswer.charCodeAt(trimmedAnswer.length - 1) : 0
      }`
      // Call the real AI evaluation API
      const res = await authFetch("/api/interview/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: currentQuestion.question,
          answer: answer,
          type: type,
          sessionId: sessionId,
        }),
        dedupeKey: `credits:/api/interview/evaluate:${type}:${sessionId || "new"}:${currentQuestion.id}:${answerSig}`,
      })

      if (!res.ok) {
        throw new Error("Failed to evaluate answer")
      }

      const data = await res.json()
      const isCorrect = data.correct
      if (data.solution) {
        setSolutions((prev) => ({ ...prev, [currentQuestion.id]: data.solution }))
      }
      
      // Track session ID for subsequent questions
      if (data.sessionId && !sessionId) {
        setSessionId(data.sessionId)
      }

      setEvaluatedAnswers((prev) => ({ ...prev, [currentQuestion.id]: isCorrect }))
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('credits:update'))
      }

      // Check if session is complete and has reward
      if (data.reward?.completed) {
        setSessionReward({
          rewardAmount: data.reward.rewardAmount,
          totalCorrect: data.reward.totalCorrect
        })
        // Show spin wheel for completed technical interview sessions
        if (type === "technical") {
          setShowSpinWheel(true)
        } else {
          toast({
            title: "Session Complete!",
            description: `You got ${data.reward.totalCorrect}/${data.reward.totalQuestions} correct!`,
          })
        }
      } else {
        // Just regular feedback, move to next question
        toast({
          title: isCorrect ? "Correct!" : "Good try!",
          description: isCorrect
            ? `Keep going! ${data.answeredCount}/${data.totalQuestions} answered.`
            : `${data.answeredCount}/${data.totalQuestions} answered. Review the concept and try again later.`,
          variant: isCorrect ? "default" : "destructive",
        })

        if (currentQuestionIndex < questions.length - 1) {
          setTimeout(() => setCurrentQuestionIndex((prev) => prev + 1), 1500)
        }
      }
    } catch (error) {
      toast({
        title: "Evaluation Failed",
        description: error instanceof Error ? error.message : "Could not evaluate your answer. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSpinComplete = () => {
    setShowSpinWheel(false)
    const amount = sessionReward?.rewardAmount || 0
    const correct = sessionReward?.totalCorrect || 0
    
    if (amount > 0) {
      toast({
        title: "🎉 Congratulations!",
        description: `You earned ${amount} credits! You got ${correct}/5 questions correct.`,
      })
    } else {
      toast({
        title: "Session Complete!",
        description: `You got ${correct}/5 questions correct. Keep practicing to improve!`,
      })
    }
  }

  const getDifficultyVariant = (difficulty: string): BadgeProps["variant"] => {
    switch (difficulty.toLowerCase()) {
      case "hard":
        return "destructive"
      case "medium":
        return "secondary"
      case "easy":
      default:
        return "default"
    }
  }

  return (
    <div className="space-y-6">
      {/* Progress */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>
                Question {currentQuestionIndex + 1} of {questions.length}
              </span>
              <span>{Math.round(progress)}% Complete</span>
            </div>
            <Progress value={progress} />
          </div>
        </CardContent>
      </Card>

      {/* Current Question */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <MessageSquare className="w-5 h-5" />
              <span>Question {currentQuestionIndex + 1}</span>
            </CardTitle>
            <div className="flex items-center space-x-2">
              <Badge variant={getDifficultyVariant(currentQuestion.difficulty)}>
                {currentQuestion.difficulty}
              </Badge>
              <Badge variant="outline">{currentQuestion.category}</Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Question Display with TTS */}
          <div className="relative p-5 bg-muted/30 border-l-4 border-primary rounded-xl">
            <p className="text-lg font-medium text-foreground pr-12">{currentQuestion.question}</p>
            
            {/* Read Aloud Button */}
            <button
              onClick={handleReadQuestion}
              disabled={isLoadingTTS}
              className={`absolute top-4 right-4 p-2.5 rounded-full transition-all duration-300 ${
                isSpeaking
                  ? "bg-gradient-to-r from-primary to-primary/80 text-primary-foreground shadow-lg"
                  : "bg-background text-muted-foreground hover:bg-accent hover:text-accent-foreground shadow-md hover:shadow-lg"
              }`}
              title={isSpeaking ? "Stop reading" : "Read question aloud"}
            >
              {isLoadingTTS ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : isSpeaking ? (
                <VolumeX className="w-5 h-5" />
              ) : (
                <Volume2 className="w-5 h-5" />
              )}
            </button>
            
            {/* Speaking indicator */}
            {isSpeaking && (
              <div className="absolute bottom-2 right-4 flex items-center gap-1.5">
                <div className="flex gap-0.5">
                  <div className="w-1 h-3 bg-primary rounded-full animate-pulse"></div>
                  <div className="w-1 h-4 bg-primary/70 rounded-full animate-pulse" style={{ animationDelay: "0.1s" }}></div>
                  <div className="w-1 h-2 bg-primary rounded-full animate-pulse" style={{ animationDelay: "0.2s" }}></div>
                </div>
                <span className="text-xs text-primary font-medium">Speaking...</span>
              </div>
            )}
          </div>

          {/* Input Mode Toggle */}
          <div className="flex items-center space-x-2">
            <Button
              variant={inputMode === "text" ? "default" : "outline"}
              size="sm"
              onClick={() => setInputMode("text")}
            >
              <Type className="w-4 h-4 mr-2" />
              Text
            </Button>
            <Button
              variant={inputMode === "voice" ? "default" : "outline"}
              size="sm"
              onClick={() => setInputMode("voice")}
            >
              <Mic className="w-4 h-4 mr-2" />
              Voice
            </Button>
          </div>

          {/* Answer Input */}
          {inputMode === "text" ? (
            <Textarea
              placeholder="Type your answer here..."
              value={answers[currentQuestion.id] || ""}
              onChange={(e) =>
                setAnswers((prev) => ({
                  ...prev,
                  [currentQuestion.id]: e.target.value,
                }))
              }
              className="min-h-[150px]"
            />
          ) : (
            <VoiceRecorder
              onTranscription={(text) =>
                setAnswers((prev) => ({
                  ...prev,
                  [currentQuestion.id]: text,
                }))
              }
            />
          )}

          {/* Answer Status */}
          {evaluatedAnswers[currentQuestion.id] !== undefined && (
            <div
              className={`p-3 rounded-lg flex items-center space-x-2 border ${
                evaluatedAnswers[currentQuestion.id]
                  ? "bg-primary/10 border-primary/20"
                  : "bg-destructive/10 border-destructive/20"
              }`}
            >
              {evaluatedAnswers[currentQuestion.id] ? (
                <CheckCircle className="w-5 h-5 text-primary" />
              ) : (
                <XCircle className="w-5 h-5 text-destructive" />
              )}
              <span className="text-sm font-medium text-foreground">
                {evaluatedAnswers[currentQuestion.id] ? "Correct Answer!" : "Needs Improvement"}
              </span>
            </div>
          )}

          {solutionForCurrent && (
            <div className="space-y-3 p-4 rounded-lg bg-muted/30 border border-border">
              <div className="font-semibold text-foreground">Solution</div>
              {type === "behavioral" ? (
                <div className="space-y-2 text-sm text-foreground/90">
                  <div className="grid md:grid-cols-2 gap-3">
                    <div><span className="font-medium">Situation:</span> {starForCurrent?.situation || ""}</div>
                    <div><span className="font-medium">Task:</span> {starForCurrent?.task || ""}</div>
                    <div><span className="font-medium">Action:</span> {starForCurrent?.action || ""}</div>
                    <div><span className="font-medium">Result:</span> {starForCurrent?.result || ""}</div>
                  </div>
                  {Array.isArray(solutionForCurrent.improvementTips) && (
                    <div className="text-sm">
                      <div className="font-medium mb-1">Improvement Tips</div>
                      <ul className="list-disc pl-5 space-y-1">
                        {solutionForCurrent.improvementTips.map((tip: string, i: number) => (
                          <li key={i}>{tip}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-2 text-sm text-foreground/90">
                  <div className="font-medium">Ideal Answer</div>
                  <div className="text-foreground/90">{idealAnswerForCurrent || ""}</div>
                  {Array.isArray(keyPointsForCurrent) && (
                    <div className="text-sm">
                      <div className="font-medium mb-1">Key Points</div>
                      <ul className="list-disc pl-5 space-y-1">
                        {keyPointsForCurrent.map((pt: string, i: number) => (
                          <li key={i}>{pt}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {Array.isArray(solutionForCurrent.improvementTips) && (
                    <div className="text-sm">
                      <div className="font-medium mb-1">Improvement Tips</div>
                      <ul className="list-disc pl-5 space-y-1">
                        {solutionForCurrent.improvementTips.map((tip: string, i: number) => (
                          <li key={i}>{tip}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          <div className="flex justify-between">
            <Button variant="outline" onClick={onReset}>
              <RotateCcw className="w-4 h-4 mr-2" />
              Start Over
            </Button>
            <Button
              onClick={handleAnswerSubmit}
              disabled={!answers[currentQuestion.id]?.trim() || evaluatedAnswers[currentQuestion.id] !== undefined || isSubmitting}
            >
              Submit Answer
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={() => setCurrentQuestionIndex((prev) => Math.max(0, prev - 1))}
          disabled={currentQuestionIndex === 0}
        >
          Previous Question
        </Button>
        <Button
          variant="outline"
          onClick={() => setCurrentQuestionIndex((prev) => Math.min(questions.length - 1, prev + 1))}
          disabled={currentQuestionIndex === questions.length - 1}
        >
          Next Question
        </Button>
      </div>

      {/* Spin Wheel Modal */}
      {showSpinWheel && <SpinWheel rewardAmount={sessionReward?.rewardAmount || 0} onComplete={handleSpinComplete} />}
    </div>
  )
}
