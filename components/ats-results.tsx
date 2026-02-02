"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Target, Sparkles, AlertTriangle, CheckCircle, TrendingUp, Zap, ArrowUp, Lightbulb } from "lucide-react"

interface ATSResultsProps {
  results: {
    traditionalScore: number
    aiScore: number
    matchedKeywords: string[]
    missingKeywords: Array<{
      keyword: string
      importance: "High" | "Medium" | "Low"
      reason: string
    }>
    recommendations: string[]
  }
}

export function ATSResults({ results }: ATSResultsProps) {
  const getScoreTextColor = (score: number) => {
    if (score >= 80) return "text-emerald-600 dark:text-emerald-400"
    if (score >= 60) return "text-amber-600 dark:text-amber-400"
    return "text-rose-600 dark:text-rose-400"
  }

  const getScoreLabel = (score: number) => {
    if (score >= 80) return "Excellent"
    if (score >= 60) return "Good"
    if (score >= 40) return "Needs Work"
    return "Low"
  }

  const getImportanceBadge = (importance: string) => {
    switch (importance) {
      case "High":
        return "bg-gradient-to-r from-rose-500 to-pink-500 text-white border-0"
      case "Medium":
        return "bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0"
      case "Low":
        return "bg-gradient-to-r from-blue-500 to-cyan-500 text-white border-0"
      default:
        return "border-border bg-muted text-muted-foreground"
    }
  }

  // Calculate combined score for display
  const combinedScore = Math.round((results.traditionalScore + results.aiScore) / 2)

  return (
    <div className="space-y-6">
      {/* Main Score Card */}
      <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-blue-900/20 dark:via-purple-900/20 dark:to-pink-900/20 shadow-xl">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-20 -right-20 w-40 h-40 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-gradient-to-br from-purple-400/20 to-pink-400/20 rounded-full blur-3xl"></div>
        </div>
        
        <CardHeader className="relative z-10 pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-xl">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center shadow-lg">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent font-bold">
                ATS Compatibility Scores
              </span>
            </CardTitle>
            <Badge className="bg-gradient-to-r from-blue-500 to-purple-500 text-white border-0 text-sm px-3 py-1">
              Combined: {combinedScore}%
            </Badge>
          </div>
        </CardHeader>
        
        <CardContent className="relative z-10 pt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Traditional Score */}
            <div className="relative p-6 rounded-2xl bg-card/60 dark:bg-card/40 backdrop-blur border border-border/50 shadow-lg group hover:shadow-xl transition-all duration-300">
              <div className="flex items-start justify-between mb-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    <h3 className="font-semibold text-foreground">Traditional ATS</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">Keyword & format analysis</p>
                </div>
                <Badge variant="outline" className={`${getScoreTextColor(results.traditionalScore)} border-current`}>
                  {getScoreLabel(results.traditionalScore)}
                </Badge>
              </div>
              
              {/* Circular Progress */}
              <div className="flex items-center gap-6">
                <div className="relative">
                  <svg className="w-24 h-24 transform -rotate-90">
                    <circle
                      className="text-muted"
                      strokeWidth="8"
                      stroke="currentColor"
                      fill="transparent"
                      r="42"
                      cx="48"
                      cy="48"
                    />
                    <circle
                      className="transition-all duration-1000 ease-out"
                      strokeWidth="8"
                      strokeDasharray={`${results.traditionalScore * 2.64} 264`}
                      strokeLinecap="round"
                      stroke="url(#blueGradient)"
                      fill="transparent"
                      r="42"
                      cx="48"
                      cy="48"
                    />
                    <defs>
                      <linearGradient id="blueGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#3b82f6" />
                        <stop offset="100%" stopColor="#8b5cf6" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className={`text-2xl font-bold ${getScoreTextColor(results.traditionalScore)}`}>
                      {results.traditionalScore}%
                    </span>
                  </div>
                </div>
                <div className="flex-1 space-y-2">
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className={`h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-1000`}
                      style={{ width: `${results.traditionalScore}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Based on TF-IDF keyword matching
                  </p>
                </div>
              </div>
            </div>

            {/* AI Score */}
            <div className="relative p-6 rounded-2xl bg-card/60 dark:bg-card/40 backdrop-blur border border-border/50 shadow-lg group hover:shadow-xl transition-all duration-300">
              <div className="flex items-start justify-between mb-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Zap className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                    <h3 className="font-semibold text-foreground">AI Semantic Score</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">Deep learning analysis</p>
                </div>
                <Badge variant="outline" className={`${getScoreTextColor(results.aiScore)} border-current`}>
                  {getScoreLabel(results.aiScore)}
                </Badge>
              </div>
              
              {/* Circular Progress */}
              <div className="flex items-center gap-6">
                <div className="relative">
                  <svg className="w-24 h-24 transform -rotate-90">
                    <circle
                      className="text-muted"
                      strokeWidth="8"
                      stroke="currentColor"
                      fill="transparent"
                      r="42"
                      cx="48"
                      cy="48"
                    />
                    <circle
                      className="transition-all duration-1000 ease-out"
                      strokeWidth="8"
                      strokeDasharray={`${results.aiScore * 2.64} 264`}
                      strokeLinecap="round"
                      stroke="url(#purpleGradient)"
                      fill="transparent"
                      r="42"
                      cx="48"
                      cy="48"
                    />
                    <defs>
                      <linearGradient id="purpleGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#8b5cf6" />
                        <stop offset="100%" stopColor="#ec4899" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className={`text-2xl font-bold ${getScoreTextColor(results.aiScore)}`}>
                      {results.aiScore}%
                    </span>
                  </div>
                </div>
                <div className="flex-1 space-y-2">
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className={`h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-1000`}
                      style={{ width: `${results.aiScore}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Powered by Google Gemini embeddings
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Keywords Analysis */}
      <Card className="border-0 shadow-lg bg-card/60 backdrop-blur overflow-hidden">
        <CardHeader className="border-b border-border bg-gradient-to-r from-muted/60 to-background">
          <CardTitle className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center">
              <Target className="w-4 h-4 text-white" />
            </div>
            <span>Keywords Analysis</span>
          </CardTitle>
          <CardDescription>Keywords found and missing in your resume</CardDescription>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          {/* Matched Keywords */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              <h4 className="font-semibold text-emerald-700 dark:text-emerald-300">
                Matched Keywords
              </h4>
              <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 ml-auto">
                {results.matchedKeywords.length} found
              </Badge>
            </div>
            <div className="flex flex-wrap gap-2 p-4 rounded-xl bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-900/10 dark:to-green-900/10 border border-emerald-100 dark:border-emerald-900/30">
              {results.matchedKeywords.length > 0 ? (
                results.matchedKeywords.map((keyword, index) => (
                  <Badge
                    key={index}
                    className="bg-background/70 dark:bg-background/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 shadow-sm hover:shadow-md transition-shadow cursor-default"
                  >
                    <CheckCircle className="w-3 h-3 mr-1" />
                    {keyword}
                  </Badge>
                ))
              ) : (
                <p className="text-sm text-muted-foreground italic">No matched keywords detected</p>
              )}
            </div>
          </div>

          <Separator />

          {/* Missing Keywords */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center">
                <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
              </div>
              <h4 className="font-semibold text-rose-700 dark:text-rose-300">
                Missing Keywords
              </h4>
              <Badge variant="secondary" className="bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300 ml-auto">
                {results.missingKeywords.length} to add
              </Badge>
            </div>
            <div className="grid gap-3">
              {results.missingKeywords.slice(0, 8).map((item, index) => (
                <div
                  key={index}
                  className="group p-4 rounded-xl bg-gradient-to-r from-muted/40 to-background border border-border hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-md transition-all duration-300"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <ArrowUp className="w-4 h-4 text-blue-500" />
                        <span className="font-medium text-foreground">{item.keyword}</span>
                      </div>
                      <p className="text-sm text-muted-foreground pl-6">{item.reason}</p>
                    </div>
                    <Badge className={getImportanceBadge(item.importance)}>
                      {item.importance}
                    </Badge>
                  </div>
                </div>
              ))}
              {results.missingKeywords.length > 8 && (
                <p className="text-sm text-muted-foreground text-center py-2">
                  +{results.missingKeywords.length - 8} more keywords to consider
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recommendations */}
      <Card className="border-0 shadow-lg overflow-hidden bg-gradient-to-br from-purple-50 via-pink-50 to-background dark:from-purple-900/20 dark:via-pink-900/20 dark:to-background/40">
        <CardHeader className="border-b border-purple-100 dark:border-purple-900/30 bg-background/60 backdrop-blur">
          <CardTitle className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center shadow-lg">
              <Lightbulb className="w-4 h-4 text-white" />
            </div>
            <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent font-bold">
              AI Recommendations
            </span>
          </CardTitle>
          <CardDescription>Personalized suggestions to improve your resume score</CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid gap-4">
            {results.recommendations.map((recommendation, index) => (
              <div
                key={index}
                className="group flex items-start gap-4 p-4 rounded-xl bg-background/70 dark:bg-background/40 border border-purple-100 dark:border-purple-900/30 hover:border-purple-300 dark:hover:border-purple-700 hover:shadow-lg transition-all duration-300"
              >
                <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg group-hover:scale-110 transition-transform duration-300">
                  {index + 1}
                </div>
                <div className="flex-1">
                  <p className="text-foreground/90 leading-relaxed">{recommendation}</p>
                </div>
                <Sparkles className="w-4 h-4 text-purple-400 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
