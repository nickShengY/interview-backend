"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { History, MessageSquare, Users } from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { authFetch } from "@/lib/auth-fetch"

type QA = {
  id: string
  kind: "TECH" | "BEHAV"
  question: string
  answer: string
  feedback?: string | null
  createdAt: string
}

export default function ReviewPage() {
  const [qas, setQas] = useState<QA[]>([])
  
  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const res = await authFetch('/api/qa')
        const data: unknown = await res.json()
        const qasValue =
          data && typeof data === "object" && "qas" in data
            ? (data as { qas: unknown }).qas
            : []
        const rawQas = Array.isArray(qasValue) ? qasValue : []
        const parsed: QA[] = rawQas
          .map((q) => {
            const qObj = q && typeof q === "object" ? (q as Record<string, unknown>) : null
            const id = typeof qObj?.id === "string" ? qObj.id : ""
            const kindValue = qObj?.kind
            const kind: QA["kind"] | null =
              kindValue === "TECH" || kindValue === "BEHAV" ? kindValue : null
            const question = typeof qObj?.question === "string" ? qObj.question : ""
            const answer = typeof qObj?.answer === "string" ? qObj.answer : ""
            const createdAt = typeof qObj?.createdAt === "string" ? qObj.createdAt : ""

            if (!id || !kind || !question || !createdAt) return null

            const qa: QA = {
              id,
              kind,
              question,
              answer,
              feedback: typeof qObj?.feedback === "string" ? qObj.feedback : null,
              createdAt,
            }

            return qa
          })
          .filter((q): q is QA => q !== null)

        if (mounted) setQas(parsed)
      } catch {
        // ignore
      }
    })()
    return () => {
      mounted = false
    }
  }, [])

  const technicalQas = qas.filter(q => q.kind === 'TECH')
  const behavioralQas = qas.filter(q => q.kind === 'BEHAV')

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <PageHeader
        title="Practice Review"
        description="Review your interview practice history and track your progress"
        titleClassName="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"
      />

      <Tabs defaultValue="technical" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20">
          <TabsTrigger 
            value="technical" 
            className="flex items-center space-x-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-purple-600 data-[state=active]:text-white"
          >
            <MessageSquare className="w-4 h-4" />
            <span>Technical ({technicalQas.length})</span>
          </TabsTrigger>
          <TabsTrigger 
            value="behavioral" 
            className="flex items-center space-x-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-purple-600 data-[state=active]:text-white"
          >
            <Users className="w-4 h-4" />
            <span>Behavioral ({behavioralQas.length})</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="technical" className="space-y-4">
          {technicalQas.length === 0 ? (
            <Card className="bg-gradient-to-br from-blue-50/30 to-purple-50/30 dark:from-blue-900/10 dark:to-purple-900/10">
              <CardContent className="pt-6">
                <div className="text-center text-muted-foreground">
                  <History className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No technical questions answered yet. Start practicing to see your progress!</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            technicalQas.map((qa) => (
              <Card key={qa.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg">{qa.question}</CardTitle>
                    <Badge variant={qa.feedback === 'Correct' ? 'default' : 'destructive'}>
                      {qa.feedback}
                    </Badge>
                  </div>
                  <CardDescription>{new Date(qa.createdAt).toLocaleDateString()}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="p-3 bg-muted/30 border border-border rounded-lg">
                      <h4 className="font-medium mb-1 text-foreground">Your Answer:</h4>
                      <p className="text-foreground/90">{qa.answer}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="behavioral" className="space-y-4">
          {behavioralQas.length === 0 ? (
            <Card className="bg-gradient-to-br from-pink-50/30 to-purple-50/30 dark:from-pink-900/10 dark:to-purple-900/10">
              <CardContent className="pt-6">
                <div className="text-center text-muted-foreground">
                  <History className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No behavioral questions answered yet. Start practicing to see your progress!</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            behavioralQas.map((qa) => (
              <Card key={qa.id}>
                <CardHeader>
                  <CardTitle className="text-lg">{qa.question}</CardTitle>
                  <CardDescription>{new Date(qa.createdAt).toLocaleDateString()}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="p-3 bg-muted/30 border border-border rounded-lg">
                    <h4 className="font-medium mb-1 text-foreground">Your Answer:</h4>
                    <p className="text-foreground/90">{qa.answer}</p>
                  </div>
                  <div className="mt-3 p-2 bg-muted/30 border border-border rounded text-sm text-muted-foreground">
                    Note: Voice recordings are not stored for privacy
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
