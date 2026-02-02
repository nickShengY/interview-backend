"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface ZodiacSelectorProps {
  value: string
  onChange: (value: string) => void
  disabled?: boolean
}

const zodiacSigns = [
  {
    sign: "Aries",
    symbol: "♈",
    dates: "Mar 21 - Apr 19",
    element: "Fire",
    traits: "Energetic, Ambitious, Leadership",
    color: "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-700",
    gradient: "from-red-500 to-orange-500",
    figure: "🐏",
    keywords: ["Bold", "Pioneering", "Dynamic"],
  },
  {
    sign: "Taurus",
    symbol: "♉",
    dates: "Apr 20 - May 20",
    element: "Earth",
    traits: "Reliable, Patient, Practical",
    color:
      "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-700",
    gradient: "from-green-500 to-emerald-500",
    figure: "🐂",
    keywords: ["Stable", "Determined", "Sensual"],
  },
  {
    sign: "Gemini",
    symbol: "♊",
    dates: "May 21 - Jun 20",
    element: "Air",
    traits: "Adaptable, Curious, Communicative",
    color:
      "bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-700",
    gradient: "from-yellow-500 to-orange-500",
    figure: "👯",
    keywords: ["Versatile", "Witty", "Social"],
  },
  {
    sign: "Cancer",
    symbol: "♋",
    dates: "Jun 21 - Jul 22",
    element: "Water",
    traits: "Intuitive, Emotional, Protective",
    color: "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700",
    gradient: "from-blue-500 to-cyan-500",
    figure: "🦀",
    keywords: ["Nurturing", "Intuitive", "Loyal"],
  },
  {
    sign: "Leo",
    symbol: "♌",
    dates: "Jul 23 - Aug 22",
    element: "Fire",
    traits: "Confident, Generous, Creative",
    color:
      "bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-700",
    gradient: "from-orange-500 to-yellow-500",
    figure: "🦁",
    keywords: ["Confident", "Generous", "Dramatic"],
  },
  {
    sign: "Virgo",
    symbol: "♍",
    dates: "Aug 23 - Sep 22",
    element: "Earth",
    traits: "Analytical, Perfectionist, Helpful",
    color:
      "bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-700",
    gradient: "from-purple-500 to-indigo-500",
    figure: "👩‍🌾",
    keywords: ["Analytical", "Practical", "Kind"],
  },
  {
    sign: "Libra",
    symbol: "♎",
    dates: "Sep 23 - Oct 22",
    element: "Air",
    traits: "Diplomatic, Fair-minded, Social",
    color: "bg-pink-100 text-pink-800 border-pink-200 dark:bg-pink-900/30 dark:text-pink-300 dark:border-pink-700",
    gradient: "from-pink-500 to-rose-500",
    figure: "⚖️",
    keywords: ["Diplomatic", "Gracious", "Fair-minded"],
  },
  {
    sign: "Scorpio",
    symbol: "♏",
    dates: "Oct 23 - Nov 21",
    element: "Water",
    traits: "Passionate, Resourceful, Brave",
    color:
      "bg-indigo-100 text-indigo-800 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-300 dark:border-indigo-700",
    gradient: "from-indigo-500 to-purple-500",
    figure: "🦂",
    keywords: ["Passionate", "Resourceful", "Brave"],
  },
  {
    sign: "Sagittarius",
    symbol: "♐",
    dates: "Nov 22 - Dec 21",
    element: "Fire",
    traits: "Optimistic, Freedom-loving, Honest",
    color: "bg-teal-100 text-teal-800 border-teal-200 dark:bg-teal-900/30 dark:text-teal-300 dark:border-teal-700",
    gradient: "from-teal-500 to-blue-500",
    figure: "🏹",
    keywords: ["Optimistic", "Adventurous", "Philosophical"],
  },
  {
    sign: "Capricorn",
    symbol: "♑",
    dates: "Dec 22 - Jan 19",
    element: "Earth",
    traits: "Responsible, Disciplined, Self-control",
    color: "bg-muted text-foreground border-border",
    gradient: "from-gray-500 to-slate-500",
    figure: "🐐",
    keywords: ["Responsible", "Disciplined", "Traditional"],
  },
  {
    sign: "Aquarius",
    symbol: "♒",
    dates: "Jan 20 - Feb 18",
    element: "Air",
    traits: "Progressive, Original, Independent",
    color: "bg-cyan-100 text-cyan-800 border-cyan-200 dark:bg-cyan-900/30 dark:text-cyan-300 dark:border-cyan-700",
    gradient: "from-cyan-500 to-blue-500",
    figure: "🏺",
    keywords: ["Progressive", "Original", "Humanitarian"],
  },
  {
    sign: "Pisces",
    symbol: "♓",
    dates: "Feb 19 - Mar 20",
    element: "Water",
    traits: "Compassionate, Artistic, Intuitive",
    color:
      "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-700",
    gradient: "from-emerald-500 to-teal-500",
    figure: "🐟",
    keywords: ["Compassionate", "Artistic", "Intuitive"],
  },
]

