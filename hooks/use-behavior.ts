"use client"

import { useState } from "react"
import { useToast } from "@/hooks/use-toast"
import { authFetch } from "@/lib/auth-fetch"

export function useBehavior() {
  const toast = useToast()
  const [loading, setLoading] = useState(false)
  const [questions, setQuestions] = useState<string[]>([])

  const generate = async (industry: string, title: string) => {
    setLoading(true)
    try {
      const res = await authFetch("/api/interview/behavioral", {
        method: "POST",
        body: JSON.stringify({ industry, title }),
        headers: { "Content-Type": "application/json" },
        dedupeKey: `credits:/api/interview/behavioral:${industry}:${title}`,
      })
      if (!res.ok) throw new Error(await res.text())
      const json = await res.json()
      let qs: string[] = []
      if (typeof json?.questionsMd === "string") {
        const lines = json.questionsMd.split("\n").filter((l: string) => l.trim())
        qs = lines.map((l: string) => l.replace(/^[-*]\s*/, ""))
      } else if (Array.isArray(json?.questions)) {
        qs = json.questions
          .map((q: any) => (typeof q === "string" ? q : q?.question))
          .filter((q: any) => typeof q === "string" && q.trim())
      } else {
        throw new Error("Unexpected response from question generator")
      }
      setQuestions(qs)
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("credits:update"))
      }
    } catch (e: any) {
      toast.toast({ 
        title: "Error", 
        description: e.message || "Failed to generate questions",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  return { loading, questions, generate }
}
