"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { useBehavior } from "@/hooks/use-behavior"
import { toast } from "sonner"

export default function BehavioralInterviewPage() {
  const [industry, setIndustry] = useState("")
  const [title, setTitle] = useState("")
  const { loading, questions, generate } = useBehavior()
  const [answers, setAnswers] = useState<string[]>([])

  const handleGenerate = async () => {
    if (!industry || !title) return toast.error("Fill in fields")
    await generate(industry, title)
    setAnswers([])
  }

  return (
    <div className="max-w-3xl mx-auto py-10 space-y-8">
      <h1 className="text-3xl font-bold">Behavioral Interview Practice</h1>
      <div className="flex gap-4">
        <Input placeholder="Industry" value={industry} onChange={(e) => setIndustry(e.target.value)} />
        <Input placeholder="Job Title" value={title} onChange={(e) => setTitle(e.target.value)} />
      </div>
      <Button onClick={handleGenerate} disabled={loading}>
        {loading ? "Generating..." : "Generate Questions (-1 credit)"}
      </Button>

      {/* Breathing exercise visual */}
      <div className="flex justify-center">
        <div className="w-32 h-32 rounded-full bg-blue-300 animate-ping-slow" />
      </div>

      {questions.map((q, i) => (
        <div key={i} className="border p-4 rounded space-y-4">
          <p className="font-medium">
            {i + 1}. {q}
          </p>
          <Textarea
            rows={4}
            value={answers[i] || ""}
            onChange={(e) => {
              const arr = [...answers]
              arr[i] = e.target.value
              setAnswers(arr)
            }}
            placeholder="Reflect and answer here (no evaluation credit needed)"
          />
        </div>
      ))}
    </div>
  )
}
