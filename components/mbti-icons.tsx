"use client"

import { Brain, Heart, Target, Lightbulb, Users, Shield, Sparkles, Zap, Crown, Star, Compass, Rocket, Music, Palette, Code } from "lucide-react"

export const mbtiConfig = {
  // Analysts
  INTJ: {
    name: "Architect",
    color: "from-purple-500 to-indigo-600",
    icon: Brain,
    description: "Strategic, logical, and independent thinkers",
    traits: ["Strategic", "Innovative", "Independent"]
  },
  INTP: {
    name: "Logician",
    color: "from-blue-500 to-purple-600",
    icon: Lightbulb,
    description: "Innovative inventors with endless curiosity",
    traits: ["Analytical", "Creative", "Objective"]
  },
  ENTJ: {
    name: "Commander",
    color: "from-red-500 to-purple-600",
    icon: Crown,
    description: "Bold, imaginative, and strong-willed leaders",
    traits: ["Leadership", "Efficient", "Strategic"]
  },
  ENTP: {
    name: "Debater",
    color: "from-orange-500 to-pink-600",
    icon: Zap,
    description: "Smart and curious thinkers who love debate",
    traits: ["Innovative", "Resourceful", "Charismatic"]
  },

  // Diplomats
  INFJ: {
    name: "Advocate",
    color: "from-green-500 to-teal-600",
    icon: Heart,
    description: "Quiet and mystical, yet very inspiring",
    traits: ["Insightful", "Principled", "Altruistic"]
  },
  INFP: {
    name: "Mediator",
    color: "from-blue-400 to-green-500",
    icon: Palette,
    description: "Poetic, kind and altruistic people",
    traits: ["Idealistic", "Empathetic", "Creative"]
  },
  ENFJ: {
    name: "Protagonist",
    color: "from-pink-500 to-red-500",
    icon: Star,
    description: "Charismatic and inspiring leaders",
    traits: ["Charismatic", "Empathetic", "Leader"]
  },
  ENFP: {
    name: "Campaigner",
    color: "from-yellow-500 to-orange-500",
    icon: Sparkles,
    description: "Enthusiastic, creative and sociable free spirits",
    traits: ["Enthusiastic", "Creative", "Sociable"]
  },

  // Sentinels
  ISTJ: {
    name: "Logistician",
    color: "from-gray-600 to-blue-700",
    icon: Shield,
    description: "Practical and fact-minded individuals",
    traits: ["Reliable", "Practical", "Organized"]
  },
  ISFJ: {
    name: "Defender",
    color: "from-teal-500 to-blue-600",
    icon: Users,
    description: "Very dedicated and warm protectors",
    traits: ["Supportive", "Reliable", "Patient"]
  },
  ESTJ: {
    name: "Executive",
    color: "from-blue-600 to-indigo-700",
    icon: Target,
    description: "Excellent administrators, unsurpassed at managing",
    traits: ["Organized", "Direct", "Loyal"]
  },
  ESFJ: {
    name: "Consul",
    color: "from-pink-400 to-rose-500",
    icon: Heart,
    description: "Extraordinarily caring, social and popular",
    traits: ["Caring", "Social", "Popular"]
  },

  // Explorers
  ISTP: {
    name: "Virtuoso",
    color: "from-orange-600 to-red-600",
    icon: Code,
    description: "Bold and practical experimenters",
    traits: ["Practical", "Independent", "Adaptable"]
  },
  ISFP: {
    name: "Adventurer",
    color: "from-purple-400 to-pink-500",
    icon: Music,
    description: "Flexible and charming artists",
    traits: ["Artistic", "Curious", "Spontaneous"]
  },
  ESTP: {
    name: "Entrepreneur",
    color: "from-red-500 to-orange-600",
    icon: Rocket,
    description: "Smart, energetic and very perceptive",
    traits: ["Energetic", "Perceptive", "Direct"]
  },
  ESFP: {
    name: "Entertainer",
    color: "from-yellow-400 to-pink-500",
    icon: Compass,
    description: "Spontaneous, energetic and enthusiastic",
    traits: ["Spontaneous", "Energetic", "Enthusiastic"]
  },
}

interface MBTIIconProps {
  type: string
  size?: "sm" | "md" | "lg" | "xl"
  showName?: boolean
  showDescription?: boolean
  className?: string
}

export function MBTIIcon({ type, size = "md", showName = false, showDescription = false, className = "" }: MBTIIconProps) {
  const config = mbtiConfig[type as keyof typeof mbtiConfig]
  
  if (!config) return null

  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-12 h-12",
    lg: "w-16 h-16",
    xl: "w-24 h-24"
  }

  const iconSizes = {
    sm: "w-4 h-4",
    md: "w-6 h-6",
    lg: "w-8 h-8",
    xl: "w-12 h-12"
  }

  const Icon = config.icon

  return (
    <div className={`flex items-center space-x-3 ${className}`}>
      <div className={`${sizeClasses[size]} bg-gradient-to-br ${config.color} rounded-2xl flex items-center justify-center shadow-lg hover:scale-110 transition-transform duration-300`}>
        <Icon className={`${iconSizes[size]} text-white`} />
      </div>
      {(showName || showDescription) && (
        <div className="flex-1">
          {showName && (
            <div className="font-bold text-foreground">
              {type} - {config.name}
            </div>
          )}
          {showDescription && (
            <div className="text-sm text-muted-foreground mt-1">
              {config.description}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

interface MBTICardProps {
  type: string
  selected?: boolean
  onClick?: () => void
}

export function MBTICard({ type, selected = false, onClick }: MBTICardProps) {
  const config = mbtiConfig[type as keyof typeof mbtiConfig]
  
  if (!config) return null

  const Icon = config.icon

  return (
    <div
      onClick={onClick}
      className={`relative p-6 rounded-2xl cursor-pointer transition-all duration-300 hover:scale-105 ${
        selected
          ? `bg-gradient-to-br ${config.color} text-white shadow-2xl scale-105`
          : "bg-card hover:shadow-xl border-2 border-border"
      }`}
    >
      <div className="flex flex-col items-center text-center space-y-3">
        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${
          selected ? "bg-white/20" : `bg-gradient-to-br ${config.color}`
        }`}>
          <Icon className={`w-8 h-8 ${selected ? "text-white" : "text-white"}`} />
        </div>
        
        <div>
          <div className="font-bold text-lg">{type}</div>
          <div className={`text-sm ${selected ? "text-white/90" : "text-muted-foreground"}`}>
            {config.name}
          </div>
        </div>

        <div className="flex flex-wrap gap-2 justify-center">
          {config.traits.map((trait, idx) => (
            <span
              key={idx}
              className={`text-xs px-2 py-1 rounded-full ${
                selected
                  ? "bg-white/20 text-white"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {trait}
            </span>
          ))}
        </div>
      </div>

      {selected && (
        <div className="absolute -top-2 -right-2">
          <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center shadow-lg">
            <div className="w-3 h-3 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full"></div>
          </div>
        </div>
      )}
    </div>
  )
}
