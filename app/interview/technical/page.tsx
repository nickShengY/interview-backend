"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { useTechnical } from "@/hooks/use-technical"
import { toast } from "sonner"
import { authFetch } from "@/lib/auth-fetch"

export default function TechnicalInterviewPage() {
  const [industry, setIndustry] = useState("")
  const [title, setTitle] = useState("")
  const [focus, setFocus] = useState("")

  const { loading, questions, generate } = useTechnical()
  const [answers, setAnswers] = useState<string[]>([])
  const [results, setResults] = useState<{ correct: boolean; won: boolean }[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleGenerate = async () => {
    if (!industry || !title || !focus) {
      toast.error("Fill in all fields")
      return
    }
    await generate(industry, title, focus)
    setAnswers([])
    setResults([])
  }

  const handleSubmitAnswer = async (idx: number) => {
    const answer = answers[idx]
    if (!answer) return toast.error("Please type an answer")
    if (isSubmitting) return
    try {
      setIsSubmitting(true)
      const trimmed = answer.trim()
      const answerSig = `${trimmed.length}:${trimmed.length ? trimmed.charCodeAt(0) : 0}:${
        trimmed.length ? trimmed.charCodeAt(trimmed.length - 1) : 0
      }`
      const res = await authFetch("/api/interview/evaluate", {
        method: "POST",
        body: JSON.stringify({ question: questions[idx], answer, type: "technical" }),
        headers: { "Content-Type": "application/json" },
        dedupeKey: `credits:/api/interview/evaluate:technical:${idx}:${answerSig}`,
      })
      const json = await res.json()
      const newResults = [...results]
      newResults[idx] = json
      setResults(newResults)
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("credits:update"))
      }
    } catch {
      toast.error("Evaluation failed")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto py-10 space-y-8">
      <h1 className="text-3xl font-bold">Technical Interview Practice</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Input placeholder="Industry" value={industry} onChange={(e) => setIndustry(e.target.value)} />
        <Input placeholder="Job Title" value={title} onChange={(e) => setTitle(e.target.value)} />
        <Input placeholder="Focus" value={focus} onChange={(e) => setFocus(e.target.value)} />
      </div>
      <Button onClick={handleGenerate} disabled={loading}>
        {loading ? "Generating..." : "Generate Questions (-1 credit)"}
      </Button>

      {questions.map((q, i) => (
        <div key={i} className="border p-4 rounded space-y-4">
          <p className="font-medium">
            {i + 1}. {q}
          </p>
          <Textarea
            rows={3}
            value={answers[i] || ""}
            onChange={(e) => {
              const arr = [...answers]
              arr[i] = e.target.value
              setAnswers(arr)
            }}
            placeholder="Type your answer here or use voice input"
          />
          <Button onClick={() => handleSubmitAnswer(i)} disabled={isSubmitting}>Submit Answer</Button>
          {results[i] && (
            <p className={`mt-2 font-semibold ${results[i].correct ? 'text-green-600' : 'text-red-600'}`}>
              {results[i].correct ? "Correct!" : "Incorrect."} {results[i].won && "You won +5 credits!"}
            </p>
          )}
        </div>
      ))}
    </div>
  )
}
