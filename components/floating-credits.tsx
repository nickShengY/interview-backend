"use client"

import { useState, useEffect, useRef } from "react"
import { useSession } from "@/lib/auth-client"
import { authFetch } from "@/lib/auth-fetch"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Coins, Plus, Sparkles, TrendingUp } from "lucide-react"
import { cn } from "@/lib/utils"

// Throttle fetches across StrictMode double mounts and re-renders
let _lastFetchMs = 0
const MIN_REFRESH_MS = 60_000

interface Transaction {
  id: string
  type: string
  delta: number
  createdAt: string
}

export function FloatingCredits() {
  const { data: session } = useSession()
  const [isExpanded, setIsExpanded] = useState(false)
  const [credits, setCredits] = useState(0)
  const [recentActivity, setRecentActivity] = useState<Transaction[]>([])
  const hasFetched = useRef(false)

  useEffect(() => {
    if (!session) return
    if (hasFetched.current) return
    const now = Date.now()
    if (now - _lastFetchMs < MIN_REFRESH_MS) {
      hasFetched.current = true
      return
    }
    hasFetched.current = true
    _lastFetchMs = now
    fetchCredits()
    fetchTransactions()
  }, [session])

  // Immediate refresh when other parts of the app signal a credit change
  useEffect(() => {
    function onCreditsUpdate() {
      fetchCredits()
      fetchTransactions()
    }
    if (typeof window !== 'undefined') {
      window.addEventListener('credits:update', onCreditsUpdate as EventListener)
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('credits:update', onCreditsUpdate as EventListener)
      }
    }
  }, [])

  // Refresh transactions when user expands the panel
  useEffect(() => {
    if (!session) return
    if (!isExpanded) return
    const now = Date.now()
    if (now - _lastFetchMs < MIN_REFRESH_MS) return
    _lastFetchMs = now
    fetchTransactions()
  }, [isExpanded, session])

  async function fetchCredits() {
    try {
      const res = await authFetch('/api/user/credits')
      if (res.ok) {
        const data = await res.json()
        setCredits(data.credits || 0)
      }
    } catch (error) {
      console.error('Failed to fetch credits:', error)
    }
  }

  async function fetchTransactions() {
    try {
      const res = await authFetch('/api/user/transactions?limit=3')
      if (res.ok) {
        const data = await res.json()
        setRecentActivity(data)
      }
    } catch (error) {
      console.error('Failed to fetch transactions:', error)
    }
  }

  if (!session) {
    return null
  }

  const getActivityLabel = (type: string) => {
    const labels: Record<string, string> = {
      'ATS_SCAN': 'ATS scan',
      'COVER_LETTER': 'Cover letter',
      'TECH_Q': 'Technical question',
      'BEHAV_Q': 'Behavioral question',
      'REWARD': 'Spin wheel reward',
      'STRIPE_TOPUP': 'Credit purchase'
    }
    return labels[type] || type
  }

  return (
    <div className="fixed bottom-6 left-6 z-40">
      <div
        className={cn(
          "inline-block cursor-pointer rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 p-[2px] transition-all duration-500 hover:shadow-2xl dark:from-blue-500 dark:to-purple-500 max-w-[calc(100vw-3rem)]",
          isExpanded ? "w-80" : "w-auto",
        )}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <Card className="w-full rounded-xl border-0 bg-background/95 shadow-none">
          <CardContent className="p-4">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center animate-pulse-glow dark:from-blue-500 dark:to-purple-500">
                <Coins className="w-6 h-6 text-white animate-spin-slow" />
              </div>
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-background rounded-full flex items-center justify-center border border-border">
                <Plus className="w-2 h-2 text-foreground" />
              </div>
            </div>

            <div className="flex-1">
              <div className="flex items-center space-x-2">
                <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent dark:from-blue-500 dark:to-purple-500">
                  {credits}
                </span>
                <Badge variant="outline" className="gap-1">
                  <Sparkles className="w-3 h-3 mr-1" />
                  Credits
                </Badge>
              </div>
              {isExpanded && (
                <div className="mt-3 space-y-2 animate-in slide-in-from-bottom-2 duration-300">
                  <div className="text-sm font-medium text-foreground/80 flex items-center space-x-1">
                    <TrendingUp className="w-3 h-3" />
                    <span>Recent Activity</span>
                  </div>
                  {recentActivity.map((activity) => (
                    <div key={activity.id} className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">{getActivityLabel(activity.type)}</span>
                      <span
                        className={cn(
                          "font-bold",
                          activity.delta > 0
                            ? "text-primary"
                            : "text-destructive",
                        )}
                      >
                        {activity.delta > 0 ? "+" : ""}
                        {activity.delta}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
