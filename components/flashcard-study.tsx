"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { 
  RotateCcw, 
  ChevronLeft, 
  ChevronRight, 
  Eye, 
  Brain, 
  Zap, 
  Target,
  CheckCircle,
  XCircle,
  AlertCircle,
  Sparkles,
  Clock
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { authFetch } from "@/lib/auth-fetch"

interface Flashcard {
  id: string
  front: string
  back: string
  category?: string
  keyTerms?: string[]
  mnemonics?: string
  difficulty: number
  nextReview: string
  interval: number
  easeFactor: number
  repetitions: number
}

interface FlashcardStudyProps {
  flashcards: Flashcard[]
  textbookId: string
  onComplete?: () => void
}

// SM-2 quality ratings
const RATINGS = [
  {
    value: 0,
    label: "Again",
    desc: "Completely forgot",
    variant: "destructive",
    icon: XCircle,
  },
  {
    value: 1,
    label: "Hard",
    desc: "Barely remembered",
    variant: "secondary",
    icon: AlertCircle,
  },
  {
    value: 3,
    label: "Good",
    desc: "Remembered with effort",
    variant: "default",
    icon: CheckCircle,
  },
  {
    value: 5,
    label: "Easy",
    desc: "Instantly knew it",
    variant: "brand",
    icon: Sparkles,
  },
] as const

