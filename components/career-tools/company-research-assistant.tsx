"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Building2, Sparkles, MessageSquare, Users, Lightbulb, HelpCircle, Clock, Coins } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { authFetch } from "@/lib/auth-fetch"

type Stage = { stage: string; description: string; duration: string; tips: string[] }
type Question = { question: string; category: string; sampleAnswer: string }
type CultureInsight = { aspect: string; detail: string; howToDemonstrate: string }
type SmartQuestion = { question: string; whyItWorks: string }

type CompanyData = {
  companyOverview: { description: string; industry: string; size: string; culture: string; values: string[] }
  interviewProcess: { stages: Stage[]; averageDuration: string; difficulty: string }
  commonQuestions: Question[]
  cultureInsights: CultureInsight[]
  talkingPoints: string[]
  questionsToAsk: SmartQuestion[]
}

export function CompanyResearchAssistant() {
  const [companyName, setCompanyName] = useState("")
  const [role, setRole] = useState("")
  const [industry, setIndustry] = useState("")
  const [isResearching, setIsResearching] = useState(false)
  const [data, setData] = useState<CompanyData | null>(null)
  const { toast } = useToast()

  const handleResearch = async () => {
    if (!companyName) {
      toast({ title: "Missing Info", description: "Please enter a company name.", variant: "destructive" })
      return
    }
    setIsResearching(true)
    try {
      const res = await authFetch("/api/career/company-research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companyName, role, industry }),
        dedupeKey: `credits:/api/career/company-research:${companyName}:${role}`,
      })
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || "Failed")
      setData(await res.json() as CompanyData)
      toast({ title: "Research Complete!", description: `Intel for ${companyName} is ready.` })
      if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('credits:update'))
    } catch (error: unknown) {
      toast({ title: "Failed", description: error instanceof Error ? error.message : "Please try again.", variant: "destructive" })
    } finally { setIsResearching(false) }
  }

  if (data) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">{companyName}</h2>
            <p className="text-muted-foreground">{data.companyOverview.industry} • {data.companyOverview.size}</p>
          </div>
          <Button variant="outline" onClick={() => setData(null)}>← New Research</Button>
        </div>

        {/* Company Overview */}
        <Card className="overflow-hidden">
          <div className="bg-gradient-to-r from-orange-500 to-amber-500 p-4 text-white">
            <h3 className="font-bold flex items-center gap-2"><Building2 className="w-5 h-5" /> Company Overview</h3>
          </div>
          <CardContent className="pt-4 space-y-3">
            <p className="text-sm text-foreground/80">{data.companyOverview.description}</p>
            <div>
              <p className="text-sm font-medium mb-2">Culture: <span className="font-normal text-muted-foreground">{data.companyOverview.culture}</span></p>
              <div className="flex flex-wrap gap-2">
                {data.companyOverview.values.map((v, i) => (
                  <Badge key={i} className="bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200">{v}</Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="process" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4 bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20">
            <TabsTrigger value="process" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-amber-500 data-[state=active]:text-white">
              <Clock className="w-4 h-4 mr-1" /> Process
            </TabsTrigger>
            <TabsTrigger value="questions" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-amber-500 data-[state=active]:text-white">
              <MessageSquare className="w-4 h-4 mr-1" /> Questions
            </TabsTrigger>
            <TabsTrigger value="culture" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-amber-500 data-[state=active]:text-white">
              <Users className="w-4 h-4 mr-1" /> Culture
            </TabsTrigger>
            <TabsTrigger value="tips" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-amber-500 data-[state=active]:text-white">
              <Lightbulb className="w-4 h-4 mr-1" /> Tips
            </TabsTrigger>
          </TabsList>

          <TabsContent value="process" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Interview Process</CardTitle>
                  <div className="flex gap-2">
                    <Badge variant="outline">{data.interviewProcess.averageDuration}</Badge>
                    <Badge variant="outline">Difficulty: {data.interviewProcess.difficulty}</Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="relative">
                  {data.interviewProcess.stages.map((stage, i) => (
                    <div key={i} className="flex gap-4 pb-6 last:pb-0">
                      <div className="flex flex-col items-center">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-r from-orange-500 to-amber-500 flex items-center justify-center text-white text-sm font-bold shadow">
                          {i + 1}
                        </div>
                        {i < data.interviewProcess.stages.length - 1 && (
                          <div className="w-0.5 h-full bg-orange-200 dark:bg-orange-800 mt-2" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold text-sm">{stage.stage}</h4>
                          <Badge variant="outline" className="text-xs">{stage.duration}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">{stage.description}</p>
                        {stage.tips.length > 0 && (
                          <div className="space-y-1">
                            {stage.tips.map((tip, j) => (
                              <div key={j} className="flex items-start gap-1">
                                <Sparkles className="w-3 h-3 text-orange-500 mt-1 shrink-0" />
                                <span className="text-xs text-muted-foreground">{tip}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="questions" className="space-y-4">
            {data.commonQuestions.map((q, i) => (
              <Card key={i} className="hover:shadow-md transition-all duration-300">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm">{q.question}</CardTitle>
                    <Badge variant="outline" className="text-xs">{q.category}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="bg-muted/20 rounded-lg p-3 border border-border">
                    <p className="text-xs font-medium text-muted-foreground mb-1">Sample Answer Approach:</p>
                    <p className="text-sm text-foreground/80">{q.sampleAnswer}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="culture" className="space-y-4">
            {data.cultureInsights.map((insight, i) => (
              <Card key={i} className="hover:shadow-md transition-all duration-300">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-orange-700 dark:text-orange-400">{insight.aspect}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p className="text-sm text-foreground/80">{insight.detail}</p>
                  <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-3 border border-orange-200 dark:border-orange-800">
                    <p className="text-xs font-medium text-orange-700 dark:text-orange-300 mb-1">How to Demonstrate:</p>
                    <p className="text-sm">{insight.howToDemonstrate}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="tips" className="space-y-4">
            <Card>
              <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Lightbulb className="w-5 h-5 text-yellow-500" /> Key Talking Points</CardTitle></CardHeader>
              <CardContent>
                {data.talkingPoints.map((tp, i) => (
                  <div key={i} className="flex items-start gap-2 mb-3">
                    <div className="w-6 h-6 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center shrink-0">
                      <span className="text-xs font-bold text-orange-600">{i + 1}</span>
                    </div>
                    <span className="text-sm">{tp}</span>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-lg flex items-center gap-2"><HelpCircle className="w-5 h-5 text-blue-500" /> Smart Questions to Ask</CardTitle></CardHeader>
              <CardContent>
                {data.questionsToAsk.map((q, i) => (
                  <div key={i} className="p-3 mb-2 rounded-lg bg-muted/20 border border-border">
                    <p className="font-medium text-sm">&ldquo;{q.question}&rdquo;</p>
                    <p className="text-xs text-muted-foreground mt-1">{q.whyItWorks}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    )
  }

  return (
    <Card className="border-0 shadow-lg bg-gradient-to-br from-orange-50/50 to-amber-50/50 dark:from-orange-900/10 dark:to-amber-900/10">
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Building2 className="w-5 h-5 text-orange-600" /> Company Research Assistant</CardTitle>
        <CardDescription>Get AI-powered intel on any company&apos;s interview process, culture, and common questions.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Company Name *</Label>
          <Input placeholder="e.g. Google, Stripe, Meta..." value={companyName} onChange={e => setCompanyName(e.target.value)} />
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2"><Label>Target Role</Label><Input placeholder="e.g. Senior Software Engineer" value={role} onChange={e => setRole(e.target.value)} /></div>
          <div className="space-y-2"><Label>Industry</Label><Input placeholder="e.g. Technology" value={industry} onChange={e => setIndustry(e.target.value)} /></div>
        </div>
        <Card className="bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 border-orange-200 dark:border-orange-800">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2"><Coins className="w-5 h-5 text-orange-600" /><span className="font-medium text-sm">Cost: 1 credit</span></div>
              <Button onClick={handleResearch} disabled={isResearching || !companyName} variant="brand" className="from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700">
                {isResearching ? <><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />Researching...</> : <><Sparkles className="w-4 h-4 mr-2" />Research Company</>}
              </Button>
            </div>
          </CardContent>
        </Card>
      </CardContent>
    </Card>
  )
}
