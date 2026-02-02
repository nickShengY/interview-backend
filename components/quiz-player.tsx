"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { 
  CheckCircle, 
  XCircle, 
  ChevronRight, 
  RotateCcw,
  Trophy,
  Target,
  Lightbulb
} from "lucide-react"

interface QuizQuestion {
  id: string
  question: string
  options: string[]
  correctAnswer: string
  explanation?: string
  userAnswer?: string
  orderIndex: number
}

interface Quiz {
  id: string
  title: string
  totalQuestions: number
  score?: number
  questions: QuizQuestion[]
}

interface QuizPlayerProps {
  quiz: Quiz
  onComplete?: (score: number) => void
}

export function QuizPlayer({ quiz, onComplete }: QuizPlayerProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)
  const [showResult, setShowResult] = useState(false)
  const [answers, setAnswers] = useState<Record<string, { selected: string; correct: boolean }>>({})
  const [isComplete, setIsComplete] = useState(false)

  const currentQuestion = quiz.questions[currentIndex]
  const progress = ((currentIndex + 1) / quiz.questions.length) * 100
  const isCorrect = selectedAnswer === currentQuestion?.correctAnswer

  const handleSelectAnswer = (answer: string) => {
    if (showResult) return
    setSelectedAnswer(answer)
  }

  const handleSubmitAnswer = () => {
    if (!selectedAnswer || !currentQuestion) return
    
    setShowResult(true)
    setAnswers(prev => ({
      ...prev,
      [currentQuestion.id]: {
        selected: selectedAnswer,
        correct: selectedAnswer === currentQuestion.correctAnswer,
      }
    }))
  }

  const handleNextQuestion = () => {
    if (currentIndex < quiz.questions.length - 1) {
      setCurrentIndex(prev => prev + 1)
      setSelectedAnswer(null)
      setShowResult(false)
    } else {
      // Quiz complete
      const correctCount = Object.values(answers).filter(a => a.correct).length + (isCorrect ? 1 : 0)
      const score = Math.round((correctCount / quiz.questions.length) * 100)
      setIsComplete(true)
      onComplete?.(score)
    }
  }

  const getOptionStyle = (option: string) => {
    if (!showResult) {
      return selectedAnswer === option
        ? "border-primary bg-primary/10"
        : "border-border hover:border-primary/40 hover:bg-muted/40"
    }
    
    if (option === currentQuestion.correctAnswer) {
      return "border-primary bg-primary/10"
    }
    
    if (option === selectedAnswer && option !== currentQuestion.correctAnswer) {
      return "border-destructive bg-destructive/10"
    }
    
    return "border-border opacity-50"
  }

  // Results Screen
  if (isComplete) {
    const correctCount = Object.values(answers).filter(a => a.correct).length
    const score = Math.round((correctCount / quiz.questions.length) * 100)
    const passed = score >= 70

    return (
      <Card className="border-0 shadow-xl overflow-hidden">
        <div
          className={`h-2 ${
            passed
              ? 'bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-500 dark:to-purple-500'
              : 'bg-destructive'
          }`}
        />
        <CardContent className="p-8 text-center space-y-6">
          <div className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto ${
            passed 
              ? 'bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-500 dark:to-purple-500'
              : 'bg-destructive'
          }`}>
            {passed ? (
              <Trophy className="w-12 h-12 text-white" />
            ) : (
              <Target className="w-12 h-12 text-white" />
            )}
          </div>

          <div>
            <h2 className="text-3xl font-bold text-foreground">
              {passed ? 'Great Job!' : 'Keep Practicing!'}
            </h2>
            <p className="text-muted-foreground mt-2">
              {passed 
                ? 'You\'ve demonstrated strong understanding of this material.'
                : 'Review the explanations below and try again to improve your score.'}
            </p>
          </div>

          <div className="flex justify-center gap-8">
            <div className="text-center">
              <div className={`text-5xl font-bold ${passed ? 'text-primary' : 'text-destructive'}`}>
                {score}%
              </div>
              <div className="text-sm text-muted-foreground mt-1">Score</div>
            </div>
            <div className="text-center">
              <div className="text-5xl font-bold text-foreground">
                {correctCount}/{quiz.questions.length}
              </div>
              <div className="text-sm text-muted-foreground mt-1">Correct</div>
            </div>
          </div>

          {/* Review Answers */}
          <div className="mt-8 space-y-4 text-left">
            <h3 className="font-semibold text-lg">Review Answers</h3>
            {quiz.questions.map((q, idx) => {
              const answer = answers[q.id]
              const wasCorrect = answer?.correct

              return (
                <div 
                  key={q.id} 
                  className={`p-4 rounded-lg border ${
                    wasCorrect 
                      ? 'border-primary/20 bg-primary/5'
                      : 'border-destructive/20 bg-destructive/5'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {wasCorrect ? (
                      <CheckCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                    ) : (
                      <XCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1">
                      <p className="font-medium text-sm text-foreground">
                        Q{idx + 1}: {q.question}
                      </p>
                      {!wasCorrect && (
                        <p className="text-sm mt-1">
                          <span className="text-destructive">Your answer: {answer?.selected}</span>
                          <span className="text-muted-foreground/60 mx-2">•</span>
                          <span className="text-primary">Correct: {q.correctAnswer}</span>
                        </p>
                      )}
                      {q.explanation && (
                        <p className="text-sm text-muted-foreground mt-2 flex items-start gap-2">
                          <Lightbulb className="w-4 h-4 flex-shrink-0 mt-0.5" />
                          {q.explanation}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          <Button
            onClick={() => {
              setCurrentIndex(0)
              setSelectedAnswer(null)
              setShowResult(false)
              setAnswers({})
              setIsComplete(false)
            }}
            variant="brand"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Retake Quiz
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Progress */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>Question {currentIndex + 1} of {quiz.questions.length}</span>
        <span>{Math.round(progress)}% complete</span>
      </div>
      <Progress value={progress} className="h-2" />

      {/* Question Card */}
      {currentQuestion && (
        <Card className="border-0 shadow-xl overflow-hidden">
          <CardHeader className="bg-muted/30">
            <div className="flex items-center justify-between">
              <Badge variant="outline">Question {currentIndex + 1}</Badge>
              <Badge variant="secondary">
                {quiz.title}
              </Badge>
            </div>
            <CardTitle className="text-xl mt-4 leading-relaxed">
              {currentQuestion.question}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            {/* Options */}
            <div className="space-y-3">
              {currentQuestion.options.map((option, idx) => {
                const letter = String.fromCharCode(65 + idx) // A, B, C, D
                const isSelected = selectedAnswer === option
                const isCorrectOption = option === currentQuestion.correctAnswer

                return (
                  <button
                    key={idx}
                    onClick={() => handleSelectAnswer(option)}
                    disabled={showResult}
                    className={`w-full p-4 rounded-xl border-2 text-left transition-all duration-200 flex items-center gap-4 ${getOptionStyle(option)}`}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                      showResult && isCorrectOption
                        ? 'bg-primary text-primary-foreground'
                        : showResult && isSelected && !isCorrectOption
                        ? 'bg-destructive text-destructive-foreground'
                        : isSelected
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground'
                    }`}>
                      {showResult && isCorrectOption ? (
                        <CheckCircle className="w-5 h-5" />
                      ) : showResult && isSelected && !isCorrectOption ? (
                        <XCircle className="w-5 h-5" />
                      ) : (
                        letter
                      )}
                    </div>
                    <span className="flex-1 text-foreground">{option}</span>
                  </button>
                )
              })}
            </div>

            {/* Explanation */}
            {showResult && currentQuestion.explanation && (
              <div className={`p-4 rounded-xl ${
                isCorrect 
                  ? 'bg-primary/10 border border-primary/20'
                  : 'bg-muted/30 border border-border'
              }`}>
                <div className="flex items-start gap-3">
                  <Lightbulb className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
                    isCorrect ? 'text-primary' : 'text-muted-foreground'
                  }`} />
                  <div>
                    <p className="font-medium text-sm mb-1">
                      {isCorrect ? 'Correct!' : 'Explanation'}
                    </p>
                    <p className="text-sm text-foreground/90">
                      {currentQuestion.explanation}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Action Button */}
            <div className="pt-4">
              {!showResult ? (
                <Button
                  onClick={handleSubmitAnswer}
                  disabled={!selectedAnswer}
                  variant="brand"
                  className="w-full"
                >
                  Check Answer
                </Button>
              ) : (
                <Button
                  onClick={handleNextQuestion}
                  variant="brand"
                  className="w-full"
                >
                  {currentIndex < quiz.questions.length - 1 ? (
                    <>
                      Next Question
                      <ChevronRight className="w-4 h-4 ml-2" />
                    </>
                  ) : (
                    <>
                      <Trophy className="w-4 h-4 mr-2" />
                      See Results
                    </>
                  )}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
