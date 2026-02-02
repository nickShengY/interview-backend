"use client"

import { useState } from "react"
import { authFetch } from "@/lib/auth-fetch"

export function useCoverLetter() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [cover, setCover] = useState<string | null>(null)

  const generate = async (file: File, jd: string) => {
    setLoading(true)
    setError(null)
    try {
      const form = new FormData()
      form.append("resume", file)
      form.append("jd", jd)
      const jdSig = `${jd.length}:${jd.length ? jd.charCodeAt(0) : 0}:${jd.length ? jd.charCodeAt(jd.length - 1) : 0}`
      const res = await authFetch("/api/ats/cover-letter", {
        method: "POST",
        body: form,
        dedupeKey: `credits:/api/ats/cover-letter:${file.name}:${file.size}:${file.lastModified}:${jdSig}`,
      })
      if (!res.ok) throw new Error(await res.text())
      const json = await res.json()
      setCover(json.cover_letter)
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("credits:update"))
      }
      return json.cover_letter as string
    } catch (e: any) {
      setError(e.message || "Unknown error")
      throw e
    } finally {
      setLoading(false)
    }
  }

  return { generate, loading, error, cover }
}
