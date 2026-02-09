"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Flame, Trophy, Calendar, Clock, Sparkles, Send, CheckCircle, Lightbulb, Target, Zap, Star } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { PageHeader } from "@/components/page-header"

type DailyQuestion = {
  id: string
  question: string
  category: string
  difficulty: "Easy" | "Medium" | "Hard"
  hint: string
  date: string
}

type StreakData = {
  currentStreak: number
  longestStreak: number
  totalCompleted: number
  lastCompletedDate: string | null
  history: { date: string; completed: boolean; category: string }[]
}

const QUESTION_POOL: DailyQuestion[] = [
  { id: "d1", question: "Tell me about a time you had to learn something new quickly to complete a project. What was your approach?", category: "Adaptability", difficulty: "Medium", hint: "Use STAR method. Focus on your learning strategy and the measurable outcome.", date: "" },
  { id: "d2", question: "Describe a situation where you disagreed with your manager. How did you handle it?", category: "Conflict Resolution", difficulty: "Hard", hint: "Show diplomacy, active listening, and a constructive outcome.", date: "" },
  { id: "d3", question: "What's your approach to prioritizing multiple urgent tasks with competing deadlines?", category: "Time Management", difficulty: "Medium", hint: "Mention frameworks (Eisenhower matrix, etc.) and give a concrete example.", date: "" },
  { id: "d4", question: "Tell me about a project that failed. What did you learn from it?", category: "Growth Mindset", difficulty: "Hard", hint: "Be honest about the failure, focus on insights and how you applied them later.", date: "" },
  { id: "d5", question: "How do you explain complex technical concepts to non-technical stakeholders?", category: "Communication", difficulty: "Easy", hint: "Give a specific example with analogies or visuals you've used.", date: "" },
  { id: "d6", question: "Describe a time when you went above and beyond for a customer or colleague.", category: "Initiative", difficulty: "Easy", hint: "Quantify the impact if possible. Show genuine care.", date: "" },
  { id: "d7", question: "How do you stay updated with the latest trends and technologies in your field?", category: "Continuous Learning", difficulty: "Easy", hint: "Be specific — mention newsletters, communities, courses, conferences.", date: "" },
  { id: "d8", question: "Tell me about a time you had to make a decision with incomplete information.", category: "Decision Making", difficulty: "Hard", hint: "Show your risk assessment process and how you mitigated uncertainty.", date: "" },
  { id: "d9", question: "Describe your most impactful contribution to a team project.", category: "Teamwork", difficulty: "Medium", hint: "Focus on collaboration, your specific role, and measurable results.", date: "" },
  { id: "d10", question: "How would you handle a situation where a team member isn't pulling their weight?", category: "Leadership", difficulty: "Medium", hint: "Show empathy first, then accountability. Focus on the conversation approach.", date: "" },
  { id: "d11", question: "What's your process for debugging a complex issue you've never seen before?", category: "Problem Solving", difficulty: "Medium", hint: "Walk through your systematic approach: reproduce, isolate, hypothesis, test.", date: "" },
  { id: "d12", question: "Tell me about a time you had to persuade someone to see things your way.", category: "Influence", difficulty: "Medium", hint: "Show data-driven arguments combined with emotional intelligence.", date: "" },
  { id: "d13", question: "How do you handle receiving critical feedback?", category: "Self-Awareness", difficulty: "Easy", hint: "Show you're open to feedback. Give an example of feedback that changed your behavior.", date: "" },
  { id: "d14", question: "Describe a situation where you had to work with someone very different from you.", category: "Diversity", difficulty: "Medium", hint: "Show respect for differences and how diverse perspectives improved outcomes.", date: "" },
  { id: "d15", question: "What's the most innovative solution you've implemented at work?", category: "Innovation", difficulty: "Hard", hint: "Describe the problem, your creative approach, and the measurable impact.", date: "" },
  { id: "d16", question: "How do you balance quality with speed when under deadline pressure?", category: "Judgment", difficulty: "Medium", hint: "Show pragmatic thinking — MVP vs. perfect, and how you communicate trade-offs.", date: "" },
  { id: "d17", question: "Tell me about a time you mentored someone. What was the outcome?", category: "Leadership", difficulty: "Medium", hint: "Focus on their growth, your approach, and what you learned from mentoring.", date: "" },
  { id: "d18", question: "How do you approach setting goals for yourself? Give an example.", category: "Goal Setting", difficulty: "Easy", hint: "Mention SMART goals or OKRs with a specific personal example.", date: "" },
  { id: "d19", question: "Describe a time when you identified a process that could be improved. What did you do?", category: "Initiative", difficulty: "Medium", hint: "Show proactiveness, data collection, implementation, and results.", date: "" },
  { id: "d20", question: "What would you do in your first 90 days in this new role?", category: "Strategy", difficulty: "Hard", hint: "Show a phased approach: listen/learn (30), contribute (60), lead (90).", date: "" },
  { id: "d21", question: "Tell me about a time you had to manage up — influence a senior stakeholder.", category: "Influence", difficulty: "Hard", hint: "Show strategic communication and how you built credibility.", date: "" },
  { id: "d22", question: "How do you handle ambiguity in your work?", category: "Adaptability", difficulty: "Medium", hint: "Give an example where you created structure from chaos.", date: "" },
  { id: "d23", question: "Describe a situation where you received conflicting requirements from different stakeholders.", category: "Stakeholder Management", difficulty: "Hard", hint: "Show how you facilitated alignment and made trade-off decisions.", date: "" },
  { id: "d24", question: "What's your approach to giving constructive feedback to a peer?", category: "Communication", difficulty: "Easy", hint: "Mention frameworks like SBI (Situation-Behavior-Impact) with a real example.", date: "" },
  { id: "d25", question: "Tell me about a time you had to quickly adapt to a major change at work.", category: "Resilience", difficulty: "Medium", hint: "Show flexibility, positive attitude, and how you helped others adapt too.", date: "" },
  { id: "d26", question: "How do you measure success in your current role?", category: "Self-Awareness", difficulty: "Easy", hint: "Connect personal metrics to business outcomes. Be specific.", date: "" },
  { id: "d27", question: "Describe a cross-functional project you led or contributed to significantly.", category: "Collaboration", difficulty: "Medium", hint: "Highlight coordination challenges and how you bridged different teams.", date: "" },
  { id: "d28", question: "What's a technical skill you recently taught yourself? How did you learn it?", category: "Continuous Learning", difficulty: "Easy", hint: "Show your self-learning process and how you applied the new skill.", date: "" },
  { id: "d29", question: "Tell me about a time when you had to deliver bad news to a client or stakeholder.", category: "Communication", difficulty: "Hard", hint: "Show honesty, empathy, and a solution-oriented approach.", date: "" },
  { id: "d30", question: "Why are you interested in this role, and what unique value would you bring?", category: "Motivation", difficulty: "Medium", hint: "Connect your genuine interest to specific company needs and your proven strengths.", date: "" },
]