export function FlashcardStudy({ flashcards, onComplete }: FlashcardStudyProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [showBack, setShowBack] = useState(false)
  const [studiedCount, setStudiedCount] = useState(0)
  const [sessionStats, setSessionStats] = useState({ correct: 0, incorrect: 0, total: 0 })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  // Filter to cards due for review
  const dueCards = flashcards.filter(fc => new Date(fc.nextReview) <= new Date())
  const currentCard = dueCards[currentIndex]
  const progress = dueCards.length > 0 ? ((studiedCount) / dueCards.length) * 100 : 0

  const handleRating = async (quality: number) => {
    if (!currentCard || isSubmitting) return
    setIsSubmitting(true)

    try {
      const res = await authFetch(`/api/textbook/flashcards/${currentCard.id}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quality }),
        dedupeKey: `credits:/api/textbook/flashcards/${currentCard.id}/review:${quality}`,
      })

      if (!res.ok) throw new Error('Failed to save review')

      await res.json()
      
      // Update stats
      setSessionStats(prev => ({
        correct: prev.correct + (quality >= 3 ? 1 : 0),
        incorrect: prev.incorrect + (quality < 3 ? 1 : 0),
        total: prev.total + 1,
      }))
      setStudiedCount(prev => prev + 1)

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('credits:update'))
      }

      // Move to next card
      if (currentIndex < dueCards.length - 1) {
        setCurrentIndex(prev => prev + 1)
        setShowBack(false)
      } else {
        // Session complete
        toast({
          title: "Study Session Complete! 🎉",
          description: `You reviewed ${studiedCount + 1} cards. ${sessionStats.correct + (quality >= 3 ? 1 : 0)} correct!`,
        })
        onComplete?.()
      }
    } catch {
      toast({
        title: "Error",
        description: "Failed to save your progress. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (dueCards.length === 0) {
    return (
      <Card className="border-0 shadow-lg overflow-hidden">
        <CardContent className="p-12 text-center">
          <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-primary-foreground" />
          </div>
          <h3 className="text-2xl font-bold text-foreground mb-2">
            All Caught Up! 🎉
          </h3>
          <p className="text-muted-foreground mb-6">
            No flashcards due for review right now. Great job staying on top of your studies!
          </p>
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Clock className="w-4 h-4" />
            <span>Next review cards will appear based on your spaced repetition schedule</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Progress Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Badge variant="outline" className="px-3 py-1">
            <Brain className="w-4 h-4 mr-1" />
            {studiedCount} / {dueCards.length} reviewed
          </Badge>
          <div className="flex gap-2">
            <Badge
              variant="outline"
              className="bg-primary/10 text-primary border-primary/20"
            >
              ✓ {sessionStats.correct}
            </Badge>
            <Badge
              variant="outline"
              className="bg-destructive/10 text-destructive border-destructive/20"
            >
              ✗ {sessionStats.incorrect}
            </Badge>
          </div>
        </div>
        <span className="text-sm text-muted-foreground">{Math.round(progress)}% complete</span>
      </div>
      <Progress value={progress} className="h-2" />

      {/* Flashcard */}
      {currentCard && (
        <Card 
          className="border-0 shadow-xl overflow-hidden cursor-pointer transition-all duration-500 transform hover:scale-[1.01]"
          onClick={() => !showBack && setShowBack(true)}
        >
          {/* Category Badge */}
          <div className="px-6 pt-4 flex items-center justify-between">
            <Badge variant="secondary">
              {currentCard.category || 'General'}
            </Badge>
            <Badge variant="outline" className="text-xs">
              Card {currentIndex + 1} of {dueCards.length}
            </Badge>
          </div>

          <CardContent className="p-8 min-h-[300px] flex flex-col justify-center">
            {/* Front (Question) */}
            <div className={`transition-all duration-300 ${showBack ? 'opacity-50' : ''}`}>
              <div className="flex items-center gap-2 mb-4 text-sm text-muted-foreground">
                <Target className="w-4 h-4" />
                <span>Question</span>
              </div>
              <p className="text-xl font-medium text-foreground leading-relaxed">
                {currentCard.front}
              </p>
            </div>

            {/* Back (Answer) - Revealed */}
            {showBack && (
              <div className="mt-8 pt-8 border-t border-border animate-in slide-in-from-bottom-4 duration-300">
                <div className="flex items-center gap-2 mb-4 text-sm text-primary">
                  <Zap className="w-4 h-4" />
                  <span>Answer</span>
                </div>
                <p className="text-lg text-foreground/90 leading-relaxed">
                  {currentCard.back}
                </p>

                {/* Key Terms */}
                {currentCard.keyTerms && currentCard.keyTerms.length > 0 && (
                  <div className="mt-6 flex flex-wrap gap-2">
                    {currentCard.keyTerms.map((term, i) => (
                      <Badge key={i} variant="secondary" className="text-xs">
                        {term}
                      </Badge>
                    ))}
                  </div>
                )}

                {/* Mnemonic */}
                {currentCard.mnemonics && (
                  <div className="mt-4 p-3 rounded-lg bg-muted/30 border border-border">
                    <div className="flex items-center gap-2 text-sm text-foreground/90">
                      <Sparkles className="w-4 h-4" />
                      <span className="font-medium">Memory Aid:</span>
                      <span>{currentCard.mnemonics}</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Tap to reveal hint */}
            {!showBack && (
              <div className="mt-8 text-center">
                <Button variant="outline" onClick={() => setShowBack(true)} className="gap-2">
                  <Eye className="w-4 h-4" />
                  Tap to reveal answer
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Rating Buttons */}
      {showBack && currentCard && (
        <div className="space-y-4 animate-in slide-in-from-bottom-4 duration-300">
          <p className="text-center text-sm text-muted-foreground">
            How well did you remember this?
          </p>
          <div className="grid grid-cols-4 gap-3">
            {RATINGS.map((rating) => {
              const Icon = rating.icon
              return (
                <Button
                  key={rating.value}
                  variant={rating.variant}
                  onClick={() => handleRating(rating.value)}
                  disabled={isSubmitting}
                  className="h-auto py-4 flex flex-col gap-2 transition-all"
                >
                  <Icon className="w-6 h-6" />
                  <span className="font-semibold">{rating.label}</span>
                  <span className="text-xs opacity-80">{rating.desc}</span>
                </Button>
              )
            })}
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-between items-center pt-4">
        <Button
          variant="outline"
          onClick={() => {
            if (currentIndex > 0) {
              setCurrentIndex(prev => prev - 1)
              setShowBack(false)
            }
          }}
          disabled={currentIndex === 0}
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          Previous
        </Button>
        <Button
          variant="outline"
          onClick={() => {
            setCurrentIndex(0)
            setShowBack(false)
            setStudiedCount(0)
            setSessionStats({ correct: 0, incorrect: 0, total: 0 })
          }}
        >
          <RotateCcw className="w-4 h-4 mr-1" />
          Restart
        </Button>
        <Button
          variant="outline"
          onClick={() => {
            if (currentIndex < dueCards.length - 1) {
              setCurrentIndex(prev => prev + 1)
              setShowBack(false)
            }
          }}
          disabled={currentIndex >= dueCards.length - 1}
        >
          Skip
          <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      </div>
    </div>
  )
}
