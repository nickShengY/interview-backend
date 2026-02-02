"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface MBTISelectorProps {
  value: string
  onChange: (value: string) => void
  disabled?: boolean
}

const mbtiTypes = [
  {
    type: "INTJ",
    name: "The Architect",
    description: "Imaginative and strategic thinkers, with a plan for everything.",
    color:
      "bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-700",
    gradient: "from-purple-500 to-indigo-600",
    figure: "🏗️",
    traits: ["Strategic", "Independent", "Decisive"],
  },
  {
    type: "INTP",
    name: "The Thinker",
    description: "Innovative inventors with an unquenchable thirst for knowledge.",
    color: "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700",
    gradient: "from-blue-500 to-cyan-600",
    figure: "🧠",
    traits: ["Logical", "Creative", "Curious"],
  },
  {
    type: "ENTJ",
    name: "The Commander",
    description: "Bold, imaginative and strong-willed leaders.",
    color: "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-700",
    gradient: "from-red-500 to-orange-600",
    figure: "👑",
    traits: ["Leadership", "Confident", "Strategic"],
  },
  {
    type: "ENTP",
    name: "The Debater",
    description: "Smart and curious thinkers who cannot resist an intellectual challenge.",
    color:
      "bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-700",
    gradient: "from-orange-500 to-yellow-600",
    figure: "💡",
    traits: ["Innovative", "Energetic", "Clever"],
  },
  {
    type: "INFJ",
    name: "The Advocate",
    description: "Creative and insightful, inspired and independent.",
    color:
      "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-700",
    gradient: "from-green-500 to-emerald-600",
    figure: "🌱",
    traits: ["Insightful", "Creative", "Inspiring"],
  },
  {
    type: "INFP",
    name: "The Mediator",
    description: "Poetic, kind and altruistic people, always eager to help.",
    color: "bg-teal-100 text-teal-800 border-teal-200 dark:bg-teal-900/30 dark:text-teal-300 dark:border-teal-700",
    gradient: "from-teal-500 to-green-600",
    figure: "🕊️",
    traits: ["Idealistic", "Loyal", "Adaptable"],
  },
  {
    type: "ENFJ",
    name: "The Protagonist",
    description: "Charismatic and inspiring leaders, able to mesmerize listeners.",
    color: "bg-pink-100 text-pink-800 border-pink-200 dark:bg-pink-900/30 dark:text-pink-300 dark:border-pink-700",
    gradient: "from-pink-500 to-rose-600",
    figure: "✨",
    traits: ["Charismatic", "Altruistic", "Natural Leader"],
  },
  {
    type: "ENFP",
    name: "The Campaigner",
    description: "Enthusiastic, creative and sociable free spirits.",
    color:
      "bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-700",
    gradient: "from-yellow-500 to-orange-600",
    figure: "🎭",
    traits: ["Enthusiastic", "Creative", "Sociable"],
  },
  {
    type: "ISTJ",
    name: "The Logistician",
    description: "Practical and fact-minded, reliable and responsible.",
    color: "bg-muted text-foreground border-border",
    gradient: "from-gray-500 to-slate-600",
    figure: "📋",
    traits: ["Reliable", "Practical", "Fact-minded"],
  },
  {
    type: "ISFJ",
    name: "The Protector",
    description: "Warm-hearted and dedicated, always ready to protect loved ones.",
    color:
      "bg-indigo-100 text-indigo-800 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-300 dark:border-indigo-700",
    gradient: "from-indigo-500 to-purple-600",
    figure: "🛡️",
    traits: ["Warm-hearted", "Dedicated", "Responsible"],
  },
  {
    type: "ESTJ",
    name: "The Executive",
    description: "Excellent administrators, unsurpassed at managing things or people.",
    color:
      "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-700",
    gradient: "from-emerald-500 to-green-600",
    figure: "💼",
    traits: ["Organized", "Traditional", "Leader"],
  },
  {
    type: "ESFJ",
    name: "The Consul",
    description: "Extraordinarily caring, social and popular people.",
    color: "bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-900/30 dark:text-rose-300 dark:border-rose-700",
    gradient: "from-rose-500 to-pink-600",
    figure: "🤝",
    traits: ["Caring", "Social", "Popular"],
  },
  {
    type: "ISTP",
    name: "The Virtuoso",
    description: "Bold and practical experimenters, masters of all kinds of tools.",
    color:
      "bg-slate-100 text-slate-800 border-slate-200 dark:bg-slate-700/30 dark:text-slate-300 dark:border-slate-600",
    gradient: "from-slate-500 to-gray-600",
    figure: "🔧",
    traits: ["Bold", "Practical", "Experimental"],
  },
  {
    type: "ISFP",
    name: "The Adventurer",
    description: "Flexible and charming artists, always ready to explore new possibilities.",
    color: "bg-cyan-100 text-cyan-800 border-cyan-200 dark:bg-cyan-900/30 dark:text-cyan-300 dark:border-cyan-700",
    gradient: "from-cyan-500 to-blue-600",
    figure: "🎨",
    traits: ["Flexible", "Charming", "Artistic"],
  },
  {
    type: "ESTP",
    name: "The Entrepreneur",
    description: "Smart, energetic and perceptive people, truly enjoy living on the edge.",
    color:
      "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-700",
    gradient: "from-amber-500 to-orange-600",
    figure: "🚀",
    traits: ["Smart", "Energetic", "Perceptive"],
  },
  {
    type: "ESFP",
    name: "The Entertainer",
    description: "Spontaneous, energetic and enthusiastic people - life is never boring.",
    color: "bg-lime-100 text-lime-800 border-lime-200 dark:bg-lime-900/30 dark:text-lime-300 dark:border-lime-700",
    gradient: "from-lime-500 to-green-600",
    figure: "🎪",
    traits: ["Spontaneous", "Energetic", "Enthusiastic"],
  },
]

