"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Mic, Sparkles, Copy, Check, Clock, Lightbulb, AlertTriangle, Coins } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { authFetch } from "@/lib/auth-fetch"

type Pitch = { type: string; duration: string; pitch: string; wordCount: number }
type KeyElements = { hook: string; valueProposition: string; proof: string; callToAction: string }
type Adaptation = { context: string; modification: string }

type PitchData = {
  pitches: Pitch[]
  keyElements: KeyElements
  deliveryTips: string[]
  commonPitfalls: string[]
  adaptations: Adaptation[]
}

export function ElevatorPitchGenerator() {
  const [name, setName] = useState("")
  const [currentRole, setCurrentRole] = useState("")
  const [targetRole, setTargetRole] = useState("")
  const [skills, setSkills] = useState("")
  const [uniqueValue, setUniqueValue] = useState("")
  const [industry, setIndustry] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [data, setData] = useState<PitchData | null>(null)
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)
  const { toast } = useToast()

  const handleGenerate = async () => {
    if (!currentRole && !targetRole) {
      toast({ title: "Missing Info", description: "Please provide at least your current or target role.", variant: "destructive" })
      return
    }
    setIsGenerating(true)
    try {
      const res = await authFetch("/api/career/elevator-pitch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, currentRole, targetRole, skills, uniqueValue, industry }),
        dedupeKey: `credits:/api/career/elevator-pitch:${currentRole}:${targetRole}`,
      })
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || "Failed")
      setData(await res.json() as PitchData)
      toast({ title: "Pitches Generated!", description: "Your elevator pitches are ready." })
      if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('credits:update'))
    } catch (error: unknown) {
      toast({ title: "Failed", description: error instanceof Error ? error.message : "Please try again.", variant: "destructive" })
    } finally { setIsGenerating(false) }
  }

  const copyPitch = (text: string, i: number) => {
    navigator.clipboard.writeText(text)
    setCopiedIndex(i)
    setTimeout(() => setCopiedIndex(null), 2000)
    toast({ title: "Copied!" })
  }

  if (data) {
    return (
      <div className="space-y-6">
        <div className="flex justify-end">
          <Button variant="outline" onClick={() => setData(null)}>← New Pitch</Button>
        </div>

        {/* Pitches */}
        <div className="space-y-4">
          {data.pitches.map((p, i) => (
            <Card key={i} className="hover:shadow-lg transition-all duration-300">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge className="bg-rose-100 text-rose-800 dark:bg-rose-900 dark:text-rose-200">{p.type}</Badge>
                    <Badge variant="outline" className="flex items-center gap-1"><Clock className="w-3 h-3" />{p.duration}</Badge>
                    <span className="text-xs text-muted-foreground">{p.wordCount} words</span>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => copyPitch(p.pitch, i)}>
                    {copiedIndex === i ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="bg-gradient-to-r from-rose-50 to-pink-50 dark:from-rose-900/20 dark:to-pink-900/20 rounded-lg p-4 border border-rose-200 dark:border-rose-800">
                  <p className="text-foreground/90 leading-relaxed">{p.pitch}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Key Elements */}
        <Card>
          <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Lightbulb className="w-5 h-5 text-yellow-500" /> Key Elements Breakdown</CardTitle></CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-3">
              {[
                { label: "Hook", value: data.keyElements.hook, color: "border-rose-300 dark:border-rose-700" },
                { label: "Value Proposition", value: data.keyElements.valueProposition, color: "border-blue-300 dark:border-blue-700" },
                { label: "Proof", value: data.keyElements.proof, color: "border-green-300 dark:border-green-700" },
                { label: "Call to Action", value: data.keyElements.callToAction, color: "border-amber-300 dark:border-amber-700" },
              ].map(item => (
                <div key={item.label} className={`p-3 rounded-lg bg-muted/20 border-l-4 ${item.color}`}>
                  <p className="text-xs font-bold text-muted-foreground mb-1">{item.label}</p>
                  <p className="text-sm">{item.value}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Delivery Tips & Pitfalls */}
        <div className="grid md:grid-cols-2 gap-4">
          <Card>
            <CardHeader><CardTitle className="text-lg">Delivery Tips</CardTitle></CardHeader>
            <CardContent>
              {data.deliveryTips.map((t, i) => (
                <div key={i} className="flex items-start gap-2 mb-2">
                  <Sparkles className="w-4 h-4 text-rose-500 mt-0.5 shrink-0" />
                  <span className="text-sm">{t}</span>
                </div>
              ))}
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-lg flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-orange-500" /> Pitfalls to Avoid</CardTitle></CardHeader>
            <CardContent>
              {data.commonPitfalls.map((p, i) => (
                <div key={i} className="flex items-start gap-2 mb-2">
                  <AlertTriangle className="w-4 h-4 text-orange-400 mt-0.5 shrink-0" />
                  <span className="text-sm">{p}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Context Adaptations */}
        <Card>
          <CardHeader><CardTitle className="text-lg">Context-Specific Adaptations</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.adaptations.map((a, i) => (
                <div key={i} className="p-3 rounded-lg bg-muted/20 border border-border">
                  <p className="font-medium text-sm text-rose-700 dark:text-rose-400">{a.context}</p>
                  <p className="text-sm text-muted-foreground mt-1">{a.modification}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <Card className="border-0 shadow-lg bg-gradient-to-br from-rose-50/50 to-pink-50/50 dark:from-rose-900/10 dark:to-pink-900/10">
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Mic className="w-5 h-5 text-rose-600" /> Elevator Pitch Generator</CardTitle>
        <CardDescription>Create compelling 15-sec, 30-sec, and 60-sec elevator pitches tailored to your background.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2"><Label>Your Name</Label><Input placeholder="e.g. Alex" value={name} onChange={e => setName(e.target.value)} /></div>
          <div className="space-y-2"><Label>Industry</Label><Input placeholder="e.g. FinTech" value={industry} onChange={e => setIndustry(e.target.value)} /></div>
          <div className="space-y-2"><Label>Current Role</Label><Input placeholder="e.g. Frontend Developer" value={currentRole} onChange={e => setCurrentRole(e.target.value)} /></div>
          <div className="space-y-2"><Label>Target Role</Label><Input placeholder="e.g. Product Manager" value={targetRole} onChange={e => setTargetRole(e.target.value)} /></div>
        </div>
        <div className="space-y-2"><Label>Key Skills</Label><Input placeholder="e.g. React, data analytics, cross-functional leadership" value={skills} onChange={e => setSkills(e.target.value)} /></div>
        <div className="space-y-2"><Label>What Makes You Unique?</Label><Textarea placeholder="Your unique value proposition..." value={uniqueValue} onChange={e => setUniqueValue(e.target.value)} rows={2} /></div>
        <Card className="bg-gradient-to-r from-rose-50 to-pink-50 dark:from-rose-900/20 dark:to-pink-900/20 border-rose-200 dark:border-rose-800">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2"><Coins className="w-5 h-5 text-rose-600" /><span className="font-medium text-sm">Cost: 1 credit</span></div>
              <Button onClick={handleGenerate} disabled={isGenerating || (!currentRole && !targetRole)} variant="brand" className="from-rose-600 to-pink-600 hover:from-rose-700 hover:to-pink-700">
                {isGenerating ? <><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />Generating...</> : <><Sparkles className="w-4 h-4 mr-2" />Generate Pitches</>}
              </Button>
            </div>
          </CardContent>
        </Card>
      </CardContent>
    </Card>
  )
}
