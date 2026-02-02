"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Sparkles } from "lucide-react"
import { authFetch } from "@/lib/auth-fetch"

export default function DevDemoButton() {
  const [loading, setLoading] = useState(false)

  // Do not render in production builds
  if (process.env.NODE_ENV === "production") return null

  async function enableDemoAndAddCredits() {
    try {
      setLoading(true)
      // Enable demo mode in client
      if (typeof window !== "undefined") {
        localStorage.setItem("demo_user", "1")
      }
      // Hit dev API to grant 100 credits to demo user
      await authFetch("/api/dev/demo-credits", { method: "POST" })
      // Soft feedback
      // eslint-disable-next-line no-alert
      alert("Demo enabled. Added 100 credits to demo user.")
      // Optional reload to refresh UI widgets
      if (typeof window !== "undefined") window.location.reload()
    } catch (e) {
      // eslint-disable-next-line no-alert
      alert("Failed to add demo credits. Check console.")
      // eslint-disable-next-line no-console
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <Button
        onClick={enableDemoAndAddCredits}
        disabled={loading}
        variant="brand"
      >
        <Sparkles className="w-4 h-4 mr-2" />
        {loading ? "Enabling Demo..." : "+100 Demo Credits"}
      </Button>
    </div>
  )
}
