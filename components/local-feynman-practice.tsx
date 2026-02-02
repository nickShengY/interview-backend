"use client"

import { useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  Brain,
  Lightbulb,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Sparkles,
  Send,
  RotateCcw,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import type { LocalFlashcard } from "@/lib/textbook/local-storage"
import { authFetch } from "@/lib/auth-fetch"

interface FeynmanEvaluation {
  score: number
  understood: string[]
  misunderstood: string[]
  missing: string[]
  feedback: string
  simpleExplanation: string
}

interface LocalFeynmanPracticeProps {
  textbookTitle: string
  cards: LocalFlashcard[]
}

export function LocalFeynmanPractice({ textbookTitle, cards }: LocalFeynmanPracticeProps) {
  const { toast } = useToast()
  const [selectedConcept, setSelectedConcept] = useState<string | null>(null)
  const [explanation, setExplanation] = useState("")
  const [isEvaluating, setIsEvaluating] = useState(false)
  const [evaluation, setEvaluation] = useState<FeynmanEvaluation | null>(null)

  const concepts = useMemo(() => {
    const termCounts = new Map<string, number>()

    for (const card of cards) {
      for (const term of card.keyTerms || []) {
        const key = term.trim()
        if (!key) continue
        termCounts.set(key, (termCounts.get(key) || 0) + 1)
      }
    }

    // Fallback to categories if there are very few key terms
    if (termCounts.size < 5) {
      for (const card of cards) {
        if (!card.category) continue
        const key = card.category.trim()
        if (!key) continue
        termCounts.set(key, (termCounts.get(key) || 0) + 1)
      }
    }

    const sorted = Array.from(termCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([term]) => term)

    return sorted.slice(0, 30)
  }, [cards])

  const handleEvaluate = async () => {
    if (!selectedConcept || !explanation.trim()) {
      toast({
        title: "Missing Information",
        description: "Please select a concept and write your explanation.",
        variant: "destructive",
      })
      return
    }

    if (explanation.trim().length < 50) {
      toast({
        title: "Explanation Too Short",
        description: "Please write a more detailed explanation (at least 50 characters).",
        variant: "destructive",
      })
      return
    }

    // Build a compact, local-only concept summary from the cards
    const matchingCards = cards.filter((card) => {
      const lower = selectedConcept.toLowerCase()
      return (
        card.category?.toLowerCase().includes(lower) ||
        (card.front && card.front.toLowerCase().includes(lower)) ||
        (card.keyTerms || []).some((t) => t.toLowerCase() === lower)
      )
    })

    const summarySnippets = matchingCards.slice(0, 6).map((card) => {
      const q = card.front.length > 120 ? card.front.slice(0, 117) + "..." : card.front
      const a = card.back.length > 160 ? card.back.slice(0, 157) + "..." : card.back
      return `Q: ${q}\nA: ${a}`
    })

    const conceptSummary = [
      `Textbook: ${textbookTitle}`,
      `Concept: ${selectedConcept}`,
      summarySnippets.length
        ? "Related flashcard views (question → answer):\n" + summarySnippets.join("\n\n")
        : "No strongly matching cards; rely mainly on the concept name and your explanation.",
    ].join("\n\n")

    setIsEvaluating(true)
    try {
      const trimmed = explanation.trim()
      const explanationSig = `${trimmed.length}:${trimmed.length ? trimmed.charCodeAt(0) : 0}:${trimmed.length ? trimmed.charCodeAt(trimmed.length - 1) : 0}`
      const res = await authFetch("/api/textbook/local-feynman", {
        method: "POST",
        dedupeKey: `credits:/api/textbook/local-feynman:${selectedConcept}:${explanationSig}`,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          concept: selectedConcept,
          explanation,
          conceptSummary,
        }),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => null)
        throw new Error(err?.error || "Failed to evaluate explanation")
      }

      const data = await res.json()
      setEvaluation(data.evaluation)
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("credits:update"))
      }
    } catch (error) {
      toast({
        title: "Evaluation Failed",
        description: error instanceof Error ? error.message : "Could not evaluate your explanation. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsEvaluating(false)
    }
  }

  const handleReset = () => {
    setSelectedConcept(null)
    setExplanation("")
    setEvaluation(null)
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return "from-green-500 to-emerald-500"
    if (score >= 60) return "from-blue-500 to-cyan-500"
    if (score >= 40) return "from-amber-500 to-orange-500"
    return "from-red-500 to-rose-500"
  }

  // Results view
  if (evaluation) {
    return (
      <div className="space-y-6">
        {/* Score Card */}
        <Card className="border-0 shadow-xl overflow-hidden">
          <div className={`h-2 bg-gradient-to-r ${getScoreColor(evaluation.score)}`} />
          <CardContent className="p-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-bold text-foreground">
                  Your Feynman Score
                </h3>
                <p className="text-muted-foreground">Understanding of: {selectedConcept}</p>
              </div>
              <div
                className={`text-5xl font-bold bg-gradient-to-r ${getScoreColor(
                  evaluation.score,
                )} bg-clip-text text-transparent`}
              >
                {evaluation.score}%
              </div>
            </div>
            <Progress value={evaluation.score} className="h-3" />
          </CardContent>
        </Card>

        {/* Feedback Sections */}
        <div className="grid md:grid-cols-3 gap-4">
          {/* Understood */}
          <Card className="border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-900/10">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2 text-green-700 dark:text-green-300">
                <CheckCircle className="w-4 h-4" />
                You Understood
              </CardTitle>
            </CardHeader>
            <CardContent>
              {evaluation.understood.length > 0 ? (
                <ul className="space-y-1 text-sm text-foreground/90">
                  {evaluation.understood.map((item, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-green-500 mt-1">•</span>
                      {item}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">No concepts identified as understood</p>
              )}
            </CardContent>
          </Card>

          {/* Misunderstood */}
          <Card className="border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-900/10">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2 text-red-700 dark:text-red-300">
                <XCircle className="w-4 h-4" />
                Needs Correction
              </CardTitle>
            </CardHeader>
            <CardContent>
              {evaluation.misunderstood.length > 0 ? (
                <ul className="space-y-1 text-sm text-foreground/90">
                  {evaluation.misunderstood.map((item, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-red-500 mt-1">•</span>
                      {item}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">No misconceptions identified</p>
              )}
            </CardContent>
          </Card>

          {/* Missing */}
          <Card className="border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-900/10">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2 text-amber-700 dark:text-amber-300">
                <AlertTriangle className="w-4 h-4" />
                Missing Concepts
              </CardTitle>
            </CardHeader>
            <CardContent>
              {evaluation.missing.length > 0 ? (
                <ul className="space-y-1 text-sm text-foreground/90">
                  {evaluation.missing.map((item, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-amber-500 mt-1">•</span>
                      {item}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">You covered all key concepts!</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Detailed Feedback */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-purple-500" />
              Feedback & Improvement Tips
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-foreground/90">{evaluation.feedback}</p>

            <div className="p-4 rounded-xl bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-4 h-4 text-purple-600" />
                <span className="font-medium text-purple-800 dark:text-purple-200">
                  Model Simple Explanation
                </span>
              </div>
              <p className="text-sm text-foreground/90 italic">
                &quot;{evaluation.simpleExplanation}&quot;
              </p>
            </div>
          </CardContent>
        </Card>

        <Button onClick={handleReset} variant="outline" className="w-full">
          <RotateCcw className="w-4 h-4 mr-2" />
          Try Another Concept
        </Button>
      </div>
    )
  }

  // Input view
  return (
    <div className="space-y-6">
      {/* Intro Card */}
      <Card className="border-0 shadow-lg overflow-hidden bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center flex-shrink-0">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-foreground">Feynman Technique Coach</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Explain a concept from &quot;{textbookTitle}&quot; in your own words. We&apos;ll analyze your explanation using the
                Feynman Technique and show you exactly what you understood, misunderstood, and missed.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Concept Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">1. Choose a Concept to Explain</CardTitle>
          <CardDescription>
            Select a key term or topic extracted from your flashcards
          </CardDescription>
        </CardHeader>
        <CardContent>
          {concepts.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {concepts.map((concept) => (
                <Badge
                  key={concept}
                  variant={selectedConcept === concept ? "default" : "outline"}
                  className={`cursor-pointer transition-all px-3 py-1.5 ${
                    selectedConcept === concept
                      ? "bg-gradient-to-r from-purple-600 to-pink-600"
                      : "hover:border-purple-400"
                  }`}
                  onClick={() => setSelectedConcept(concept)}
                >
                  {concept}
                </Badge>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">
              No concepts available. Generate flashcards first to extract key concepts.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Explanation Input */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">2. Explain It Simply</CardTitle>
          <CardDescription>
            Explain the concept as if you&apos;re teaching it to a curious 10-year-old. Use simple words and avoid jargon.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            placeholder="Write your explanation here... Pretend you're explaining to a 10-year-old who asks 'why?' a lot."
            value={explanation}
            onChange={(e) => setExplanation(e.target.value)}
            className="min-h-[200px] resize-none"
          />
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>{explanation.length} characters</span>
            <span>Minimum 50 characters required</span>
          </div>
        </CardContent>
      </Card>

      {/* Submit Button */}
      <Button
        onClick={handleEvaluate}
        disabled={!selectedConcept || explanation.length < 50 || isEvaluating}
        variant="brand"
        className="w-full h-12 from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 dark:from-purple-500 dark:to-pink-500 dark:hover:from-purple-600 dark:hover:to-pink-600"
      >
        {isEvaluating ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
            Evaluating Your Understanding...
          </>
        ) : (
          <>
            <Send className="w-4 h-4 mr-2" />
            Evaluate My Explanation
          </>
        )}
      </Button>
    </div>
  )
}
