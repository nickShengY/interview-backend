"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Linkedin, Sparkles, Target, Search, TrendingUp, Lightbulb, Copy, Check, Coins, PenTool, Eye, Zap } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { authFetch } from "@/lib/auth-fetch"
import { PageHeader } from "@/components/page-header"

type HeadlineAnalysis = {
  score: number
  current: string
  suggestions: string[]
  optimized: string
}

type SummaryAnalysis = {
  score: number
  strengths: string[]
  improvements: string[]
  optimizedSummary: string
}

type KeywordOptimization = {
  missingKeywords: string[]
  strongKeywords: string[]
  recommendedSkills: string[]
}

type SectionRec = {
  section: string
  priority: "High" | "Medium" | "Low"
  recommendation: string
}

type ContentIdea = {
  topic: string
  format: string
  reason: string
}

type LinkedInData = {
  overallScore: number
  headlineAnalysis: HeadlineAnalysis
  summaryAnalysis: SummaryAnalysis
  keywordOptimization: KeywordOptimization
  sectionRecommendations: SectionRec[]
  networkingTips: string[]
  contentIdeas: ContentIdea[]
}

export default function LinkedInOptimizerClient() {
  const [headline, setHeadline] = useState("")
  const [summary, setSummary] = useState("")
  const [experience, setExperience] = useState("")
  const [targetRole, setTargetRole] = useState("")
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [data, setData] = useState<LinkedInData | null>(null)
  const [copiedField, setCopiedField] = useState<string | null>(null)
  const { toast } = useToast()

  const handleAnalyze = async () => {
    if (!headline && !summary) {
      toast({ title: "Missing Information", description: "Please provide at least your headline or summary.", variant: "destructive" })
      return
    }
    setIsAnalyzing(true)
    try {
      const res = await authFetch("/api/career/linkedin-optimizer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ headline, summary, experience, targetRole }),
        dedupeKey: `credits:/api/career/linkedin-optimizer:${headline.slice(0, 30)}`,
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Failed" }))
        throw new Error(err.error || "Failed to analyze")
      }
      const result = await res.json()
      setData(result as LinkedInData)
      toast({ title: "Analysis Complete!", description: "Your LinkedIn optimization report is ready." })
      if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('credits:update'))
    } catch (error: unknown) {
      toast({ title: "Analysis Failed", description: error instanceof Error ? error.message : "Please try again.", variant: "destructive" })
    } finally {
      setIsAnalyzing(false)
    }
  }

  const copyText = (text: string, field: string) => {
    navigator.clipboard.writeText(text)
    setCopiedField(field)
    setTimeout(() => setCopiedField(null), 2000)
    toast({ title: "Copied!", description: "Text copied to clipboard." })
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600"
    if (score >= 60) return "text-yellow-600"
    return "text-red-600"
  }

  const getScoreGradient = (score: number) => {
    if (score >= 80) return "from-green-500 to-emerald-500"
    if (score >= 60) return "from-yellow-500 to-orange-500"
    return "from-red-500 to-orange-500"
  }

  const getPriorityColor = (priority: string) => {
    if (priority === "High") return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
    if (priority === "Medium") return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
    return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <PageHeader
        title="LinkedIn Profile Optimizer"
        description="Get AI-powered analysis and optimization of your LinkedIn profile to attract recruiters and grow your professional network."
        titleClassName="bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent"
      />

      {!data ? (
        <Card className="border-0 shadow-xl bg-gradient-to-br from-white to-blue-50/30 dark:from-gray-900 dark:to-blue-900/10">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Linkedin className="w-5 h-5 text-blue-600" />
              <span>Your LinkedIn Profile</span>
            </CardTitle>
            <CardDescription>Paste your current LinkedIn content for AI-powered optimization</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label>Current Headline</Label>
              <Input placeholder="e.g. Software Engineer at Google | React | Node.js" value={headline} onChange={(e) => setHeadline(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>About / Summary</Label>
              <Textarea placeholder="Paste your LinkedIn summary/about section here..." value={summary} onChange={(e) => setSummary(e.target.value)} rows={6} />
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Experience Summary (brief)</Label>
                <Textarea placeholder="Briefly describe your key roles and achievements..." value={experience} onChange={(e) => setExperience(e.target.value)} rows={3} />
              </div>
              <div className="space-y-2">
                <Label>Target Role</Label>
                <Input placeholder="e.g. Senior Product Manager" value={targetRole} onChange={(e) => setTargetRole(e.target.value)} />
              </div>
            </div>

            <Card className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 border-blue-200 dark:border-blue-800">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-foreground">
                    <Coins className="w-5 h-5 text-blue-600" />
                    <span className="font-medium">Cost: 1 credit for full profile analysis</span>
                  </div>
                  <Button onClick={handleAnalyze} disabled={isAnalyzing || (!headline && !summary)} variant="brand" className="from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700">
                    {isAnalyzing ? (
                      <><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />Analyzing...</>
                    ) : (
                      <><Sparkles className="w-4 h-4 mr-2" />Optimize Profile</>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          <div className="flex justify-end">
            <Button variant="outline" onClick={() => setData(null)}>← New Analysis</Button>
          </div>

          {/* Overall Score */}
          <Card className="border-0 shadow-lg overflow-hidden">
            <div className={`bg-gradient-to-r ${getScoreGradient(data.overallScore)} p-6 text-white`}>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold flex items-center gap-2"><Target className="w-5 h-5" /> Profile Score</h3>
                  <p className="text-white/80 mt-1">Based on headline, keywords, summary quality, and completeness</p>
                </div>
                <div className="text-5xl font-bold">{data.overallScore}<span className="text-2xl">/100</span></div>
              </div>
            </div>
            <CardContent className="pt-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Headline</span>
                    <span className={getScoreColor(data.headlineAnalysis.score)}>{data.headlineAnalysis.score}%</span>
                  </div>
                  <Progress value={data.headlineAnalysis.score} className="h-2" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Summary</span>
                    <span className={getScoreColor(data.summaryAnalysis.score)}>{data.summaryAnalysis.score}%</span>
                  </div>
                  <Progress value={data.summaryAnalysis.score} className="h-2" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Tabs defaultValue="headline" className="space-y-4">
            <TabsList className="grid w-full grid-cols-4 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20">
              <TabsTrigger value="headline" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-cyan-600 data-[state=active]:text-white">
                <PenTool className="w-4 h-4 mr-1" /> Headline
              </TabsTrigger>
              <TabsTrigger value="summary" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-cyan-600 data-[state=active]:text-white">
                <Eye className="w-4 h-4 mr-1" /> Summary
              </TabsTrigger>
              <TabsTrigger value="keywords" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-cyan-600 data-[state=active]:text-white">
                <Search className="w-4 h-4 mr-1" /> Keywords
              </TabsTrigger>
              <TabsTrigger value="content" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-cyan-600 data-[state=active]:text-white">
                <Lightbulb className="w-4 h-4 mr-1" /> Content
              </TabsTrigger>
            </TabsList>

            <TabsContent value="headline" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Headline Optimization</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-muted/30 rounded-lg p-4 border border-border">
                    <p className="text-sm text-muted-foreground mb-1">Current:</p>
                    <p className="text-foreground">{data.headlineAnalysis.current || headline}</p>
                  </div>
                  <div className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-medium text-blue-700 dark:text-blue-300">Optimized:</p>
                      <Button variant="ghost" size="sm" onClick={() => copyText(data.headlineAnalysis.optimized, 'headline')}>
                        {copiedField === 'headline' ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                      </Button>
                    </div>
                    <p className="text-foreground font-medium">{data.headlineAnalysis.optimized}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium mb-2">Suggestions:</p>
                    {data.headlineAnalysis.suggestions.map((s, i) => (
                      <div key={i} className="flex items-start gap-2 mb-2">
                        <Zap className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
                        <span className="text-sm text-foreground/80">{s}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="summary" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Summary Optimization</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-green-700 dark:text-green-400 mb-2">Strengths</p>
                      {data.summaryAnalysis.strengths.map((s, i) => (
                        <div key={i} className="flex items-start gap-2 mb-2">
                          <Check className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                          <span className="text-sm">{s}</span>
                        </div>
                      ))}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-orange-700 dark:text-orange-400 mb-2">Improvements</p>
                      {data.summaryAnalysis.improvements.map((s, i) => (
                        <div key={i} className="flex items-start gap-2 mb-2">
                          <TrendingUp className="w-4 h-4 text-orange-500 mt-0.5 shrink-0" />
                          <span className="text-sm">{s}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-medium text-blue-700 dark:text-blue-300">Optimized Summary:</p>
                      <Button variant="ghost" size="sm" onClick={() => copyText(data.summaryAnalysis.optimizedSummary, 'summary')}>
                        {copiedField === 'summary' ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                      </Button>
                    </div>
                    <p className="text-foreground/90 whitespace-pre-line text-sm">{data.summaryAnalysis.optimizedSummary}</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="keywords" className="space-y-4">
              <div className="grid md:grid-cols-3 gap-4">
                <Card className="border-red-200 dark:border-red-800">
                  <CardHeader>
                    <CardTitle className="text-sm text-red-700 dark:text-red-400">Missing Keywords</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {data.keywordOptimization.missingKeywords.map((k, i) => (
                        <Badge key={i} variant="outline" className="border-red-300 text-red-700 dark:border-red-700 dark:text-red-300">{k}</Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
                <Card className="border-green-200 dark:border-green-800">
                  <CardHeader>
                    <CardTitle className="text-sm text-green-700 dark:text-green-400">Strong Keywords</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {data.keywordOptimization.strongKeywords.map((k, i) => (
                        <Badge key={i} variant="outline" className="border-green-300 text-green-700 dark:border-green-700 dark:text-green-300">{k}</Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
                <Card className="border-blue-200 dark:border-blue-800">
                  <CardHeader>
                    <CardTitle className="text-sm text-blue-700 dark:text-blue-400">Recommended Skills</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {data.keywordOptimization.recommendedSkills.map((k, i) => (
                        <Badge key={i} variant="outline" className="border-blue-300 text-blue-700 dark:border-blue-700 dark:text-blue-300">{k}</Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Section Recommendations</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {data.sectionRecommendations.map((r, i) => (
                      <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 border border-border">
                        <Badge className={getPriorityColor(r.priority)}>{r.priority}</Badge>
                        <div>
                          <p className="font-medium text-sm">{r.section}</p>
                          <p className="text-sm text-muted-foreground">{r.recommendation}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="content" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2"><Lightbulb className="w-5 h-5 text-yellow-500" /> Content Ideas for Thought Leadership</CardTitle>
                  <CardDescription>Post these on LinkedIn to increase visibility and establish expertise</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-4">
                    {data.contentIdeas.map((idea, i) => (
                      <Card key={i} className="bg-muted/20 hover:shadow-md transition-all duration-300">
                        <CardContent className="pt-4 space-y-2">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">{idea.format}</Badge>
                          </div>
                          <p className="font-medium text-sm">{idea.topic}</p>
                          <p className="text-xs text-muted-foreground">{idea.reason}</p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Networking Tips</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {data.networkingTips.map((tip, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shrink-0 mt-0.5">
                          <span className="text-xs font-bold text-blue-600">{i + 1}</span>
                        </div>
                        <span className="text-foreground/80 text-sm">{tip}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  )
}
