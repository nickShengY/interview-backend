"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Mail, Sparkles, Copy, Check, Calendar, Coins } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { authFetch } from "@/lib/auth-fetch"

type EmailVersion = { tone: string; subject: string; body: string; tips: string[] }
type FollowUp = { day: number; action: string; template: string }

type EmailData = {
  emails: EmailVersion[]
  bestPractices: string[]
  followUpSchedule: FollowUp[]
}

const EMAIL_TYPES = [
  "Cold Outreach", "Follow-up After Interview", "Thank You Note",
  "Informational Interview Request", "Referral Request", "Reconnecting with Contact",
  "Job Application Follow-up", "LinkedIn Connection Message",
]

export function NetworkingEmailGenerator() {
  const [emailType, setEmailType] = useState("")
  const [recipientRole, setRecipientRole] = useState("")
  const [recipientCompany, setRecipientCompany] = useState("")
  const [context, setContext] = useState("")
  const [yourBackground, setYourBackground] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [data, setData] = useState<EmailData | null>(null)
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)
  const { toast } = useToast()

  const handleGenerate = async () => {
    if (!emailType) {
      toast({ title: "Missing Info", description: "Please select an email type.", variant: "destructive" })
      return
    }
    setIsGenerating(true)
    try {
      const res = await authFetch("/api/career/networking-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emailType, recipientRole, recipientCompany, context, yourBackground }),
        dedupeKey: `credits:/api/career/networking-email:${emailType}:${recipientCompany}`,
      })
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || "Failed")
      setData(await res.json() as EmailData)
      toast({ title: "Emails Generated!", description: "Your networking emails are ready." })
      if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('credits:update'))
    } catch (error: unknown) {
      toast({ title: "Failed", description: error instanceof Error ? error.message : "Please try again.", variant: "destructive" })
    } finally { setIsGenerating(false) }
  }

  const copyEmail = (subject: string, body: string, i: number) => {
    navigator.clipboard.writeText(`Subject: ${subject}\n\n${body}`)
    setCopiedIndex(i)
    setTimeout(() => setCopiedIndex(null), 2000)
    toast({ title: "Copied!" })
  }

  if (data) {
    return (
      <div className="space-y-6">
        <div className="flex justify-end">
          <Button variant="outline" onClick={() => setData(null)}>← New Email</Button>
        </div>

        {data.emails.map((email, i) => (
          <Card key={i} className="hover:shadow-lg transition-all duration-300">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge className="bg-sky-100 text-sky-800 dark:bg-sky-900 dark:text-sky-200">{email.tone}</Badge>
                </div>
                <Button variant="ghost" size="sm" onClick={() => copyEmail(email.subject, email.body, i)}>
                  {copiedIndex === i ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="bg-sky-50 dark:bg-sky-900/20 rounded-lg p-3 border border-sky-200 dark:border-sky-800">
                <p className="text-xs text-muted-foreground mb-1">Subject Line:</p>
                <p className="font-medium text-sm">{email.subject}</p>
              </div>
              <div className="bg-muted/20 rounded-lg p-4 border border-border">
                <p className="text-sm whitespace-pre-line text-foreground/90">{email.body}</p>
              </div>
              {email.tips.length > 0 && (
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground">Tips for this version:</p>
                  {email.tips.map((t, j) => (
                    <div key={j} className="flex items-start gap-2">
                      <Sparkles className="w-3 h-3 text-sky-500 mt-1 shrink-0" />
                      <span className="text-xs text-muted-foreground">{t}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        ))}

        <div className="grid md:grid-cols-2 gap-4">
          <Card>
            <CardHeader><CardTitle className="text-lg">Best Practices</CardTitle></CardHeader>
            <CardContent>
              {data.bestPractices.map((bp, i) => (
                <div key={i} className="flex items-start gap-2 mb-2">
                  <div className="w-5 h-5 rounded-full bg-sky-100 dark:bg-sky-900/30 flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-xs font-bold text-sky-600">{i + 1}</span>
                  </div>
                  <span className="text-sm">{bp}</span>
                </div>
              ))}
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Calendar className="w-5 h-5 text-sky-600" /> Follow-up Schedule</CardTitle></CardHeader>
            <CardContent>
              {data.followUpSchedule.map((f, i) => (
                <div key={i} className="p-3 mb-2 rounded-lg bg-muted/20 border border-border">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="outline">Day {f.day}</Badge>
                    <span className="font-medium text-sm">{f.action}</span>
                  </div>
                  <p className="text-xs text-muted-foreground italic">&ldquo;{f.template}&rdquo;</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <Card className="border-0 shadow-lg bg-gradient-to-br from-sky-50/50 to-cyan-50/50 dark:from-sky-900/10 dark:to-cyan-900/10">
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Mail className="w-5 h-5 text-sky-600" /> Networking Email Generator</CardTitle>
        <CardDescription>Generate professional networking and follow-up emails tailored to your situation.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Email Type *</Label>
          <Select value={emailType} onValueChange={setEmailType}>
            <SelectTrigger><SelectValue placeholder="Select email type" /></SelectTrigger>
            <SelectContent>
              {EMAIL_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2"><Label>Recipient&apos;s Role</Label><Input placeholder="e.g. Engineering Manager" value={recipientRole} onChange={e => setRecipientRole(e.target.value)} /></div>
          <div className="space-y-2"><Label>Recipient&apos;s Company</Label><Input placeholder="e.g. Google" value={recipientCompany} onChange={e => setRecipientCompany(e.target.value)} /></div>
        </div>
        <div className="space-y-2"><Label>Context / Situation</Label><Textarea placeholder="e.g. Met at a tech conference last week, discussed ML infrastructure..." value={context} onChange={e => setContext(e.target.value)} rows={2} /></div>
        <div className="space-y-2"><Label>Your Background (brief)</Label><Input placeholder="e.g. Senior SWE with 5 years in backend systems" value={yourBackground} onChange={e => setYourBackground(e.target.value)} /></div>
        <Card className="bg-gradient-to-r from-sky-50 to-cyan-50 dark:from-sky-900/20 dark:to-cyan-900/20 border-sky-200 dark:border-sky-800">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2"><Coins className="w-5 h-5 text-sky-600" /><span className="font-medium text-sm">Cost: 1 credit</span></div>
              <Button onClick={handleGenerate} disabled={isGenerating || !emailType} variant="brand" className="from-sky-600 to-cyan-600 hover:from-sky-700 hover:to-cyan-700">
                {isGenerating ? <><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />Generating...</> : <><Sparkles className="w-4 h-4 mr-2" />Generate Emails</>}
              </Button>
            </div>
          </CardContent>
        </Card>
      </CardContent>
    </Card>
  )
}
