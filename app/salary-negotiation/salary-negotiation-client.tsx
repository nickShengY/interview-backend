"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { DollarSign, Sparkles, TrendingUp, MessageSquare, Shield, Clock, AlertTriangle, Gift, Copy, Check, Coins } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { authFetch } from "@/lib/auth-fetch"
import { PageHeader } from "@/components/page-header"

type MarketData = {
  lowRange: number
  median: number
  highRange: number
  currency: string
}

type Script = {
  scenario: string
  script: string
  tips: string[]
}

type CounterStrategy = {
  strategy: string
  explanation: string
  examplePhrase: string
}

type TimelineStep = {
  step: number
  action: string
  timing: string
  details: string
}

type Benefit = {
  benefit: string
  negotiationTip: string
}

type NegotiationData = {
  marketData: MarketData
  scripts: Script[]
  counterOfferStrategies: CounterStrategy[]
  negotiationTimeline: TimelineStep[]
  commonMistakes: string[]
  benefits: Benefit[]
}

export default function SalaryNegotiationClient() {
  const [jobTitle, setJobTitle] = useState("")
  const [industry, setIndustry] = useState("")
  const [experienceLevel, setExperienceLevel] = useState("")
  const [currentSalary, setCurrentSalary] = useState("")
  const [targetSalary, setTargetSalary] = useState("")
  const [location, setLocation] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [data, setData] = useState<NegotiationData | null>(null)
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)
  const { toast } = useToast()

  const handleGenerate = async () => {
    if (!jobTitle || !industry || !experienceLevel) {
      toast({ title: "Missing Information", description: "Please fill in job title, industry, and experience level.", variant: "destructive" })
      return
    }
    setIsGenerating(true)
    try {
      const res = await authFetch("/api/career/salary-negotiation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobTitle, industry, experienceLevel, currentSalary, targetSalary, location }),
        dedupeKey: `credits:/api/career/salary-negotiation:${jobTitle}:${industry}`,
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Failed" }))
        throw new Error(err.error || "Failed to generate")
      }
      const result = await res.json()
      setData(result as NegotiationData)
      toast({ title: "Analysis Complete!", description: "Your salary negotiation coaching is ready." })
      if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('credits:update'))
    } catch (error: unknown) {
      toast({ title: "Generation Failed", description: error instanceof Error ? error.message : "Please try again.", variant: "destructive" })
    } finally {
      setIsGenerating(false)
    }
  }

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text)
    setCopiedIndex(index)
    setTimeout(() => setCopiedIndex(null), 2000)
    toast({ title: "Copied!", description: "Script copied to clipboard." })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(amount)
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <PageHeader
        title="AI Salary Negotiation Coach"
        description="Get personalized negotiation scripts, market data, and counter-offer strategies powered by AI to maximize your compensation package."
        titleClassName="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent"
      />

      {!data ? (
        <Card className="border-0 shadow-xl bg-gradient-to-br from-white to-emerald-50/30 dark:from-gray-900 dark:to-emerald-900/10">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <DollarSign className="w-5 h-5 text-emerald-600" />
              <span>Your Negotiation Profile</span>
            </CardTitle>
            <CardDescription>Tell us about your situation to get personalized coaching</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Job Title *</Label>
                <Input placeholder="e.g. Senior Software Engineer" value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Industry *</Label>
                <Select value={industry} onValueChange={setIndustry}>
                  <SelectTrigger><SelectValue placeholder="Select industry" /></SelectTrigger>
                  <SelectContent>
                    {["Technology", "Finance", "Healthcare", "Consulting", "Marketing", "Sales", "Engineering", "Education", "Legal", "Government"].map(i => (
                      <SelectItem key={i} value={i.toLowerCase()}>{i}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Experience Level *</Label>
                <Select value={experienceLevel} onValueChange={setExperienceLevel}>
                  <SelectTrigger><SelectValue placeholder="Select level" /></SelectTrigger>
                  <SelectContent>
                    {["Entry Level (0-2 years)", "Mid Level (3-5 years)", "Senior (6-10 years)", "Staff/Principal (10-15 years)", "Director/VP (15+ years)"].map(l => (
                      <SelectItem key={l} value={l}>{l}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Location</Label>
                <Input placeholder="e.g. San Francisco, CA" value={location} onChange={(e) => setLocation(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Current Salary (optional)</Label>
                <Input placeholder="e.g. $120,000" value={currentSalary} onChange={(e) => setCurrentSalary(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Target Salary (optional)</Label>
                <Input placeholder="e.g. $150,000" value={targetSalary} onChange={(e) => setTargetSalary(e.target.value)} />
              </div>
            </div>

            <Card className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 border-emerald-200 dark:border-emerald-800">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-foreground">
                    <Coins className="w-5 h-5 text-emerald-600" />
                    <span className="font-medium">Cost: 1 credit for full negotiation coaching</span>
                  </div>
                  <Button onClick={handleGenerate} disabled={isGenerating || !jobTitle || !industry || !experienceLevel} variant="brand" className="from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700">
                    {isGenerating ? (
                      <><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />Analyzing...</>
                    ) : (
                      <><Sparkles className="w-4 h-4 mr-2" />Generate Coaching</>
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

          {/* Market Data Card */}
          <Card className="border-0 shadow-lg overflow-hidden">
            <div className="bg-gradient-to-r from-emerald-600 to-teal-600 p-6 text-white">
              <h3 className="text-xl font-bold flex items-center gap-2"><TrendingUp className="w-5 h-5" /> Market Salary Data</h3>
              <p className="text-emerald-100 mt-1">Estimated salary range for {jobTitle} in {industry}</p>
            </div>
            <CardContent className="pt-6">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Low Range</p>
                  <p className="text-2xl font-bold text-orange-600">{formatCurrency(data.marketData.lowRange)}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Median</p>
                  <p className="text-3xl font-bold text-emerald-600">{formatCurrency(data.marketData.median)}</p>
                  <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200">Target</Badge>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">High Range</p>
                  <p className="text-2xl font-bold text-blue-600">{formatCurrency(data.marketData.highRange)}</p>
                </div>
              </div>
              <div className="mt-4">
                <Progress value={65} className="h-3 bg-gradient-to-r from-orange-200 via-emerald-200 to-blue-200" />
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>Entry</span>
                  <span>Competitive</span>
                  <span>Top Tier</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Tabs defaultValue="scripts" className="space-y-4">
            <TabsList className="grid w-full grid-cols-4 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20">
              <TabsTrigger value="scripts" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-600 data-[state=active]:to-teal-600 data-[state=active]:text-white">
                <MessageSquare className="w-4 h-4 mr-1" /> Scripts
              </TabsTrigger>
              <TabsTrigger value="strategies" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-600 data-[state=active]:to-teal-600 data-[state=active]:text-white">
                <Shield className="w-4 h-4 mr-1" /> Strategies
              </TabsTrigger>
              <TabsTrigger value="timeline" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-600 data-[state=active]:to-teal-600 data-[state=active]:text-white">
                <Clock className="w-4 h-4 mr-1" /> Timeline
              </TabsTrigger>
              <TabsTrigger value="benefits" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-600 data-[state=active]:to-teal-600 data-[state=active]:text-white">
                <Gift className="w-4 h-4 mr-1" /> Benefits
              </TabsTrigger>
            </TabsList>

            <TabsContent value="scripts" className="space-y-4">
              {data.scripts.map((script, i) => (
                <Card key={i} className="group hover:shadow-lg transition-all duration-300">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200">{script.scenario}</Badge>
                      </CardTitle>
                      <Button variant="ghost" size="sm" onClick={() => copyToClipboard(script.script, i)}>
                        {copiedIndex === i ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="bg-muted/30 rounded-lg p-4 border border-border">
                      <p className="text-foreground/90 whitespace-pre-line italic">&ldquo;{script.script}&rdquo;</p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-muted-foreground">Pro Tips:</p>
                      <ul className="space-y-1">
                        {script.tips.map((tip, j) => (
                          <li key={j} className="flex items-start gap-2 text-sm">
                            <Sparkles className="w-3 h-3 text-emerald-500 mt-1 shrink-0" />
                            <span>{tip}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            <TabsContent value="strategies" className="space-y-4">
              {data.counterOfferStrategies.map((s, i) => (
                <Card key={i} className="hover:shadow-lg transition-all duration-300">
                  <CardHeader>
                    <CardTitle className="text-lg text-emerald-700 dark:text-emerald-400">{s.strategy}</CardTitle>
                    <CardDescription>{s.explanation}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-lg p-4 border border-emerald-200 dark:border-emerald-800">
                      <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300 mb-1">Example phrase:</p>
                      <p className="italic text-foreground/80">&ldquo;{s.examplePhrase}&rdquo;</p>
                    </div>
                  </CardContent>
                </Card>
              ))}

              <Card className="bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-900/10 dark:to-orange-900/10 border-red-200 dark:border-red-800">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-red-700 dark:text-red-400">
                    <AlertTriangle className="w-5 h-5" /> Common Mistakes to Avoid
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {data.commonMistakes.map((mistake, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <div className="w-6 h-6 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center shrink-0 mt-0.5">
                          <span className="text-xs font-bold text-red-600">{i + 1}</span>
                        </div>
                        <span className="text-foreground/80">{mistake}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="timeline" className="space-y-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="relative">
                    {data.negotiationTimeline.map((step, i) => (
                      <div key={i} className="flex gap-4 pb-8 last:pb-0">
                        <div className="flex flex-col items-center">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 flex items-center justify-center text-white font-bold shadow-lg">
                            {step.step}
                          </div>
                          {i < data.negotiationTimeline.length - 1 && (
                            <div className="w-0.5 h-full bg-gradient-to-b from-emerald-300 to-teal-300 dark:from-emerald-700 dark:to-teal-700 mt-2" />
                          )}
                        </div>
                        <div className="flex-1 pb-4">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold text-foreground">{step.action}</h4>
                            <Badge variant="outline" className="text-xs">{step.timing}</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{step.details}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="benefits" className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                {data.benefits.map((b, i) => (
                  <Card key={i} className="hover:shadow-lg transition-all duration-300 group">
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Gift className="w-5 h-5 text-emerald-600 group-hover:scale-110 transition-transform" />
                        {b.benefit}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">{b.negotiationTip}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  )
}
