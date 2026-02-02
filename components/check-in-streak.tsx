"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useSession } from "@/lib/auth-client"
import { authFetch } from "@/lib/auth-fetch"
import { CalendarCheck, Flame, Trophy, Gift } from "lucide-react"
import { toast } from "sonner"

interface CheckInStatus {
  currentStreak: number
  longestStreak: number
  totalCheckIns: number
  lastCheckIn: string | null
  canCheckIn: boolean
}

export function CheckInStreak() {
  const session = useSession()
  const [status, setStatus] = useState<CheckInStatus | null>(null)
  const [loading, setLoading] = useState(false)
  const [checking, setChecking] = useState(false)

  useEffect(() => {
    if (session.status === 'authenticated') {
      fetchStatus()
    }
  }, [session.status])

  const fetchStatus = async () => {
    try {
      setLoading(true)
      const res = await authFetch('/api/user/checkin')
      if (res.ok) {
        const data = await res.json()
        setStatus(data)
      }
    } catch (error) {
      console.error('Failed to fetch check-in status:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCheckIn = async () => {
    try {
      setChecking(true)
      const res = await authFetch('/api/user/checkin', {
        method: 'POST',
        dedupeKey: 'credits:/api/user/checkin:POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      
      const data = await res.json()
      
      if (res.ok && data.success) {
        toast.success(data.message, {
          description: `+${data.reward} credits earned! ${data.bonusReward > 0 ? '🔥 Streak Bonus!' : ''}`,
        })
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('credits:update'))
        }
        fetchStatus()
      } else {
        toast.info(data.message || 'Already checked in today')
      }
    } catch (error) {
      console.error('Check-in failed:', error)
      toast.error('Failed to check in')
    } finally {
      setChecking(false)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-muted rounded w-3/4"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="bg-gradient-to-br from-orange-500/10 to-red-500/10">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Flame className="h-5 w-5 text-orange-500" />
              Daily Check-In
            </CardTitle>
            <CardDescription>Build your streak and earn free credits!</CardDescription>
          </div>
          {status?.canCheckIn && (
            <Button 
              onClick={handleCheckIn} 
              disabled={checking}
              size="lg"
              className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
            >
              <Gift className="mr-2 h-4 w-4" />
              {checking ? 'Checking In...' : 'Check In'}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex flex-col items-center p-4 bg-muted rounded-lg">
            <Flame className="h-8 w-8 text-orange-500 mb-2" />
            <p className="text-2xl font-bold">{status?.currentStreak || 0}</p>
            <p className="text-sm text-muted-foreground">Current Streak</p>
          </div>
          <div className="flex flex-col items-center p-4 bg-muted rounded-lg">
            <Trophy className="h-8 w-8 text-yellow-500 mb-2" />
            <p className="text-2xl font-bold">{status?.longestStreak || 0}</p>
            <p className="text-sm text-muted-foreground">Longest Streak</p>
          </div>
          <div className="flex flex-col items-center p-4 bg-muted rounded-lg">
            <CalendarCheck className="h-8 w-8 text-blue-500 mb-2" />
            <p className="text-2xl font-bold">{status?.totalCheckIns || 0}</p>
            <p className="text-sm text-muted-foreground">Total Check-Ins</p>
          </div>
        </div>
        
        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
          <h4 className="font-semibold mb-2 flex items-center gap-2">
            <Gift className="h-4 w-4" />
            Streak Rewards
          </h4>
          <ul className="text-sm space-y-1 text-muted-foreground">
            <li>• Daily check-in: <strong>5 credits</strong></li>
            <li>• 3+ day streak: <strong>+{(status?.currentStreak || 0)} bonus credits</strong></li>
            <li>• 7 day streak: <strong>+20 bonus credits</strong> 🔥</li>
            <li>• 30 day streak: <strong>+100 bonus credits</strong> 🏆</li>
          </ul>
        </div>

        {!status?.canCheckIn && (
          <p className="mt-4 text-center text-sm text-muted-foreground">
            ✅ Already checked in today! Come back tomorrow.
          </p>
        )}
      </CardContent>
    </Card>
  )
}
