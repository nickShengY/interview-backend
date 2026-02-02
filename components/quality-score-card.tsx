"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Award, TrendingUp, Target, CheckCircle2, Star, Sparkles } from "lucide-react"

interface QualityScoreCardProps {
  qualityIndicators: {
    action_verbs_bonus?: number
    quantifiable_results_bonus?: number
    certifications_found?: string[]
    certifications_bonus?: number
  }
}

export function QualityScoreCard({ qualityIndicators }: QualityScoreCardProps) {
  const totalBonus = 
    (qualityIndicators.action_verbs_bonus || 0) +
    (qualityIndicators.quantifiable_results_bonus || 0) +
    (qualityIndicators.certifications_bonus || 0)

  const hasAnyBonus = totalBonus > 0
  const maxBonus = 30 // Approximate max bonus
  const bonusPercentage = Math.min((totalBonus / maxBonus) * 100, 100)

  return (
    <Card className="border-0 shadow-lg overflow-hidden bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 dark:from-amber-900/20 dark:via-orange-900/20 dark:to-yellow-900/20">
      {/* Decorative background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-gradient-to-br from-amber-400/20 to-orange-400/20 rounded-full blur-2xl"></div>
        <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-gradient-to-br from-orange-400/20 to-yellow-400/20 rounded-full blur-2xl"></div>
      </div>

      <CardHeader className="relative z-10 border-b border-amber-100 dark:border-amber-900/30 bg-background/60 backdrop-blur">
        <CardTitle className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 flex items-center justify-center shadow-lg">
            <Award className="w-4 h-4 text-white" />
          </div>
          <span className="bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent font-bold">
            Quality Score Breakdown
          </span>
        </CardTitle>
        <CardDescription>Bonus points earned for resume quality indicators</CardDescription>
      </CardHeader>

      <CardContent className="relative z-10 p-6 space-y-6">
        {/* Total Bonus - Hero Display */}
        <div className="relative p-6 rounded-2xl bg-card/60 dark:bg-card/40 backdrop-blur border border-amber-200/50 dark:border-amber-700/50 shadow-lg">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground font-medium">Total Bonus Points</p>
              <div className="flex items-baseline gap-2">
                <span className="text-5xl font-bold bg-gradient-to-r from-amber-500 to-orange-500 bg-clip-text text-transparent">
                  +{totalBonus}
                </span>
                <span className="text-lg text-muted-foreground">pts</span>
              </div>
              <p className="text-xs text-muted-foreground">Added to your traditional ATS score</p>
            </div>
            
            {/* Circular indicator */}
            <div className="relative">
              <svg className="w-20 h-20 transform -rotate-90">
                <circle
                  className="text-amber-100 dark:text-amber-900/30"
                  strokeWidth="6"
                  stroke="currentColor"
                  fill="transparent"
                  r="34"
                  cx="40"
                  cy="40"
                />
                <circle
                  className="transition-all duration-1000 ease-out"
                  strokeWidth="6"
                  strokeDasharray={`${bonusPercentage * 2.14} 214`}
                  strokeLinecap="round"
                  stroke="url(#amberGradient)"
                  fill="transparent"
                  r="34"
                  cx="40"
                  cy="40"
                />
                <defs>
                  <linearGradient id="amberGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#f59e0b" />
                    <stop offset="100%" stopColor="#ea580c" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <Star className={`w-6 h-6 ${hasAnyBonus ? 'text-amber-500 fill-amber-500' : 'text-muted-foreground/40'}`} />
              </div>
            </div>
          </div>
        </div>

        {/* Individual Indicators */}
        <div className="grid gap-4">
          {/* Action Verbs */}
          <div className={`group p-4 rounded-xl border transition-all duration-300 hover:shadow-md ${
            (qualityIndicators.action_verbs_bonus || 0) > 0 
              ? 'bg-gradient-to-r from-emerald-50 to-green-50 border-emerald-200 dark:from-emerald-900/20 dark:to-green-900/20 dark:border-emerald-800/50' 
              : 'bg-background/50 dark:bg-background/30 border-border'
          }`}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  (qualityIndicators.action_verbs_bonus || 0) > 0 
                    ? 'bg-gradient-to-r from-emerald-500 to-green-500 shadow-lg' 
                    : 'bg-muted'
                }`}>
                  <TrendingUp className={`w-4 h-4 ${
                    (qualityIndicators.action_verbs_bonus || 0) > 0 ? 'text-white' : 'text-muted-foreground'
                  }`} />
                </div>
                <div>
                  <span className="font-semibold text-foreground">Action Verbs</span>
                  <p className="text-xs text-muted-foreground">
                    {(qualityIndicators.action_verbs_bonus || 0) > 0
                      ? `Found ${(qualityIndicators.action_verbs_bonus || 0) * 2} strong verbs`
                      : 'Add action verbs like achieved, led, implemented'}
                  </p>
                </div>
              </div>
              <Badge className={
                (qualityIndicators.action_verbs_bonus || 0) > 0
                  ? 'bg-gradient-to-r from-emerald-500 to-green-500 text-white border-0'
                  : 'bg-muted text-muted-foreground border-border'
              }>
                +{qualityIndicators.action_verbs_bonus || 0}
              </Badge>
            </div>
          </div>

          {/* Quantifiable Results */}
          <div className={`group p-4 rounded-xl border transition-all duration-300 hover:shadow-md ${
            (qualityIndicators.quantifiable_results_bonus || 0) > 0 
              ? 'bg-gradient-to-r from-blue-50 to-cyan-50 border-blue-200 dark:from-blue-900/20 dark:to-cyan-900/20 dark:border-blue-800/50' 
              : 'bg-background/50 dark:bg-background/30 border-border'
          }`}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  (qualityIndicators.quantifiable_results_bonus || 0) > 0 
                    ? 'bg-gradient-to-r from-blue-500 to-cyan-500 shadow-lg' 
                    : 'bg-muted'
                }`}>
                  <Target className={`w-4 h-4 ${
                    (qualityIndicators.quantifiable_results_bonus || 0) > 0 ? 'text-white' : 'text-muted-foreground'
                  }`} />
                </div>
                <div>
                  <span className="font-semibold text-foreground">Quantifiable Results</span>
                  <p className="text-xs text-muted-foreground">
                    {(qualityIndicators.quantifiable_results_bonus || 0) > 0
                      ? `Found ${(qualityIndicators.quantifiable_results_bonus || 0) * 3} metrics & numbers`
                      : 'Include percentages, dollar amounts, metrics'}
                  </p>
                </div>
              </div>
              <Badge className={
                (qualityIndicators.quantifiable_results_bonus || 0) > 0
                  ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white border-0'
                  : 'bg-muted text-muted-foreground border-border'
              }>
                +{qualityIndicators.quantifiable_results_bonus || 0}
              </Badge>
            </div>
          </div>

          {/* Certifications */}
          <div className={`group p-4 rounded-xl border transition-all duration-300 hover:shadow-md ${
            (qualityIndicators.certifications_found?.length || 0) > 0 
              ? 'bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200 dark:from-purple-900/20 dark:to-pink-900/20 dark:border-purple-800/50' 
              : 'bg-background/50 dark:bg-background/30 border-border'
          }`}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  (qualityIndicators.certifications_found?.length || 0) > 0 
                    ? 'bg-gradient-to-r from-purple-500 to-pink-500 shadow-lg' 
                    : 'bg-muted'
                }`}>
                  <CheckCircle2 className={`w-4 h-4 ${
                    (qualityIndicators.certifications_found?.length || 0) > 0 ? 'text-white' : 'text-muted-foreground'
                  }`} />
                </div>
                <div>
                  <span className="font-semibold text-foreground">Certifications</span>
                  <p className="text-xs text-muted-foreground">
                    {(qualityIndicators.certifications_found?.length || 0) > 0
                      ? 'Professional certifications detected'
                      : 'Add AWS, PMP, CISSP, or other certs'}
                  </p>
                </div>
              </div>
              <Badge className={
                (qualityIndicators.certifications_found?.length || 0) > 0
                  ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0'
                  : 'bg-muted text-muted-foreground border-border'
              }>
                +{qualityIndicators.certifications_bonus || 0}
              </Badge>
            </div>
            {(qualityIndicators.certifications_found?.length || 0) > 0 && (
              <div className="flex flex-wrap gap-2 mt-3 pl-11">
                {qualityIndicators.certifications_found?.map((cert, idx) => (
                  <Badge 
                    key={idx} 
                    variant="outline" 
                    className="bg-background/70 dark:bg-background/40 text-purple-700 dark:text-purple-300 border-purple-300 dark:border-purple-700"
                  >
                    <CheckCircle2 className="w-3 h-3 mr-1" />
                    {cert}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Tip for improvement */}
        {!hasAnyBonus && (
          <div className="flex items-start gap-3 p-4 rounded-xl bg-gradient-to-r from-amber-100 to-yellow-100 dark:from-amber-900/30 dark:to-yellow-900/30 border border-amber-200 dark:border-amber-800">
            <Sparkles className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-amber-800 dark:text-amber-200">
              <strong>Pro Tip:</strong> Enhance your resume with action verbs, quantifiable achievements, 
              and certifications to boost your ATS score significantly!
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
