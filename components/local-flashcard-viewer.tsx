"use client"

import { useState } from "react"
import ReactMarkdown from "react-markdown"
import remarkMath from "remark-math"
import rehypeKatex from "rehype-katex"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { ChevronLeft, ChevronRight, Eye, Zap, BookOpen, Sparkles } from "lucide-react"
import type { LocalFlashcard } from "@/lib/textbook/local-storage"

interface LocalFlashcardViewerProps {
  cards: LocalFlashcard[]
  textbookTitle: string
  batchIndex: number
  totalBatches: number
  onExit?: () => void
  onNextBatch?: () => void
  onPrevBatch?: () => void
  onPracticeFeynman?: () => void
}

export function LocalFlashcardViewer({
  cards,
  textbookTitle,
  batchIndex,
  totalBatches,
  onExit,
  onNextBatch,
  onPrevBatch,
  onPracticeFeynman,
}: LocalFlashcardViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [showBack, setShowBack] = useState(false)

  if (!cards || cards.length === 0) {
    return null
  }

  const currentCard = cards[currentIndex]
  const progress = ((currentIndex + 1) / cards.length) * 100

  const handleNextCard = () => {
    if (currentIndex < cards.length - 1) {
      setCurrentIndex((idx) => idx + 1)
      setShowBack(false)
    }
  }

  const handlePrevCard = () => {
    if (currentIndex > 0) {
      setCurrentIndex((idx) => idx - 1)
      setShowBack(false)
    }
  }

  const handleRestartBatch = () => {
    setCurrentIndex(0)
    setShowBack(false)
  }

  return (
    <div className="space-y-6">
      {/* Batch + progress header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Studying</p>
            <p className="font-semibold text-foreground line-clamp-1">{textbookTitle}</p>
            <p className="text-xs text-muted-foreground">
              Batch {batchIndex + 1} of {totalBatches} · Card {currentIndex + 1} / {cards.length}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground hidden md:inline">Batch progress</span>
          <div className="w-40">
            <Progress value={progress} className="h-2" />
          </div>
        </div>
      </div>

      {/* Card */}
      <Card className="border-0 shadow-2xl overflow-hidden relative group">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-pink-500/5 to-orange-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        <CardHeader className="relative z-10 flex flex-row items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="text-sm font-semibold text-purple-700 dark:text-purple-200 flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              High-Impact Flashcard
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              Focus on understanding one concept at a time.
            </p>
          </div>
          <Badge variant="outline" className="text-xs">
            Card {currentIndex + 1} / {cards.length}
          </Badge>
        </CardHeader>
        <CardContent className="relative z-10 p-8 flex flex-col gap-6">
          {/* Front */}
          <div className={`transition-all duration-300 ${showBack ? 'opacity-60' : 'opacity-100'}`}>
            <div className="flex items-center gap-2 mb-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">
              <span className="inline-flex items-center gap-1">
                <Zap className="w-3 h-3" />
                Question
              </span>
              {currentCard.category && (
                <Badge variant="secondary" className="ml-2 text-[10px] px-2 py-0.5">
                  {currentCard.category}
                </Badge>
              )}
            </div>
            <div className="text-lg md:text-xl font-medium text-foreground leading-relaxed space-y-2">
              <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                {currentCard.front}
              </ReactMarkdown>
            </div>
          </div>

          {/* Back */}
          {showBack && (
            <div className="mt-4 pt-5 border-t border-border animate-in slide-in-from-bottom-4 duration-300">
              <div className="flex items-center gap-2 mb-3 text-xs font-medium text-emerald-600 dark:text-emerald-400 uppercase tracking-wide">
                <Eye className="w-3 h-3" />
                Answer
              </div>
              <div className="text-base md:text-lg text-foreground/90 leading-relaxed space-y-2">
                <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                  {currentCard.back}
                </ReactMarkdown>
              </div>

              {currentCard.keyTerms && currentCard.keyTerms.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {currentCard.keyTerms.map((term, idx) => (
                    <Badge key={idx} variant="secondary" className="text-[11px]">
                      {term}
                    </Badge>
                  ))}
                </div>
              )}

              {currentCard.mnemonic && (
                <div className="mt-4 p-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 text-sm text-amber-800 dark:text-amber-200 flex gap-2">
                  <Sparkles className="w-4 h-4 mt-0.5" />
                  <span>{currentCard.mnemonic}</span>
                </div>
              )}
            </div>
          )}

          {/* Reveal / navigation controls */}
          <div className="mt-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowBack((v) => !v)}
                className="gap-2"
              >
                <Eye className="w-4 h-4" />
                {showBack ? 'Hide Answer' : 'Reveal Answer'}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRestartBatch}
                className="text-xs text-muted-foreground"
              >
                Restart batch
              </Button>
            </div>

            <div className="flex items-center gap-2 justify-between md:justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrevCard}
                disabled={currentIndex === 0}
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleNextCard}
                disabled={currentIndex >= cards.length - 1}
              >
                Next
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Batch navigation + exit */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>Batch {batchIndex + 1} of {totalBatches}</span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={onPrevBatch}
            disabled={batchIndex === 0}
          >
            <ChevronLeft className="w-4 h-4 mr-1" /> Previous batch
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onNextBatch}
            disabled={batchIndex >= totalBatches - 1}
          >
            Next batch <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
          {onPracticeFeynman && (
            <Button
              variant="brand"
              size="sm"
              onClick={onPracticeFeynman}
              className="from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 dark:from-purple-500 dark:to-pink-500 dark:hover:from-purple-600 dark:hover:to-pink-600"
            >
              <Zap className="w-4 h-4 mr-1" />
              Practice Feynman
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={onExit}
          >
            Exit
          </Button>
        </div>
      </div>
    </div>
  )
}
