"use client"

import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Gift, Loader2 } from "lucide-react"

interface SpinWheelProps {
  rewardAmount: number // 0, 5, or 100
  onComplete: () => void
}

interface Segment {
  label: string
  value: number
  color: string
  svgColor: string
}

type Phase = "ready" | "spinning" | "revealed"

function usePrefersReducedMotion() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)

  useEffect(() => {
    const mql = window.matchMedia("(prefers-reduced-motion: reduce)")
    const update = () => setPrefersReducedMotion(mql.matches)
    update()

    if (typeof mql.addEventListener === "function") {
      mql.addEventListener("change", update)
      return () => mql.removeEventListener("change", update)
    }

    mql.addListener(update)
    return () => mql.removeListener(update)
  }, [])

  return prefersReducedMotion
}

type ConfettiPiece = {
  id: number
  left: number
  dx: number
  dy: number
  rotate: number
  delayMs: number
  durationMs: number
  width: number
  height: number
  color: string
}

type ConfettiStyle = CSSProperties & {
  "--confetti-dx"?: string
  "--confetti-dy"?: string
  "--confetti-rotate"?: string
}

const CONFETTI_COLORS = [
  "#FBBF24",
  "#60A5FA",
  "#34D399",
  "#A78BFA",
  "#FB7185",
  "#F472B6",
]