function getTodayString(): string {
  return new Date().toISOString().split("T")[0]
}

function getDailyQuestion(dateStr: string): DailyQuestion {
  const dayOfYear = Math.floor((new Date(dateStr).getTime() - new Date(new Date(dateStr).getFullYear(), 0, 0).getTime()) / 86400000)
  const index = dayOfYear % QUESTION_POOL.length
  return { ...QUESTION_POOL[index], date: dateStr }
}

function loadStreak(): StreakData {
  if (typeof window === "undefined") return { currentStreak: 0, longestStreak: 0, totalCompleted: 0, lastCompletedDate: null, history: [] }
  try {
    const raw = localStorage.getItem("daily_challenge_streak")
    if (raw) return JSON.parse(raw)
  } catch {}
  return { currentStreak: 0, longestStreak: 0, totalCompleted: 0, lastCompletedDate: null, history: [] }
}

function saveStreak(data: StreakData) {
  if (typeof window === "undefined") return
  localStorage.setItem("daily_challenge_streak", JSON.stringify(data))
}

function loadTodayAnswer(): string {
  if (typeof window === "undefined") return ""
  try {
    const raw = localStorage.getItem(`daily_answer_${getTodayString()}`)
    return raw || ""
  } catch { return "" }
}

function saveTodayAnswer(answer: string) {
  if (typeof window === "undefined") return
  localStorage.setItem(`daily_answer_${getTodayString()}`, answer)
}

