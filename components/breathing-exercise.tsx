"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { X, Play, Pause, RotateCcw } from "lucide-react"

interface BreathingExerciseProps {
  onClose: () => void
}

const PHASES = {
  inhale: { duration: 4, next: "hold", instruction: "Breathe In", color: "from-blue-400 to-blue-600" },
  hold: { duration: 4, next: "exhale", instruction: "Hold", color: "from-purple-400 to-purple-600" },
  exhale: { duration: 6, next: "inhale", instruction: "Breathe Out", color: "from-green-400 to-green-600" },
} as const

type Phase = keyof typeof PHASES

export function BreathingExercise({ onClose }: BreathingExerciseProps) {
  const [isActive, setIsActive] = useState(false)
  const [phase, setPhase] = useState<Phase>("inhale")
  const [count, setCount] = useState(4)
  const [cycle, setCycle] = useState(0)
  const [scale, setScale] = useState(1)

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | undefined

    if (isActive) {
      interval = setInterval(() => {
        setCount((prev) => {
          if (prev <= 1) {
            const currentPhase = PHASES[phase]
            const nextPhase = currentPhase.next
            setPhase(nextPhase)

            if (nextPhase === "inhale") {
              setCycle((prev) => prev + 1)
            }

            return PHASES[nextPhase].duration
          }
          return prev - 1
        })
      }, 1000)
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isActive, phase])

  useEffect(() => {
    // Animate the breathing circle
    if (phase === "inhale") {
      setScale(1.5)
    } else if (phase === "exhale") {
      setScale(0.8)
    } else {
      setScale(1.2)
    }
  }, [phase])

  const startExercise = () => {
    setIsActive(true)
    setPhase("inhale")
    setCount(4)
    setCycle(0)
  }

  const pauseExercise = () => {
    setIsActive(false)
  }

  const resetExercise = () => {
    setIsActive(false)
    setPhase("inhale")
    setCount(4)
    setCycle(0)
    setScale(1)
  }

  const currentPhase = PHASES[phase]

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Breathing Exercise
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-8">
          {/* Breathing Circle */}
          <div className="flex items-center justify-center h-64">
            <div className="relative">
              <div
                className={`w-32 h-32 rounded-full bg-gradient-to-br ${currentPhase.color} transition-transform duration-1000 ease-in-out flex items-center justify-center shadow-2xl`}
                style={{ transform: `scale(${scale})` }}
              >
                <div className="text-white text-center">
                  <div className="text-2xl font-bold">{count}</div>
                  <div className="text-sm opacity-90">{currentPhase.instruction}</div>
                </div>
              </div>

              {/* Ripple effect */}
              {isActive && <div className="absolute inset-0 rounded-full border-4 border-white/30 animate-ping"></div>}
            </div>
          </div>

          {/* Instructions */}
          <div className="text-center space-y-2">
            <h3 className="text-xl font-semibold">{currentPhase.instruction}</h3>
            <p className="text-muted-foreground">
              {phase === "inhale" && "Slowly breathe in through your nose"}
              {phase === "hold" && "Hold your breath gently"}
              {phase === "exhale" && "Slowly breathe out through your mouth"}
            </p>
            <p className="text-sm text-muted-foreground">Cycle: {cycle}/5</p>
          </div>

          {/* Controls */}
          <div className="flex justify-center space-x-4">
            {!isActive ? (
              <Button
                onClick={startExercise}
                variant="brand"
              >
                <Play className="w-4 h-4 mr-2" />
                Start
              </Button>
            ) : (
              <Button onClick={pauseExercise} variant="outline">
                <Pause className="w-4 h-4 mr-2" />
                Pause
              </Button>
            )}

            <Button onClick={resetExercise} variant="outline">
              <RotateCcw className="w-4 h-4 mr-2" />
              Reset
            </Button>
          </div>

          {/* Tips */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-800 mb-2">💡 Tips for Better Breathing</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Find a comfortable, quiet position</li>
              <li>• Focus on the rhythm and let your mind relax</li>
              <li>• Complete 5 cycles for optimal relaxation</li>
              <li>• Use this before starting your interview practice</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