export function MBTISelector({ value, onChange, disabled }: MBTISelectorProps) {
  const selectedType = mbtiTypes.find((type) => type.type === value)

  return (
    <div className="space-y-6">
      {selectedType && (
        <Card className={cn("border-2 relative overflow-hidden", selectedType.color)}>
          <div className={cn("absolute inset-0 bg-gradient-to-br opacity-5", selectedType.gradient)}></div>
          <CardHeader className="pb-4 relative z-10">
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div
                  className={cn(
                    "w-12 h-12 rounded-full bg-gradient-to-r flex items-center justify-center text-2xl shadow-lg",
                    selectedType.gradient,
                  )}
                >
                  {selectedType.figure}
                </div>
                <div>
                  <div className="text-2xl font-bold">{selectedType.type}</div>
                  <div className="text-sm opacity-80">{selectedType.name}</div>
                </div>
              </div>
              <Badge className={cn("animate-pulse", selectedType.color)}>Selected</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="relative z-10 space-y-4">
            <p className="text-sm leading-relaxed">{selectedType.description}</p>
            <div className="flex flex-wrap gap-2">
              {selectedType.traits.map((trait, index) => (
                <Badge
                  key={index}
                  variant="secondary"
                  className={cn("text-xs", selectedType.color)}
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  {trait}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {mbtiTypes.map((type) => (
          <Button
            key={type.type}
            variant={value === type.type ? "default" : "outline"}
            className={cn(
              "h-auto p-4 flex flex-col items-center space-y-2 transition-all duration-300 hover:scale-105 hover:shadow-lg relative overflow-hidden group",
              value === type.type && "ring-2 ring-offset-2 ring-blue-500 shadow-xl",
              value === type.type && `bg-gradient-to-r ${type.gradient} text-white hover:opacity-90`,
            )}
            onClick={() => !disabled && onChange(type.type)}
            disabled={disabled}
          >
            <div className="text-3xl mb-1 group-hover:animate-bounce">{type.figure}</div>
            <span className="font-bold text-lg">{type.type}</span>
            <span className="text-xs text-center leading-tight opacity-80">{type.name}</span>
            {value === type.type && <div className="absolute inset-0 bg-white/20 animate-pulse"></div>}
          </Button>
        ))}
      </div>
    </div>
  )
}
