"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { 
  Brain, 
  Target, 
  Flame, 
  TrendingUp, 
  Calendar,
  CheckCircle,
  Star
} from "lucide-react"

interface Flashcard {
  id: string
  difficulty: number
  repetitions: number
  nextReview: string
  lastReviewed?: string
  easeFactor: number
}

interface LearningAnalyticsProps {
  flashcards: Flashcard[]
  textbooksCount: number
  quizzesCompleted?: number
}

export function LearningAnalytics({ 
  flashcards, 
  textbooksCount,
  quizzesCompleted = 0 
}: LearningAnalyticsProps) {
  // Calculate stats
  const totalCards = flashcards.length
  const now = new Date()
  
  // Cards due today
  const dueToday = flashcards.filter(fc => new Date(fc.nextReview) <= now).length
  
  // Cards reviewed (has been reviewed at least once)
  const reviewed = flashcards.filter(fc => fc.repetitions > 0).length
  
  // Mastery levels based on repetitions and ease factor
  const mastered = flashcards.filter(fc => fc.repetitions >= 5 && fc.easeFactor >= 2.5).length
  const learning = flashcards.filter(fc => fc.repetitions > 0 && fc.repetitions < 5).length
  const newCards = flashcards.filter(fc => fc.repetitions === 0).length
  
  // Average ease factor (difficulty)
  const avgEaseFactor = flashcards.length > 0 
    ? flashcards.reduce((sum, fc) => sum + fc.easeFactor, 0) / flashcards.length 
    : 2.5
  
  // Retention rate estimate based on ease factors
  const retentionRate = Math.min(100, Math.round((avgEaseFactor / 2.5) * 85))
  
  const masteryPercentage = totalCards > 0 ? Math.round((mastered / totalCards) * 100) : 0

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-0 shadow-md bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                <Brain className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{totalCards}</p>
                <p className="text-xs text-muted-foreground">Total Flashcards</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center">
                <Calendar className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{dueToday}</p>
                <p className="text-xs text-muted-foreground">Due Today</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
                <Star className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{mastered}</p>
                <p className="text-xs text-muted-foreground">Mastered</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl flex items-center justify-center">
                <Flame className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{retentionRate}%</p>
                <p className="text-xs text-muted-foreground">Retention Rate</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Mastery Progress */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5 text-purple-500" />
            Mastery Progress
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Overall Progress Bar */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Overall Mastery</span>
              <span className="text-sm font-bold text-purple-600">{masteryPercentage}%</span>
            </div>
            <div className="h-4 bg-muted rounded-full overflow-hidden">
              <div className="h-full flex">
                <div 
                  className="bg-gradient-to-r from-green-500 to-emerald-500 transition-all duration-500"
                  style={{ width: `${(mastered / Math.max(totalCards, 1)) * 100}%` }}
                />
                <div 
                  className="bg-gradient-to-r from-blue-500 to-cyan-500 transition-all duration-500"
                  style={{ width: `${(learning / Math.max(totalCards, 1)) * 100}%` }}
                />
                <div 
                  className="bg-muted-foreground/30 transition-all duration-500"
                  style={{ width: `${(newCards / Math.max(totalCards, 1)) * 100}%` }}
                />
              </div>
            </div>
          </div>

          {/* Legend */}
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-gradient-to-r from-green-500 to-emerald-500" />
              <span className="text-muted-foreground">Mastered ({mastered})</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500" />
              <span className="text-muted-foreground">Learning ({learning})</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-muted-foreground/40" />
              <span className="text-muted-foreground">New ({newCards})</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Activity Summary */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-500" />
            Learning Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center p-4 rounded-xl bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20">
              <p className="text-3xl font-bold text-purple-600">{textbooksCount}</p>
              <p className="text-sm text-muted-foreground mt-1">Textbooks Uploaded</p>
            </div>
            <div className="text-center p-4 rounded-xl bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20">
              <p className="text-3xl font-bold text-blue-600">{reviewed}</p>
              <p className="text-sm text-muted-foreground mt-1">Cards Reviewed</p>
            </div>
            <div className="text-center p-4 rounded-xl bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20">
              <p className="text-3xl font-bold text-green-600">{quizzesCompleted}</p>
              <p className="text-sm text-muted-foreground mt-1">Quizzes Completed</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tips Card */}
      <Card className="border-0 shadow-lg bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/10 dark:to-orange-900/10">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl flex items-center justify-center flex-shrink-0">
              <CheckCircle className="w-5 h-5 text-white" />
            </div>
            <div>
              <h4 className="font-bold text-foreground mb-2">
                Optimize Your Learning
              </h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                {dueToday > 0 && (
                  <li className="flex items-center gap-2">
                    <span className="text-amber-500">•</span>
                    You have {dueToday} cards due for review today!
                  </li>
                )}
                {mastered < totalCards / 2 && (
                  <li className="flex items-center gap-2">
                    <span className="text-amber-500">•</span>
                    Keep reviewing daily to move more cards to mastery.
                  </li>
                )}
                <li className="flex items-center gap-2">
                  <span className="text-amber-500">•</span>
                  Short, frequent study sessions are more effective than long cramming.
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-amber-500">•</span>
                  Try the Feynman technique to deepen your understanding.
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
