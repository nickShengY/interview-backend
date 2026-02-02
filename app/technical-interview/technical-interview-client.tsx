"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { InterviewQuestions } from "@/components/interview-questions"
import { Sparkles, Coins, Settings } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { INDUSTRIES, JOB_TITLES } from "@/data/technical-taxonomy"
import { SkillCombobox } from "@/components/skill-combobox"
import { PageHeader } from "@/components/page-header"
import { authFetch } from "@/lib/auth-fetch"

type GeneratedQuestion = {
  id: number
  question: string
  difficulty: string
  category: string
  expectedAnswer: string
}

export default function TechnicalInterviewPage() {
  const [industry, setIndustry] = useState("")
  const [occupation, setOccupation] = useState("")
  const [focus, setFocus] = useState("")
  const [questions, setQuestions] = useState<GeneratedQuestion[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const { toast } = useToast()

  const handleGenerateQuestions = async () => {
    if (!industry || !occupation || !focus) {
      toast({
        title: "Missing Information",
        description: "Please fill in all fields to generate questions.",
        variant: "destructive",
      })
      return
    }

    setIsGenerating(true)

    try {
      const res = await authFetch("/api/interview/technical", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ industry, title: occupation, focus }),
        dedupeKey: `credits:/api/interview/technical:${industry}:${occupation}:${focus}`,
      })

      if (!res.ok) {
        const error = await res.text()
        throw new Error(error || "Failed to generate questions")
      }

      const data: unknown = await res.json()
      const questionsValue =
        data && typeof data === "object" && "questions" in data
          ? (data as { questions: unknown }).questions
          : []
      const rawQuestions = Array.isArray(questionsValue) ? questionsValue : []
      const parsedQuestions: GeneratedQuestion[] = rawQuestions
        .map((q, i) => {
          const qObj = q && typeof q === "object" ? (q as Record<string, unknown>) : null
          const question = typeof qObj?.question === "string" ? qObj.question : ""
          if (!question) return null

          return {
            id: typeof qObj?.id === "number" ? qObj.id : i + 1,
            question,
            difficulty: typeof qObj?.difficulty === "string" ? qObj.difficulty : "Medium",
            category: typeof qObj?.category === "string" ? qObj.category : focus,
            expectedAnswer: typeof qObj?.expectedAnswer === "string" ? qObj.expectedAnswer : "",
          }
        })
        .filter((q): q is GeneratedQuestion => Boolean(q))

      setQuestions(parsedQuestions)
      toast({
        title: "Questions Generated!",
        description: `${parsedQuestions.length} technical interview questions are ready for practice.`,
      })
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('credits:update'))
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to generate questions. Please try again."
      toast({
        title: "Generation Failed",
        description: message,
        variant: "destructive",
      })
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <PageHeader
        title="Technical Interview Practice"
        description="Practice technical questions tailored to your industry and role. Earn credits for correct answers!"
        titleClassName="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent"
      />

      {!questions.length ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Settings className="w-5 h-5" />
              <span>Interview Configuration</span>
            </CardTitle>
            <CardDescription>Tell us about your target role to generate personalized questions</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="industry">Industry</Label>
                <Select value={industry} onValueChange={setIndustry}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select industry" />
                  </SelectTrigger>
                  <SelectContent>
                    {INDUSTRIES.map((name) => (
                      <SelectItem key={name} value={name.toLowerCase()}>{name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="occupation">Job Title</Label>
                <Select value={occupation} onValueChange={setOccupation}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select job title" />
                  </SelectTrigger>
                  <SelectContent>
                    {JOB_TITLES.map((name) => (
                      <SelectItem key={name} value={name.toLowerCase().replace(/\s+/g, '-')}>{name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="focus">Focus Area</Label>
                <SkillCombobox value={focus} onChange={setFocus} placeholder="Search skills, frameworks, clouds..." />
              </div>
            </div>

            <Card className="bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200 dark:from-purple-900/20 dark:to-pink-900/20 dark:border-purple-800">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-foreground">
                    <Coins className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                    <span className="font-medium">Cost: 1 credit (5 questions). Evaluation: 1 credit each</span>
                  </div>
                  <Button
                    onClick={handleGenerateQuestions}
                    disabled={isGenerating || !industry || !occupation || !focus}
                    variant="brand"
                  >
                    {isGenerating ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 mr-2" />
                        Generate Questions
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </CardContent>
        </Card>
      ) : (
        <InterviewQuestions questions={questions} type="technical" onReset={() => setQuestions([])} />
      )}
    </div>
  )
}