export function SpinWheel({ rewardAmount, onComplete }: SpinWheelProps) {
  const prefersReducedMotion = usePrefersReducedMotion()
  const [phase, setPhase] = useState<Phase>("ready")
  const [rotation, setRotation] = useState(0)
  const [showConfetti, setShowConfetti] = useState(false)
  const wheelRef = useRef<SVGSVGElement>(null)

  const isSpinning = phase === "spinning"
  const hasSpun = phase !== "ready"
  const spinDurationMs = prefersReducedMotion ? 0 : 4000

  const segments: Segment[] = [
    { label: "100 Credits", value: 100, color: "#FBBF24", svgColor: "#FBBF24" }, // Yellow
    { label: "Try Again", value: 0, color: "#1F2937", svgColor: "#1F2937" }, // Dark gray
    { label: "5 Credits", value: 5, color: "#3B82F6", svgColor: "#3B82F6" }, // Blue
    { label: "Try Again", value: 0, color: "#6B7280", svgColor: "#6B7280" }, // Gray
    { label: "5 Credits", value: 5, color: "#10B981", svgColor: "#10B981" }, // Green
    { label: "Try Again", value: 0, color: "#8B5CF6", svgColor: "#8B5CF6" }, // Purple
  ]

  // Calculate SVG path for a pie slice
  const createPieSlice = (index: number, total: number) => {
    const centerX = 100
    const centerY = 100
    const radius = 90
    const angleSize = 360 / total
    const startAngle = (index * angleSize - 90) * (Math.PI / 180) // Start from top
    const endAngle = ((index + 1) * angleSize - 90) * (Math.PI / 180)

    const x1 = centerX + radius * Math.cos(startAngle)
    const y1 = centerY + radius * Math.sin(startAngle)
    const x2 = centerX + radius * Math.cos(endAngle)
    const y2 = centerY + radius * Math.sin(endAngle)

    const largeArcFlag = angleSize > 180 ? 1 : 0

    return `M ${centerX},${centerY} L ${x1},${y1} A ${radius},${radius} 0 ${largeArcFlag},1 ${x2},${y2} Z`
  }

  // Calculate text position and rotation for each segment
  const getTextTransform = (index: number, total: number) => {
    const angleSize = 360 / total
    const angle = index * angleSize + angleSize / 2 - 90 // Center of segment, starting from top
    const radius = 60 // Distance from center for text
    const x = 100 + radius * Math.cos(angle * (Math.PI / 180))
    const y = 100 + radius * Math.sin(angle * (Math.PI / 180))
    const textRotation = angle + 90 // Rotate text to be tangent to the circle

    return { x, y, rotation: textRotation }
  }

  const spin = () => {
    if (hasSpun) return

    setPhase("spinning")
    
    // Find the target segment that matches the reward
    const matchingIndices = segments.reduce<number[]>((acc, s, idx) => {
      if (s.value === rewardAmount) acc.push(idx)
      return acc
    }, [])
    const actualTargetIndex = matchingIndices.length
      ? matchingIndices[Math.floor(Math.random() * matchingIndices.length)]
      : 1 // Default to first "Try Again"
    
    // Calculate angle to land on target segment (accounting for pointer at top)
    const segmentAngle = 360 / segments.length
    const targetAngle = actualTargetIndex * segmentAngle
    
    // We want the pointer to land in the middle of the target segment
    // Since pointer is at top (0°), we need to rotate so target segment center aligns with pointer
    const spins = prefersReducedMotion ? 0 : 5 + Math.random() * 3 // 5-8 full rotations
    const randomOffset = prefersReducedMotion ? 0 : Math.random() * 20 - 10 // Small random offset within segment
    
    // Calculate final rotation: compensate for segment position + multiple spins + small offset
    const finalAngle = 360 - targetAngle + (segmentAngle / 2) + randomOffset
    const totalRotation = rotation + spins * 360 + finalAngle

    setRotation(totalRotation)

    window.setTimeout(() => {
      setPhase("revealed")
    }, spinDurationMs)
  }

  useEffect(() => {
    if (phase !== "revealed") return
    if (rewardAmount <= 0) return
    if (prefersReducedMotion) return

    setShowConfetti(true)
    const t = window.setTimeout(() => setShowConfetti(false), 1500)
    return () => window.clearTimeout(t)
  }, [phase, prefersReducedMotion, rewardAmount])

  const confettiPieces = useMemo<ConfettiPiece[]>(() => {
    if (!showConfetti) return []

    return Array.from({ length: 36 }, (_, id) => ({
      id,
      left: Math.random() * 100,
      dx: (Math.random() - 0.5) * 520,
      dy: 260 + Math.random() * 520,
      rotate: Math.random() * 360,
      delayMs: Math.random() * 150,
      durationMs: 900 + Math.random() * 600,
      width: 6 + Math.random() * 6,
      height: 10 + Math.random() * 10,
      color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
    }))
  }, [showConfetti])

  const handleRequestClose = () => {
    if (isSpinning) return
    onComplete()
  }

  const revealTitle = rewardAmount > 0 ? "Reward revealed" : "Try again"
  const revealValue = rewardAmount > 0 ? `+${rewardAmount}` : "0"
  const revealValueSuffix = rewardAmount === 1 ? "credit" : "credits"
  const revealContainerClass =
    rewardAmount > 0 ? "bg-primary/10 border-primary/20" : "bg-muted/30 border-border"
  const revealValueClass =
    rewardAmount === 100
      ? "text-amber-500"
      : rewardAmount > 0
        ? "text-primary"
        : "text-muted-foreground"

  return (
    <Dialog
      open
      onOpenChange={(openState) => {
        if (!openState) handleRequestClose()
      }}
    >
      <DialogContent
        className="sm:max-w-md overflow-hidden"
        onEscapeKeyDown={(e) => {
          if (isSpinning) e.preventDefault()
        }}
        onPointerDownOutside={(e) => {
          if (isSpinning) e.preventDefault()
        }}
      >
        {showConfetti && (
          <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
            {confettiPieces.map((piece) => {
              const style: ConfettiStyle = {
                left: `${piece.left}%`,
                width: `${piece.width}px`,
                height: `${piece.height}px`,
                backgroundColor: piece.color,
                animationDelay: `${piece.delayMs}ms`,
                animationDuration: `${piece.durationMs}ms`,
                "--confetti-dx": `${piece.dx}px`,
                "--confetti-dy": `${piece.dy}px`,
                "--confetti-rotate": `${piece.rotate}deg`,
              }

              return <div key={piece.id} className="spin-wheel-confetti-piece" style={style} />
            })}
          </div>
        )}

        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Gift className="h-5 w-5 text-primary" />
            <span>Spin to reveal your reward</span>
          </DialogTitle>
          <DialogDescription>
            You&apos;ve completed the session. Take one spin to see what you earned.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div className="relative mx-auto aspect-square w-[min(20rem,84vw)] max-w-80">
            {/* Pointer - positioned at top center */}
            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-2 z-20">
              <div className="w-0 h-0 border-l-[12px] border-r-[12px] border-t-[20px] border-l-transparent border-r-transparent border-t-red-600 drop-shadow-lg"></div>
            </div>

            {/* Wheel Container */}
            <div className="relative h-full w-full">
              <svg
                ref={wheelRef}
                viewBox="0 0 200 200"
                className="h-full w-full transition-transform ease-out"
                style={{
                  transform: `rotate(${rotation}deg)`,
                  transitionDuration: isSpinning ? `${spinDurationMs}ms` : "0ms",
                }}
              >
                {/* Wheel segments */}
                {segments.map((segment, index) => (
                  <g key={index}>
                    {/* Segment slice */}
                    <path
                      d={createPieSlice(index, segments.length)}
                      fill={segment.svgColor}
                      stroke="#ffffff"
                      strokeWidth="2"
                    />
                    {/* Text */}
                    <text
                      x={getTextTransform(index, segments.length).x}
                      y={getTextTransform(index, segments.length).y}
                      fill="white"
                      fontSize="11"
                      fontWeight="bold"
                      textAnchor="middle"
                      dominantBaseline="middle"
                      transform={`rotate(${getTextTransform(index, segments.length).rotation}, ${getTextTransform(index, segments.length).x}, ${getTextTransform(index, segments.length).y})`}
                    >
                      {segment.label}
                    </text>
                  </g>
                ))}

                {/* Center circle decoration */}
                <circle cx="100" cy="100" r="15" fill="#ffffff" stroke="#1F2937" strokeWidth="2" />
                <circle cx="100" cy="100" r="8" fill="#1F2937" />
              </svg>

              {/* Outer border ring */}
              <div className="absolute inset-0 rounded-full border-4 border-border pointer-events-none"></div>
            </div>
          </div>

          {phase === "revealed" && (
            <div
              className={`rounded-lg border p-4 text-center ${revealContainerClass}`}
              role="status"
              aria-live="polite"
            >
              <div className="text-sm font-semibold text-foreground">{revealTitle}</div>
              <div className={`mt-1 text-4xl font-extrabold tracking-tight ${revealValueClass}`}>
                {revealValue}
              </div>
              <div className="text-sm text-muted-foreground">{revealValueSuffix}</div>
            </div>
          )}

          <div className="space-y-2">
            {phase === "ready" && (
              <Button
                onClick={spin}
                size="lg"
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold"
              >
                Spin the Wheel
              </Button>
            )}

            {phase === "spinning" && (
              <Button
                disabled
                size="lg"
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold"
              >
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Spinning...
              </Button>
            )}

            {phase === "revealed" && (
              <Button
                onClick={handleRequestClose}
                size="lg"
                className="w-full"
              >
                Continue
              </Button>
            )}
          </div>
        </div>

        <style jsx>{`
          @keyframes spinWheelConfetti {
            0% {
              transform: translate3d(0, 0, 0) rotate(0deg);
              opacity: 1;
            }
            100% {
              transform: translate3d(var(--confetti-dx), var(--confetti-dy), 0)
                rotate(var(--confetti-rotate));
              opacity: 0;
            }
          }

          .spin-wheel-confetti-piece {
            position: absolute;
            top: -12px;
            border-radius: 2px;
            opacity: 0.95;
            animation-name: spinWheelConfetti;
            animation-timing-function: cubic-bezier(0.1, 0.8, 0.2, 1);
            animation-fill-mode: forwards;
            will-change: transform, opacity;
          }
        `}</style>
      </DialogContent>
    </Dialog>
  )
}
