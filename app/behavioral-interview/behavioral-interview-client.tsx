"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { InterviewQuestions } from "@/components/interview-questions"
import { BreathingExercise } from "@/components/breathing-exercise"
import { Sparkles, Coins, Settings, Wind } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { PageHeader } from "@/components/page-header"
import { authFetch } from "@/lib/auth-fetch"

type GeneratedQuestion = {
  id: number
  question: string
  difficulty: string
  category: string
  expectedAnswer: string
}

export default function BehavioralInterviewPage() {
  const [industry, setIndustry] = useState("")
  const [jobTitle, setJobTitle] = useState("")
  const [questions, setQuestions] = useState<GeneratedQuestion[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [showBreathing, setShowBreathing] = useState(false)
  const { toast } = useToast()
  const [profile, setProfile] = useState<{ name?: string | null; email?: string | null; country?: string | null; mbti?: string | null; sign?: string | null } | null>(null)

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const res = await authFetch('/api/user/profile')
        if (res.ok) {
          const p = await res.json()
          if (mounted) setProfile(p)
        }
      } catch {
        // ignore
      }
    })()
    return () => { mounted = false }
  }, [])

  const handleGenerateQuestions = async () => {
    if (!industry || !jobTitle) {
      toast({
        title: "Missing Information",
        description: "Please select both industry and job title to generate questions.",
        variant: "destructive",
      })
      return
    }

    setIsGenerating(true)

    try {
      const res = await authFetch("/api/interview/behavioral", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ industry, title: jobTitle }),
        dedupeKey: `credits:/api/interview/behavioral:${industry}:${jobTitle}`,
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
            category: typeof qObj?.category === "string" ? qObj.category : "Behavioral",
            expectedAnswer: typeof qObj?.expectedAnswer === "string" ? qObj.expectedAnswer : "",
          }
        })
        .filter((q): q is GeneratedQuestion => Boolean(q))

      setQuestions(parsedQuestions)
      toast({
        title: "Questions Generated!",
        description: `${parsedQuestions.length} personalized behavioral questions are ready for practice.`,
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
        title="Behavioral Interview Practice"
        description={
          "Practice behavioral questions personalized to your profile and industry. Includes breathing exercises for relaxation."
        }
        titleClassName="bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent"
      />

      {/* Floating Breathing Exercise Button */}
      <div className="fixed bottom-8 right-8 z-40">
        <Button
          onClick={() => setShowBreathing(true)}
          size="fab"
          variant="brand"
          className="from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 dark:to-cyan-500 dark:hover:to-cyan-600 shadow-lg hover:shadow-xl animate-pulse"
        >
          <Wind className="w-6 h-6" />
        </Button>
      </div>

      {!questions.length ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Settings className="w-5 h-5" />
              <span>Interview Configuration</span>
            </CardTitle>
            <CardDescription>
              Tell us about your target role. We&apos;ll use your profile information to generate personalized questions.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="industry">Industry</Label>
                <Select value={industry} onValueChange={setIndustry}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select industry" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="technology">Technology</SelectItem>
                    <SelectItem value="finance">Finance</SelectItem>
                    <SelectItem value="healthcare">Healthcare</SelectItem>
                    <SelectItem value="consulting">Consulting</SelectItem>
                    <SelectItem value="marketing">Marketing</SelectItem>
                    <SelectItem value="sales">Sales</SelectItem>
                    <SelectItem value="operations">Operations</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="jobTitle">Job Title</Label>
                <Select value={jobTitle} onValueChange={setJobTitle}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select job title" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="software-engineer">Software Engineer</SelectItem>
                    <SelectItem value="product-manager">Product Manager</SelectItem>
                    <SelectItem value="data-analyst">Data Analyst</SelectItem>
                    <SelectItem value="marketing-manager">Marketing Manager</SelectItem>
                    <SelectItem value="sales-representative">Sales Representative</SelectItem>
                    <SelectItem value="project-manager">Project Manager</SelectItem>
                    <SelectItem value="business-analyst">Business Analyst</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Profile Info Display (real data) */}
            <Card className="bg-muted/30">
              <CardHeader>
                <CardTitle className="text-lg">Your Profile Information</CardTitle>
                <CardDescription>Questions will be personalized based on your MBTI type and background</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4 text-sm text-foreground">
                  <div>
                    <span className="font-medium">MBTI Type:</span> {profile?.mbti || 'Not set'}
                  </div>
                  <div>
                    <span className="font-medium">Zodiac Sign:</span> {profile?.sign || 'Not set'}
                  </div>
                  <div>
                    <span className="font-medium">Country:</span> {profile?.country || 'Not set'}
                  </div>
                  <div>
                    <span className="font-medium">Email:</span> {profile?.email || '—'}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-pink-50 to-purple-50 dark:from-pink-900/20 dark:to-purple-900/20 border-pink-200 dark:border-pink-700">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-foreground">
                    <Coins className="w-5 h-5 text-pink-600 dark:text-pink-400" />
                    <span className="font-medium">Cost: 1 credit (5 questions). Evaluation: 1 credit each</span>
                  </div>
                  <Button
                    onClick={handleGenerateQuestions}
                    disabled={isGenerating || !industry || !jobTitle}
                    variant="brand"
                    className="from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 dark:from-pink-500 dark:to-purple-500 dark:hover:from-pink-600 dark:hover:to-purple-600"
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
        <InterviewQuestions questions={questions} type="behavioral" onReset={() => setQuestions([])} />
      )}

      {/* Breathing Exercise Modal */}
      {showBreathing && <BreathingExercise onClose={() => setShowBreathing(false)} />}
    </div>
  )
}
