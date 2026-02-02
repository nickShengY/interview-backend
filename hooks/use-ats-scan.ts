"use client"

import { useState } from "react"
import { authFetch } from "@/lib/auth-fetch"

interface AtsResult {
  traditional_score: number
  ai_score: number
  missing_keywords: string[]
  matched_keywords?: string[]
  formatting_penalty: number
  analysis_id: string
  quality_indicators?: {
    action_verbs_bonus: number
    quantifiable_results_bonus: number
    certifications_found: string[]
    certifications_bonus: number
  }
  warnings?: string[]
}

export function useAtsScan(apiPath: string = "/api/ats/scan") {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<AtsResult | null>(null)

  const runScan = async (file: File, jd: string) => {
    setLoading(true)
    setError(null)
    try {
      const form = new FormData()
      form.append("resume", file)
      form.append("jd", jd)

      const jdSig = `${jd.length}:${jd.length ? jd.charCodeAt(0) : 0}:${jd.length ? jd.charCodeAt(jd.length - 1) : 0}`

      const res = await authFetch(apiPath, {
        method: "POST",
        body: form,
        dedupeKey: `credits:${apiPath}:${file.name}:${file.size}:${file.lastModified}:${jdSig}`,
      })

      if (!res.ok) {
        throw new Error(await res.text())
      }
      const json: AtsResult = await res.json()
      setData(json)
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("credits:update"))
      }
      return json
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Unknown error"
      setError(message)
      throw e
    } finally {
      setLoading(false)
    }
  }

  return { runScan, loading, error, data }
}
