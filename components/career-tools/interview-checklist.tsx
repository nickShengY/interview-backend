"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { ClipboardCheck, Clock, CheckCircle, Circle, RotateCcw, Briefcase, Laptop, Brain, Shirt, MapPin } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

type ChecklistItem = {
  id: string
  text: string
  category: string
  timeframe: string
  checked: boolean
}

const DEFAULT_CHECKLIST: Omit<ChecklistItem, "checked">[] = [
  // 1 Week Before
  { id: "w1", text: "Research the company thoroughly — mission, values, recent news, products", category: "Research", timeframe: "1 Week Before" },
  { id: "w2", text: "Review the job description and prepare specific examples for each requirement", category: "Preparation", timeframe: "1 Week Before" },
  { id: "w3", text: "Practice your STAR stories (check your Story Bank!)", category: "Practice", timeframe: "1 Week Before" },
  { id: "w4", text: "Prepare 5-7 thoughtful questions to ask the interviewer", category: "Preparation", timeframe: "1 Week Before" },
  { id: "w5", text: "Do a mock interview with a friend or use our AI practice tools", category: "Practice", timeframe: "1 Week Before" },
  { id: "w6", text: "Update your LinkedIn profile and check your online presence", category: "Branding", timeframe: "1 Week Before" },
  // 1 Day Before
  { id: "d1", text: "Confirm interview time, location/link, and interviewer names", category: "Logistics", timeframe: "1 Day Before" },
  { id: "d2", text: "Plan your outfit — professional, clean, and appropriate for the company culture", category: "Appearance", timeframe: "1 Day Before" },
  { id: "d3", text: "Print extra copies of your resume (for in-person interviews)", category: "Materials", timeframe: "1 Day Before" },
  { id: "d4", text: "Test your technology — camera, microphone, internet connection (for virtual)", category: "Tech", timeframe: "1 Day Before" },
  { id: "d5", text: "Prepare a portfolio or work samples if applicable", category: "Materials", timeframe: "1 Day Before" },
  { id: "d6", text: "Review your elevator pitch one more time", category: "Practice", timeframe: "1 Day Before" },
  { id: "d7", text: "Get a good night's sleep — aim for 7-8 hours", category: "Wellness", timeframe: "1 Day Before" },
  // Morning Of
  { id: "m1", text: "Eat a healthy breakfast and hydrate", category: "Wellness", timeframe: "Morning Of" },
  { id: "m2", text: "Do a 5-minute breathing exercise (use our Breathing tool!)", category: "Wellness", timeframe: "Morning Of" },
  { id: "m3", text: "Review key talking points and your cheat sheet", category: "Preparation", timeframe: "Morning Of" },
  { id: "m4", text: "Arrive 10-15 minutes early or log in 5 minutes before", category: "Logistics", timeframe: "Morning Of" },
  { id: "m5", text: "Silence your phone and close unnecessary apps/tabs", category: "Tech", timeframe: "Morning Of" },
  { id: "m6", text: "Have a glass of water, notepad, and pen ready", category: "Materials", timeframe: "Morning Of" },
  // After Interview
  { id: "a1", text: "Send a thank-you email within 24 hours", category: "Follow-up", timeframe: "After Interview" },
  { id: "a2", text: "Write down questions asked and your answers for future reference", category: "Review", timeframe: "After Interview" },
  { id: "a3", text: "Connect with interviewer(s) on LinkedIn with a personalized note", category: "Networking", timeframe: "After Interview" },
  { id: "a4", text: "Reflect on what went well and areas to improve", category: "Review", timeframe: "After Interview" },
]

const TIMEFRAME_ICONS: Record<string, typeof Clock> = {
  "1 Week Before": Briefcase,
  "1 Day Before": Laptop,
  "Morning Of": Brain,
  "After Interview": MapPin,
}

const TIMEFRAME_COLORS: Record<string, string> = {
  "1 Week Before": "from-blue-500 to-indigo-500",
  "1 Day Before": "from-violet-500 to-purple-500",
  "Morning Of": "from-amber-500 to-orange-500",
  "After Interview": "from-emerald-500 to-teal-500",
}