export function ZodiacSelector({ value, onChange, disabled }: ZodiacSelectorProps) {
  const selectedSign = zodiacSigns.find((sign) => sign.sign === value)

  return (
    <div className="space-y-6">
      {selectedSign && (
        <Card className={cn("border-2 relative overflow-hidden", selectedSign.color)}>
          <div className={cn("absolute inset-0 bg-gradient-to-br opacity-5", selectedSign.gradient)}></div>
          <CardHeader className="pb-4 relative z-10">
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div
                  className={cn(
                    "w-12 h-12 rounded-full bg-gradient-to-r flex items-center justify-center text-2xl shadow-lg",
                    selectedSign.gradient,
                  )}
                >
                  {selectedSign.figure}
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-2xl font-bold">{selectedSign.sign}</span>
                    <span className="text-2xl opacity-70">{selectedSign.symbol}</span>
                  </div>
                  <div className="text-sm opacity-80">{selectedSign.dates}</div>
                </div>
              </div>
              <Badge className={cn("animate-pulse", selectedSign.color)}>Selected</Badge>
            </CardTitle>
            <CardDescription className="relative z-10">
              <Badge variant="outline" className="mr-2">
                {selectedSign.element} Element
              </Badge>
            </CardDescription>
          </CardHeader>
          <CardContent className="relative z-10 space-y-4">
            <p className="text-sm leading-relaxed">{selectedSign.traits}</p>
            <div className="flex flex-wrap gap-2">
              {selectedSign.keywords.map((keyword, index) => (
                <Badge
                  key={index}
                  variant="secondary"
                  className={cn("text-xs animate-pulse", selectedSign.color)}
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  {keyword}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-3 md:grid-cols-4 gap-4">
        {zodiacSigns.map((sign) => (
          <Button
            key={sign.sign}
            variant={value === sign.sign ? "default" : "outline"}
            className={cn(
              "h-auto p-4 flex flex-col items-center space-y-2 transition-all duration-300 hover:scale-105 hover:shadow-lg relative overflow-hidden group",
              value === sign.sign && "ring-2 ring-offset-2 ring-purple-500 shadow-xl",
              value === sign.sign && `bg-gradient-to-r ${sign.gradient} text-white hover:opacity-90`,
            )}
            onClick={() => !disabled && onChange(sign.sign)}
            disabled={disabled}
          >
            <div className="text-3xl mb-1 group-hover:animate-bounce">{sign.figure}</div>
            <div className="flex items-center space-x-1">
              <span className="text-2xl opacity-70">{sign.symbol}</span>
            </div>
            <span className="text-sm font-bold">{sign.sign}</span>
            <span className="text-xs text-center leading-tight opacity-70">{sign.dates}</span>
            {value === sign.sign && <div className="absolute inset-0 bg-white/20 animate-pulse"></div>}
          </Button>
        ))}
      </div>
    </div>
  )
}
