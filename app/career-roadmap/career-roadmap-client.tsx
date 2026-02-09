"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Map, Sparkles, Target, TrendingUp, Award, Calendar, Coins, ChevronRight, BookOpen, Briefcase, CheckCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { authFetch } from "@/lib/auth-fetch"
import { PageHeader } from "@/components/page-header"

type Skill = { name: string; priority: "Critical" | "Important" | "Nice-to-have"; resources: string[] }
type Phase = { phase: number; title: string; duration: string; description: string; skills: Skill[]; milestones: string[]; projects: string[] }
type SkillGap = { skill: string; importance: string; learningPath: string; estimatedTime: string }
type Cert = { name: string; provider: string; difficulty: string; estimatedTime: string; value: string }
type SalaryStage = { stage: string; expectedRange: string; timeframe: string }
type ActionItem = { week: string; action: string; details: string }

type RoadmapData = {
  roadmap: { title: string; estimatedTimeline: string; phases: Phase[] }
  skillGap: { currentStrengths: string[]; criticalGaps: SkillGap[]; matchPercentage: number }
  certifications: Cert[]
  salaryProgression: SalaryStage[]
  actionItems: ActionItem[]
}

export default function CareerRoadmapClient() {
  const [currentRole, setCurrentRole] = useState("")
  const [targetRole, setTargetRole] = useState("")
  const [currentSkills, setCurrentSkills] = useState("")
  const [yearsExperience, setYearsExperience] = useState("")
  const [timeline, setTimeline] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [data, setData] = useState<RoadmapData | null>(null)
  const { toast } = useToast()

  const handleGenerate = async () => {
    if (!currentRole || !targetRole) {
      toast({ title: "Missing Information", description: "Please provide your current and target roles.", variant: "destructive" })
      return
    }
    setIsGenerating(true)
    try {
      const res = await authFetch("/api/career/roadmap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentRole, targetRole, currentSkills, yearsExperience, timeline }),
        dedupeKey: `credits:/api/career/roadmap:${currentRole}:${targetRole}`,
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Failed" }))
        throw new Error(err.error || "Failed to generate roadmap")
      }
      const result = await res.json()
      setData(result as RoadmapData)
      toast({ title: "Roadmap Generated!", description: "Your personalized career roadmap is ready." })
      if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('credits:update'))
    } catch (error: unknown) {
      toast({ title: "Generation Failed", description: error instanceof Error ? error.message : "Please try again.", variant: "destructive" })
    } finally {
      setIsGenerating(false)
    }
  }

  const getPriorityColor = (p: string) => {
    if (p === "Critical") return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
    if (p === "Important") return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
    return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <PageHeader
        title="AI Career Roadmap Planner"
        description="Get a personalized career transition roadmap with skill gap analysis, certifications, salary progression, and actionable weekly plans."
        titleClassName="bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent"
      />

      {!data ? (
        <Card className="border-0 shadow-xl bg-gradient-to-br from-white to-violet-50/30 dark:from-gray-900 dark:to-violet-900/10">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Map className="w-5 h-5 text-violet-600" />
              <span>Career Transition Profile</span>
            </CardTitle>
            <CardDescription>Tell us where you are and where you want to go</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Current Role *</Label>
                <Input placeholder="e.g. Junior Data Analyst" value={currentRole} onChange={(e) => setCurrentRole(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Target Role *</Label>
                <Input placeholder="e.g. Machine Learning Engineer" value={targetRole} onChange={(e) => setTargetRole(e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Current Skills</Label>
              <Textarea placeholder="e.g. Python, SQL, Excel, Tableau, basic statistics..." value={currentSkills} onChange={(e) => setCurrentSkills(e.target.value)} rows={3} />
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Years of Experience</Label>
                <Select value={yearsExperience} onValueChange={setYearsExperience}>
                  <SelectTrigger><SelectValue placeholder="Select experience" /></SelectTrigger>
                  <SelectContent>
                    {["0-1 years", "1-3 years", "3-5 years", "5-10 years", "10+ years"].map(y => (
                      <SelectItem key={y} value={y}>{y}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Desired Timeline</Label>
                <Select value={timeline} onValueChange={setTimeline}>
                  <SelectTrigger><SelectValue placeholder="Select timeline" /></SelectTrigger>
                  <SelectContent>
                    {["3 months", "6 months", "12 months", "18 months", "2+ years"].map(t => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Card className="bg-gradient-to-r from-violet-50 to-indigo-50 dark:from-violet-900/20 dark:to-indigo-900/20 border-violet-200 dark:border-violet-800">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-foreground">
                    <Coins className="w-5 h-5 text-violet-600" />
                    <span className="font-medium">Cost: 1 credit for full career roadmap</span>
                  </div>
                  <Button onClick={handleGenerate} disabled={isGenerating || !currentRole || !targetRole} variant="brand" className="from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700">
                    {isGenerating ? (
                      <><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />Planning...</>
                    ) : (
                      <><Sparkles className="w-4 h-4 mr-2" />Generate Roadmap</>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-foreground">{data.roadmap.title}</h2>
              <p className="text-muted-foreground">Estimated timeline: {data.roadmap.estimatedTimeline}</p>
            </div>
            <Button variant="outline" onClick={() => setData(null)}>← New Roadmap</Button>
          </div>

          {/* Skill Match Score */}
          <Card className="border-0 shadow-lg overflow-hidden">
            <div className="bg-gradient-to-r from-violet-600 to-indigo-600 p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold flex items-center gap-2"><Target className="w-5 h-5" /> Skill Match</h3>
                  <p className="text-violet-100 mt-1">{currentRole} → {targetRole}</p>
                </div>
                <div className="text-5xl font-bold">{data.skillGap.matchPercentage}<span className="text-2xl">%</span></div>
              </div>
              <Progress value={data.skillGap.matchPercentage} className="mt-4 h-3 bg-white/20" />
            </div>
            <CardContent className="pt-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-green-700 dark:text-green-400 mb-2 flex items-center gap-1"><CheckCircle className="w-4 h-4" /> Current Strengths</h4>
                  <div className="flex flex-wrap gap-2">
                    {data.skillGap.currentStrengths.map((s, i) => (
                      <Badge key={i} className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">{s}</Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold text-red-700 dark:text-red-400 mb-2 flex items-center gap-1"><Target className="w-4 h-4" /> Critical Gaps</h4>
                  {data.skillGap.criticalGaps.slice(0, 4).map((g, i) => (
                    <div key={i} className="mb-2 p-2 rounded bg-muted/30 border border-border">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-sm">{g.skill}</span>
                        <span className="text-xs text-muted-foreground">{g.estimatedTime}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{g.learningPath}</p>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <Tabs defaultValue="phases" className="space-y-4">
            <TabsList className="grid w-full grid-cols-4 bg-gradient-to-r from-violet-50 to-indigo-50 dark:from-violet-900/20 dark:to-indigo-900/20">
              <TabsTrigger value="phases" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-violet-600 data-[state=active]:to-indigo-600 data-[state=active]:text-white">
                <Map className="w-4 h-4 mr-1" /> Phases
              </TabsTrigger>
              <TabsTrigger value="certs" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-violet-600 data-[state=active]:to-indigo-600 data-[state=active]:text-white">
                <Award className="w-4 h-4 mr-1" /> Certs
              </TabsTrigger>
              <TabsTrigger value="salary" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-violet-600 data-[state=active]:to-indigo-600 data-[state=active]:text-white">
                <TrendingUp className="w-4 h-4 mr-1" /> Salary
              </TabsTrigger>
              <TabsTrigger value="actions" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-violet-600 data-[state=active]:to-indigo-600 data-[state=active]:text-white">
                <Calendar className="w-4 h-4 mr-1" /> Actions
              </TabsTrigger>
            </TabsList>

            <TabsContent value="phases" className="space-y-6">
              {data.roadmap.phases.map((phase, i) => (
                <Card key={i} className="overflow-hidden hover:shadow-lg transition-all duration-300">
                  <div className="bg-gradient-to-r from-violet-500/10 to-indigo-500/10 dark:from-violet-500/5 dark:to-indigo-500/5 px-6 py-3 border-b border-border">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-lg flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-r from-violet-500 to-indigo-500 flex items-center justify-center text-white text-sm font-bold">{phase.phase}</div>
                        {phase.title}
                      </h3>
                      <Badge variant="outline">{phase.duration}</Badge>
                    </div>
                  </div>
                  <CardContent className="pt-4 space-y-4">
                    <p className="text-sm text-muted-foreground">{phase.description}</p>
                    <div>
                      <h4 className="font-medium text-sm mb-2 flex items-center gap-1"><BookOpen className="w-4 h-4" /> Skills to Learn</h4>
                      <div className="space-y-2">
                        {phase.skills.map((skill, j) => (
                          <div key={j} className="flex items-start gap-2 p-2 rounded bg-muted/20 border border-border">
                            <Badge className={`${getPriorityColor(skill.priority)} text-xs shrink-0`}>{skill.priority}</Badge>
                            <div>
                              <span className="font-medium text-sm">{skill.name}</span>
                              {skill.resources.length > 0 && (
                                <p className="text-xs text-muted-foreground mt-1">{skill.resources.join(" • ")}</p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-medium text-sm mb-2">Milestones</h4>
                        {phase.milestones.map((m, j) => (
                          <div key={j} className="flex items-center gap-2 mb-1">
                            <ChevronRight className="w-3 h-3 text-violet-500 shrink-0" />
                            <span className="text-sm">{m}</span>
                          </div>
                        ))}
                      </div>
                      <div>
                        <h4 className="font-medium text-sm mb-2 flex items-center gap-1"><Briefcase className="w-4 h-4" /> Projects</h4>
                        {phase.projects.map((p, j) => (
                          <div key={j} className="flex items-center gap-2 mb-1">
                            <ChevronRight className="w-3 h-3 text-indigo-500 shrink-0" />
                            <span className="text-sm">{p}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            <TabsContent value="certs" className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                {data.certifications.map((cert, i) => (
                  <Card key={i} className="hover:shadow-lg transition-all duration-300">
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Award className="w-5 h-5 text-violet-600" />
                        {cert.name}
                      </CardTitle>
                      <CardDescription>{cert.provider}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div><span className="text-muted-foreground">Difficulty:</span> <span className="font-medium">{cert.difficulty}</span></div>
                        <div><span className="text-muted-foreground">Time:</span> <span className="font-medium">{cert.estimatedTime}</span></div>
                      </div>
                      <p className="text-sm text-muted-foreground mt-2">{cert.value}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="salary" className="space-y-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="space-y-6">
                    {data.salaryProgression.map((stage, i) => (
                      <div key={i} className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-r from-violet-500 to-indigo-500 flex items-center justify-center text-white font-bold shadow-lg shrink-0">
                          {i + 1}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <h4 className="font-semibold">{stage.stage}</h4>
                            <span className="text-lg font-bold text-violet-600 dark:text-violet-400">{stage.expectedRange}</span>
                          </div>
                          <p className="text-sm text-muted-foreground">{stage.timeframe}</p>
                        </div>
                        {i < data.salaryProgression.length - 1 && (
                          <TrendingUp className="w-5 h-5 text-green-500 shrink-0" />
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="actions" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><Calendar className="w-5 h-5 text-violet-600" /> Immediate Action Items</CardTitle>
                  <CardDescription>Your week-by-week plan to get started</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {data.actionItems.map((item, i) => (
                      <div key={i} className="flex gap-4 p-3 rounded-lg bg-muted/20 border border-border hover:bg-muted/30 transition-colors">
                        <Badge variant="outline" className="shrink-0 h-fit">{item.week}</Badge>
                        <div>
                          <p className="font-medium text-sm">{item.action}</p>
                          <p className="text-xs text-muted-foreground mt-1">{item.details}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  )
}