function loadChecklist(): ChecklistItem[] {
  if (typeof window === "undefined") return DEFAULT_CHECKLIST.map(i => ({ ...i, checked: false }))
  try {
    const raw = localStorage.getItem("interview_checklist")
    if (raw) return JSON.parse(raw)
  } catch {}
  return DEFAULT_CHECKLIST.map(i => ({ ...i, checked: false }))
}

function saveChecklist(items: ChecklistItem[]) {
  if (typeof window === "undefined") return
  localStorage.setItem("interview_checklist", JSON.stringify(items))
}

export function InterviewChecklist() {
  const [items, setItems] = useState<ChecklistItem[]>(DEFAULT_CHECKLIST.map(i => ({ ...i, checked: false })))
  const { toast } = useToast()

  useEffect(() => { setItems(loadChecklist()) }, [])

  const toggleItem = (id: string) => {
    const updated = items.map(i => i.id === id ? { ...i, checked: !i.checked } : i)
    setItems(updated)
    saveChecklist(updated)
  }

  const resetAll = () => {
    const reset = items.map(i => ({ ...i, checked: false }))
    setItems(reset)
    saveChecklist(reset)
    toast({ title: "Checklist Reset", description: "All items have been unchecked." })
  }

  const checkedCount = items.filter(i => i.checked).length
  const progress = Math.round((checkedCount / items.length) * 100)
  const timeframes = [...new Set(items.map(i => i.timeframe))]

  return (
    <div className="space-y-6">
      <Card className="border-0 shadow-lg bg-gradient-to-br from-violet-50/50 to-indigo-50/50 dark:from-violet-900/10 dark:to-indigo-900/10">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-xl"><ClipboardCheck className="w-5 h-5 text-violet-600" /> Interview Day Checklist</CardTitle>
              <CardDescription>{checkedCount}/{items.length} tasks completed</CardDescription>
            </div>
            <Button onClick={resetAll} variant="outline" size="sm"><RotateCcw className="w-4 h-4 mr-1" /> Reset</Button>
          </div>
        </CardHeader>
        <CardContent>
          <Progress value={progress} className="h-3" />
          <p className="text-sm text-muted-foreground mt-2">
            {progress === 100 ? "You're fully prepared! Go crush that interview! 🎉" :
             progress >= 75 ? "Almost there! Just a few more items." :
             progress >= 50 ? "Good progress! Keep going." :
             "Let's get started on your preparation!"}
          </p>
        </CardContent>
      </Card>

      {timeframes.map(timeframe => {
        const tfItems = items.filter(i => i.timeframe === timeframe)
        const tfChecked = tfItems.filter(i => i.checked).length
        const Icon = TIMEFRAME_ICONS[timeframe] || Clock
        const gradient = TIMEFRAME_COLORS[timeframe] || "from-gray-500 to-gray-600"

        return (
          <Card key={timeframe} className="overflow-hidden hover:shadow-lg transition-all duration-300">
            <div className={`bg-gradient-to-r ${gradient} px-6 py-3 text-white flex items-center justify-between`}>
              <div className="flex items-center gap-2">
                <Icon className="w-5 h-5" />
                <h3 className="font-bold">{timeframe}</h3>
              </div>
              <Badge className="bg-white/20 text-white">{tfChecked}/{tfItems.length}</Badge>
            </div>
            <CardContent className="pt-4">
              <div className="space-y-2">
                {tfItems.map(item => (
                  <button
                    key={item.id}
                    onClick={() => toggleItem(item.id)}
                    className={`w-full flex items-start gap-3 p-3 rounded-lg border transition-all duration-200 text-left ${
                      item.checked
                        ? "bg-muted/30 border-green-200 dark:border-green-800"
                        : "bg-background border-border hover:bg-muted/20"
                    }`}
                  >
                    {item.checked
                      ? <CheckCircle className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                      : <Circle className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" />
                    }
                    <div className="flex-1">
                      <span className={`text-sm ${item.checked ? "line-through text-muted-foreground" : "text-foreground"}`}>
                        {item.text}
                      </span>
                    </div>
                    <Badge variant="outline" className="text-xs shrink-0">{item.category}</Badge>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