export default function DailyChallengeClient() {
  const today = getTodayString()
  const [question, setQuestion] = useState<DailyQuestion>(getDailyQuestion(today))
  const [answer, setAnswer] = useState("")
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [showHint, setShowHint] = useState(false)
  const [streak, setStreak] = useState<StreakData>(loadStreak())
  const { toast } = useToast()

  useEffect(() => {
    const s = loadStreak()
    setStreak(s)
    const savedAnswer = loadTodayAnswer()
    if (savedAnswer) {
      setAnswer(savedAnswer)
      setIsSubmitted(true)
    }
    // Reset streak if user missed a day
    if (s.lastCompletedDate) {
      const lastDate = new Date(s.lastCompletedDate)
      const todayDate = new Date(today)
      const diff = Math.floor((todayDate.getTime() - lastDate.getTime()) / 86400000)
      if (diff > 1) {
        const updated = { ...s, currentStreak: 0 }
        setStreak(updated)
        saveStreak(updated)
      }
    }
  }, [today])

  const handleSubmit = useCallback(() => {
    if (!answer.trim() || answer.trim().length < 20) {
      toast({ title: "Too Short", description: "Please write a more detailed answer (at least 20 characters).", variant: "destructive" })
      return
    }
    saveTodayAnswer(answer)
    setIsSubmitted(true)

    const isAlreadyDone = streak.lastCompletedDate === today
    if (!isAlreadyDone) {
      const newStreak: StreakData = {
        currentStreak: streak.currentStreak + 1,
        longestStreak: Math.max(streak.longestStreak, streak.currentStreak + 1),
        totalCompleted: streak.totalCompleted + 1,
        lastCompletedDate: today,
        history: [...streak.history.slice(-89), { date: today, completed: true, category: question.category }],
      }
      setStreak(newStreak)
      saveStreak(newStreak)
      toast({ title: `Day ${newStreak.currentStreak} Complete! 🔥`, description: newStreak.currentStreak >= 7 ? "Amazing streak! Keep it up!" : "Great job practicing today!" })
    }
  }, [answer, streak, today, question.category, toast])

  const getDifficultyColor = (d: string) => {
    if (d === "Easy") return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
    if (d === "Medium") return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
    return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
  }

  // Calendar heatmap for last 30 days
  const last30Days = Array.from({ length: 30 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (29 - i))
    const dateStr = d.toISOString().split("T")[0]
    const entry = streak.history.find(h => h.date === dateStr)
    return { date: dateStr, completed: entry?.completed || false, day: d.getDate() }
  })

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <PageHeader
        title="Daily Interview Challenge"
        description="One question a day sharpens your interview skills. Build a streak and track your growth!"
        titleClassName="bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent"
      />

      {/* Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { icon: Flame, label: "Current Streak", value: `${streak.currentStreak} days`, color: "text-orange-600", bg: "from-orange-50 to-red-50 dark:from-orange-900/10 dark:to-red-900/10" },
          { icon: Trophy, label: "Longest Streak", value: `${streak.longestStreak} days`, color: "text-yellow-600", bg: "from-yellow-50 to-amber-50 dark:from-yellow-900/10 dark:to-amber-900/10" },
          { icon: Target, label: "Total Completed", value: `${streak.totalCompleted}`, color: "text-blue-600", bg: "from-blue-50 to-indigo-50 dark:from-blue-900/10 dark:to-indigo-900/10" },
          { icon: Zap, label: "Consistency", value: `${streak.totalCompleted > 0 ? Math.round((streak.history.filter(h => h.completed).length / Math.max(streak.history.length, 1)) * 100) : 0}%`, color: "text-purple-600", bg: "from-purple-50 to-pink-50 dark:from-purple-900/10 dark:to-pink-900/10" },
        ].map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.label} className={`bg-gradient-to-br ${stat.bg} border-0 shadow-sm`}>
              <CardContent className="pt-4 pb-3 text-center">
                <Icon className={`w-6 h-6 mx-auto mb-1 ${stat.color}`} />
                <p className="text-xl font-bold">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Streak Calendar */}
      <Card className="border-0 shadow-lg">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2"><Calendar className="w-4 h-4" /> Last 30 Days</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-1 flex-wrap">
            {last30Days.map((d) => (
              <div
                key={d.date}
                className={`w-8 h-8 rounded-md flex items-center justify-center text-xs font-medium transition-all ${
                  d.date === today
                    ? "ring-2 ring-orange-500 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300"
                    : d.completed
                    ? "bg-green-500 text-white"
                    : "bg-muted/40 text-muted-foreground"
                }`}
                title={d.date}
              >
                {d.day}
              </div>
            ))}
          </div>
          <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
            <div className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-green-500" /> Completed</div>
            <div className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-muted/40" /> Missed</div>
            <div className="flex items-center gap-1"><div className="w-3 h-3 rounded ring-2 ring-orange-500 bg-orange-100" /> Today</div>
          </div>
        </CardContent>
      </Card>

      {/* Today's Question */}
      <Card className="border-0 shadow-xl overflow-hidden">
        <div className="bg-gradient-to-r from-orange-600 to-red-600 p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-orange-100 flex items-center gap-1"><Clock className="w-4 h-4" /> Today&apos;s Challenge — {new Date(today).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
              <h3 className="text-xl font-bold mt-2">{question.question}</h3>
            </div>
          </div>
          <div className="flex gap-2 mt-3">
            <Badge className={getDifficultyColor(question.difficulty)}>{question.difficulty}</Badge>
            <Badge className="bg-white/20 text-white">{question.category}</Badge>
          </div>
        </div>

        <CardContent className="pt-6 space-y-4">
          {!isSubmitted ? (
            <>
              <Textarea
                placeholder="Write your answer here using the STAR method (Situation, Task, Action, Result)..."
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                rows={8}
                className="text-base"
              />
              <div className="flex items-center justify-between">
                <Button variant="outline" size="sm" onClick={() => setShowHint(!showHint)}>
                  <Lightbulb className={`w-4 h-4 mr-1 ${showHint ? "text-yellow-500" : ""}`} />
                  {showHint ? "Hide Hint" : "Show Hint"}
                </Button>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">{answer.length} chars</span>
                  <Button onClick={handleSubmit} disabled={!answer.trim()} variant="brand" className="from-orange-600 to-red-600">
                    <Send className="w-4 h-4 mr-2" /> Submit Answer
                  </Button>
                </div>
              </div>
              {showHint && (
                <Card className="bg-yellow-50 dark:bg-yellow-900/10 border-yellow-200 dark:border-yellow-800">
                  <CardContent className="pt-4 flex items-start gap-2">
                    <Lightbulb className="w-5 h-5 text-yellow-500 shrink-0 mt-0.5" />
                    <p className="text-sm text-foreground/80">{question.hint}</p>
                  </CardContent>
                </Card>
              )}
            </>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle className="w-6 h-6" />
                <span className="font-bold text-lg">Challenge Complete!</span>
                {streak.currentStreak >= 3 && <Badge className="bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200">🔥 {streak.currentStreak} day streak</Badge>}
              </div>
              <div className="bg-muted/20 rounded-lg p-4 border border-border">
                <p className="text-sm font-medium text-muted-foreground mb-2">Your Answer:</p>
                <p className="text-foreground/90 whitespace-pre-line">{answer}</p>
              </div>
              <Card className="bg-yellow-50 dark:bg-yellow-900/10 border-yellow-200 dark:border-yellow-800">
                <CardContent className="pt-4">
                  <p className="text-sm font-medium text-yellow-700 dark:text-yellow-300 mb-1 flex items-center gap-1"><Lightbulb className="w-4 h-4" /> Coaching Tip:</p>
                  <p className="text-sm text-foreground/80">{question.hint}</p>
                </CardContent>
              </Card>
              <p className="text-sm text-muted-foreground text-center">Come back tomorrow for a new challenge! 🎯</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Milestone Badges */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2"><Star className="w-5 h-5 text-yellow-500" /> Achievement Badges</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { name: "First Step", desc: "Complete 1 challenge", threshold: 1, icon: "🎯" },
              { name: "Committed", desc: "7-day streak", threshold: 7, icon: "🔥" },
              { name: "Dedicated", desc: "14-day streak", threshold: 14, icon: "⚡" },
              { name: "Unstoppable", desc: "30-day streak", threshold: 30, icon: "🏆" },
              { name: "Explorer", desc: "Complete 10 challenges", threshold: 10, icon: "🧭" },
              { name: "Veteran", desc: "Complete 25 challenges", threshold: 25, icon: "🎖️" },
              { name: "Master", desc: "Complete 50 challenges", threshold: 50, icon: "👑" },
              { name: "Legend", desc: "Complete 100 challenges", threshold: 100, icon: "🌟" },
            ].map((badge) => {
              const earned = badge.name.includes("streak")
                ? streak.longestStreak >= badge.threshold
                : streak.totalCompleted >= badge.threshold
              return (
                <div
                  key={badge.name}
                  className={`p-3 rounded-lg border text-center transition-all ${
                    earned
                      ? "bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-yellow-900/10 dark:to-amber-900/10 border-yellow-300 dark:border-yellow-700 shadow-sm"
                      : "bg-muted/10 border-border opacity-50"
                  }`}
                >
                  <span className="text-2xl">{badge.icon}</span>
                  <p className="font-medium text-xs mt-1">{badge.name}</p>
                  <p className="text-xs text-muted-foreground">{badge.desc}</p>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
