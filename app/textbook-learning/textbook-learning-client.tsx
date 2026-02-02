"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Book, Upload, Brain, Zap, Target, Clock, TrendingUp, Star, Sparkles, Play, BookOpen, Info } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { authFetch } from "@/lib/auth-fetch"
import { QuizPlayer } from "@/components/quiz-player"
import { LearningAnalytics } from "@/components/learning-analytics"
import { LocalFlashcardViewer } from "@/components/local-flashcard-viewer"
import { LocalFeynmanPractice } from "@/components/local-feynman-practice"
import { PageHeader } from "@/components/page-header"
import { 
  loadLocalSessions, 
  upsertLocalSession, 
  type LocalTextbookSession, 
  type LocalFlashcard,
  type LocalQuizQuestion,
} from "@/lib/textbook/local-storage"

type QuizQuestionWithOrder = LocalQuizQuestion & { orderIndex: number }
type Quiz = {
  id: string
  title: string
  totalQuestions: number
  questions: QuizQuestionWithOrder[]
}

function getEstimatedCounts(totalPages: number) {
  const pageGroups = Math.max(1, Math.round(totalPages / 20))
  const minCards = 20 * pageGroups
  const maxCards = 30 * pageGroups
  const minQuestions = 8 * pageGroups
  const maxQuestions = 12 * pageGroups
  return { minCards, maxCards, minQuestions, maxQuestions }
}

function estimatePagesFromFileSize(bytes: number) {
  // Very rough heuristic: assume ~50KB of PDF per page, clamped to a reasonable range
  const approx = Math.round(bytes / 50000)
  return Math.max(5, Math.min(approx || 1, 1000))
}

export default function TextbookLearningPage() {
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState("upload")
  const [textbooks, setTextbooks] = useState<LocalTextbookSession[]>([])
  const [loading, setLoading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadEstimate, setUploadEstimate] = useState<{
    pages: number
    minCards: number
    maxCards: number
    minQuestions: number
    maxQuestions: number
  } | null>(null)
  const [flashcards, setFlashcards] = useState<LocalFlashcard[]>([])
  const [activeQuiz, setActiveQuiz] = useState<Quiz | null>(null)
  const [studyMode, setStudyMode] = useState<'none' | 'flashcards' | 'quiz' | 'feynman'>('none')
  const [selectedTextbook, setSelectedTextbook] = useState<LocalTextbookSession | null>(null)
  const [activeCardBatchIndex, setActiveCardBatchIndex] = useState(0)

  // Load locally stored sessions on mount
  useEffect(() => {
    if (typeof window === 'undefined') return
    const sessions = loadLocalSessions()
    setTextbooks(sessions)
    const allCards: LocalFlashcard[] = sessions.flatMap((s) =>
      (s.cardBatches || []).flat()
    )
    setFlashcards(allCards)
  }, [])

  // Warn user before leaving/refreshing while a textbook is being processed
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!loading) return

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault()
      event.returnValue = ''
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [loading])

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const approxPages = estimatePagesFromFileSize(file.size)
    const estimate = getEstimatedCounts(approxPages)
    setUploadEstimate({
      pages: approxPages,
      ...estimate,
    })

    setLoading(true)
    setUploadProgress(5)

    let interval: number | undefined
    if (typeof window !== 'undefined') {
      let current = 5
      interval = window.setInterval(() => {
        // Slow, slightly random progress towards ~95%
        const increment = Math.max(1, Math.floor(Math.random() * 4)) // 1–3%
        current = Math.min(current + increment, 95)
        setUploadProgress(current)
      }, 2800)
    }
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('title', file.name.replace(/\.[^/.]+$/, ''))

      // Use local-generate endpoint: no textbook content is persisted server-side
      const res = await authFetch('/api/textbook/local-generate', {
        method: 'POST',
        body: formData,
        dedupeKey: `credits:/api/textbook/local-generate:${file.name}:${file.size}:${file.lastModified}`,
      })

      if (!res.ok) {
        // Try to surface server error message for better UX/debugging
        try {
          const err = await res.json()
          const msg = typeof err?.error === 'string' ? err.error : 'Upload failed'
          throw new Error(msg)
        } catch {
          throw new Error('Upload failed')
        }
      }

      const data = await res.json()
      const session = data.session as LocalTextbookSession

      // Persist session locally (cards + quizzes only)
      upsertLocalSession(session)

      // Update in-memory state
      const nextSessions = (() => {
        const without = textbooks.filter((s) => s.id !== session.id)
        return [...without, session]
      })()
      setTextbooks(nextSessions)
      const allCards: LocalFlashcard[] = nextSessions.flatMap((s) =>
        (s.cardBatches || []).flat()
      )
      setFlashcards(allCards)

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('credits:update'))
      }

      toast({
        title: 'Textbook Processed!',
        description: `Generated ${session.totalCards} flashcards and ${session.totalQuestions} quiz questions for "${session.title}".`,
      })
    } catch (error) {
      toast({
        title: 'Upload Failed',
        description: error instanceof Error ? error.message : 'Failed to upload textbook. Please try again.',
        variant: 'destructive',
      })
    } finally {
      if (typeof window !== 'undefined' && typeof interval !== 'undefined') {
        window.clearInterval(interval)
      }
      setUploadProgress(100)
      setLoading(false)
      setUploadEstimate(null)
      // Reset input
      e.target.value = ''
    }
  }

  const handleGenerateFlashcards = async (textbookId: string) => {
    // In local mode, flashcards are generated at upload time.
    const session = textbooks.find((t) => t.id === textbookId)
    if (!session || !session.cardBatches?.length) {
      toast({
        title: 'No Flashcards Yet',
        description: 'Upload this textbook first to generate flashcards.',
        variant: 'destructive',
      })
      return
    }

    setSelectedTextbook(session)
    setActiveCardBatchIndex(0)
    setStudyMode('flashcards')
    setActiveTab('flashcards')
  }

  const handleGenerateQuiz = async (textbookId: string) => {
    const session = textbooks.find((t) => t.id === textbookId)
    if (!session || !session.quizBatches?.length) {
      toast({
        title: 'No Quiz Available',
        description: 'Upload this textbook first so we can generate quiz questions.',
        variant: 'destructive',
      })
      return
    }

    const batchIndex = 0
    const batch = session.quizBatches[batchIndex] || []
    const quiz = {
      id: `${session.id}-quiz-${batchIndex}`,
      title: `${session.title} — Quiz ${batchIndex + 1}/${session.quizBatches.length}`,
      totalQuestions: batch.length,
      questions: batch.map((q, idx) => ({ ...q, orderIndex: idx })),
    }

    setSelectedTextbook(session)
    setActiveQuiz(quiz)
    setStudyMode('quiz')
    setActiveTab('quizzes')
  }

  // Lightweight analytics mapping: treat each local card as "new" with default spaced-repetition fields
  const analyticsFlashcards = flashcards.map((fc) => ({
    id: fc.id,
    difficulty: 0,
    repetitions: 0,
    nextReview: new Date().toISOString(),
    easeFactor: 2.5,
  }))

  return (
    <TooltipProvider>
      <div className="max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <PageHeader
        title="AI-Powered Textbook Learning"
        description={
          <>
            Master any textbook 10x faster with cutting-edge learning techniques:
            <strong> Spaced Repetition, Active Recall, Feynman Technique & AI-Generated Practice</strong>
          </>
        }
        titleClassName="bg-gradient-to-r from-purple-600 via-pink-600 to-orange-600 bg-clip-text text-transparent"
      />

      {/* Learning Method Cards */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card className="border-2 border-purple-200 dark:border-purple-800 hover:shadow-lg transition-all">
          <CardContent className="pt-6 text-center space-y-3">
            <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <h3 className="font-bold text-purple-900 dark:text-purple-100">Spaced Repetition</h3>
            <p className="text-sm text-muted-foreground">
              Review at optimal intervals (Ebbinghaus curve)
            </p>
          </CardContent>
        </Card>

        <Card className="border-2 border-pink-200 dark:border-pink-800 hover:shadow-lg transition-all">
          <CardContent className="pt-6 text-center space-y-3">
            <div className="w-12 h-12 bg-gradient-to-r from-pink-500 to-red-500 rounded-full flex items-center justify-center mx-auto">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <h3 className="font-bold text-pink-900 dark:text-pink-100">Active Recall</h3>
            <p className="text-sm text-muted-foreground">
              Test yourself instead of passive reading
            </p>
          </CardContent>
        </Card>

        <Card className="border-2 border-orange-200 dark:border-orange-800 hover:shadow-lg transition-all">
          <CardContent className="pt-6 text-center space-y-3">
            <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-yellow-500 rounded-full flex items-center justify-center mx-auto">
              <Target className="w-6 h-6 text-white" />
            </div>
            <h3 className="font-bold text-orange-900 dark:text-orange-100">Feynman Technique</h3>
            <p className="text-sm text-muted-foreground">
              Explain concepts in simple terms
            </p>
          </CardContent>
        </Card>

        <Card className="border-2 border-blue-200 dark:border-blue-800 hover:shadow-lg transition-all">
          <CardContent className="pt-6 text-center space-y-3">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center mx-auto">
              <Clock className="w-6 h-6 text-white" />
            </div>
            <h3 className="font-bold text-blue-900 dark:text-blue-100">Pomodoro Method</h3>
            <p className="text-sm text-muted-foreground">
              Focus in 25-minute intervals
            </p>
          </CardContent>
        </Card>
      </div>

      {/* How It Works */}
      <Alert className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border-purple-200 dark:border-purple-800">
        <Sparkles className="w-5 h-5 text-purple-600" />
        <AlertDescription className="ml-2 text-foreground/90">
          <strong>State-of-the-Art Learning System:</strong> Upload any textbook (PDF/DOCX) and our AI will:
          1) Extract and summarize key concepts, 2) Generate spaced repetition flashcards, 
          3) Create adaptive quizzes, 4) Track your progress with the SuperMemo SM-2 algorithm. 
          <strong className="text-purple-600"> 10x more effective than traditional studying!</strong>
        </AlertDescription>
      </Alert>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20">
          <TabsTrigger value="upload" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-pink-600 data-[state=active]:text-white">
            <Upload className="w-4 h-4 mr-2" />
            Upload
          </TabsTrigger>
          <TabsTrigger value="flashcards" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-pink-600 data-[state=active]:text-white">
            <Brain className="w-4 h-4 mr-2" />
            Flashcards
          </TabsTrigger>
          <TabsTrigger value="quizzes" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-pink-600 data-[state=active]:text-white">
            <Target className="w-4 h-4 mr-2" />
            Quizzes
          </TabsTrigger>
          <TabsTrigger value="feynman" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-pink-600 data-[state=active]:text-white">
            <Zap className="w-4 h-4 mr-2" />
            Feynman
          </TabsTrigger>
          <TabsTrigger value="progress" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-pink-600 data-[state=active]:text-white">
            <TrendingUp className="w-4 h-4 mr-2" />
            Progress
          </TabsTrigger>
        </TabsList>

        {/* Upload Tab */}
        <TabsContent value="upload">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Upload className="w-5 h-5 text-purple-600" />
                <span>Upload Textbook</span>
              </CardTitle>
              <CardDescription>
                Upload your textbook and let AI create a personalized learning plan
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Upload Component */}
              <div className="border-2 border-dashed border-purple-300 dark:border-purple-700 rounded-lg p-12 text-center hover:border-purple-500 transition-colors">
                <Book className="w-16 h-16 text-purple-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Drop your textbook here</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Supports PDF and TXT (up to 50MB)
                </p>
                <input
                  type="file"
                  id="textbook-upload"
                  className="hidden"
                  accept=".pdf,.txt"
                  onChange={handleFileUpload}
                />
                <Button 
                  onClick={() => document.getElementById('textbook-upload')?.click()}
                  disabled={loading}
                  variant="brand"
                  className="from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 dark:from-purple-500 dark:to-pink-500 dark:hover:from-purple-600 dark:hover:to-pink-600"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  {loading ? 'Uploading...' : 'Select File'}
                </Button>
              </div>

              {loading && (
                <div className="space-y-3 p-4 rounded-lg bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-700">
                  <div className="flex items-center gap-3">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-purple-600" />
                    <div className="text-sm text-foreground/90">
                      We are processing your textbook with AI. This can take up to a minute for large PDFs.
                      Please keep this tab open and avoid refreshing until it&apos;s done.
                    </div>
                  </div>
                  {/* Phase + percentage */}
                  <div className="flex items-center justify-between text-xs text-emerald-800 dark:text-emerald-300 mt-1">
                    <span className="font-medium">
                      {uploadProgress < 20 && 'Phase 1/4 · Extracting text'}
                      {uploadProgress >= 20 && uploadProgress < 45 && 'Phase 2/4 · Analyzing structure'}
                      {uploadProgress >= 45 && uploadProgress < 80 && 'Phase 3/4 · Generating flashcards'}
                      {uploadProgress >= 80 && uploadProgress < 99 && 'Phase 4/4 · Generating quizzes & assembling plan'}
                      {uploadProgress >= 99 && 'Finishing up...'}
                    </span>
                    <div className="flex items-center gap-2">
                      <span>{Math.round(uploadProgress)}%</span>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            type="button"
                            className="inline-flex items-center gap-1 rounded-full border border-emerald-400/60 bg-emerald-50/70 px-2 py-0.5 text-[11px] font-medium text-emerald-800 hover:bg-emerald-100 dark:bg-emerald-900/40 dark:border-emerald-700 dark:text-emerald-100"
                          >
                            <Info className="w-3 h-3" />
                            <span>details</span>
                          </button>
                        </TooltipTrigger>
                        <TooltipContent side="left" className="max-w-xs text-xs leading-snug">
                          <p className="font-semibold mb-1">Upload phases</p>
                          <p>
                            <span className="font-medium">Phase 1 – Extracting text:</span>{' '}
                            We send your file to a Python backend to pull clean text and estimate page count.
                          </p>
                          <p className="mt-1">
                            <span className="font-medium">Phase 2 – Analyzing structure:</span>{' '}
                            Gemini finds chapters, sections, and key ideas.
                          </p>
                          <p className="mt-1">
                            <span className="font-medium">Phase 3 – Generating flashcards:</span>{' '}
                            AI turns the core concepts into question–answer flashcards.
                          </p>
                          <p className="mt-1">
                            <span className="font-medium">Phase 4 – Quizzes & plan:</span>{' '}
                            AI writes multiple-choice questions and groups everything into study batches.
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  </div>
                  <Progress
                    value={uploadProgress}
                    className="w-full h-3 bg-emerald-950/40 border border-emerald-600/40 shadow-inner"
                    indicatorClassName="bg-emerald-500 dark:bg-emerald-400 shadow-[0_0_14px_rgba(16,185,129,0.8)] rounded-full"
                  />
                  {uploadEstimate && (
                    <p className="text-[11px] text-emerald-900/80 dark:text-emerald-100/80 mt-1">
                      Early estimate based on file size: ~
                      {uploadEstimate.minCards}–{uploadEstimate.maxCards} cards and ~
                      {uploadEstimate.minQuestions}–{uploadEstimate.maxQuestions} quiz questions
                      for about {uploadEstimate.pages} pages. Final counts may vary.
                    </p>
                  )}
                </div>
              )}

              {/* Credit Cost */}
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold text-yellow-900 dark:text-yellow-100">Credit Cost</h4>
                    <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                      Textbook learning uses advanced AI processing
                    </p>
                  </div>
                  <div className="text-right">
                    <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 text-lg px-4 py-2">
                      <Star className="w-4 h-4 mr-1" />
                      10 Credits
                    </Badge>
                    <p className="text-xs text-muted-foreground mt-1">per textbook</p>
                  </div>
                </div>
              </div>

              {/* Recent Textbooks */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Your Textbooks</h3>
                {textbooks.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    No textbooks uploaded yet. Upload your first one to get started!
                  </p>
                ) : (
                  <div className="grid md:grid-cols-2 gap-4">
                    {textbooks.map((book) => {
                      const estimate = getEstimatedCounts(book.totalPages || 1)
                      return (
                        <Card key={book.id} className="hover:shadow-lg transition-all">
                          <CardContent className="pt-6 space-y-4">
                            <div className="flex items-start space-x-4">
                              <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center flex-shrink-0">
                                <Book className="w-6 h-6 text-white" />
                              </div>
                              <div className="flex-1">
                                <h4 className="font-semibold">{book.title}</h4>
                                <p className="text-sm text-muted-foreground mt-1">
                                  {book.totalPages} pages • {book.totalCards} flashcards • {book.totalQuestions} questions
                                </p>
                                <p className="text-xs text-muted-foreground/80 mt-1">
                                  Based on {book.totalPages || 1} pages, we typically generate ~
                                  {estimate.minCards}–{estimate.maxCards} cards and ~
                                  {estimate.minQuestions}–{estimate.maxQuestions} quiz questions.
                                </p>
                                <div className="flex items-center space-x-2 mt-2">
                                  <Badge variant="secondary">
                                    {book.cardBatches?.length || 0} card batches
                                  </Badge>
                                  <Badge variant="outline">
                                    {book.quizBatches?.length || 0} quizzes
                                  </Badge>
                                </div>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                className="flex-1"
                                onClick={() => handleGenerateFlashcards(book.id)}
                                disabled={loading}
                              >
                                <Brain className="w-4 h-4 mr-1" />
                                Flashcards
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="flex-1"
                                onClick={() => handleGenerateQuiz(book.id)}
                                disabled={loading}
                              >
                                <Target className="w-4 h-4 mr-1" />
                                Quiz
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      )
                    })}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Flashcards Tab */}
        <TabsContent value="flashcards">
          {studyMode === 'flashcards' && selectedTextbook && selectedTextbook.cardBatches?.length ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold">Study Session</h2>
                  <p className="text-sm text-muted-foreground">
                    10-card batches for focused, high-impact review.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    Batch {activeCardBatchIndex + 1} / {selectedTextbook.cardBatches.length}
                  </Badge>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setStudyMode('none')
                      setSelectedTextbook(null)
                    }}
                  >
                    Exit Study Mode
                  </Button>
                </div>
              </div>

              <LocalFlashcardViewer
                cards={selectedTextbook.cardBatches[activeCardBatchIndex] || []}
                textbookTitle={selectedTextbook.title}
                batchIndex={activeCardBatchIndex}
                totalBatches={selectedTextbook.cardBatches.length}
                onExit={() => {
                  setStudyMode('none')
                  setSelectedTextbook(null)
                }}
                onNextBatch={() => {
                  setActiveCardBatchIndex((idx) =>
                    Math.min(idx + 1, selectedTextbook.cardBatches.length - 1),
                  )
                }}
                onPrevBatch={() => {
                  setActiveCardBatchIndex((idx) => Math.max(idx - 1, 0))
                }}
                onPracticeFeynman={() => {
                  setStudyMode('feynman')
                  setActiveTab('feynman')
                }}
              />
            </div>
          ) : (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Flashcard Batches</CardTitle>
                    <CardDescription>
                      Upload a textbook to generate AI flashcards, grouped into 10-card study batches.
                    </CardDescription>
                  </div>
                  {flashcards.length > 0 && (
                    <Button
                      onClick={() => {
                        if (textbooks.length === 0) return
                        const first = textbooks[0]
                        setSelectedTextbook(first)
                        setActiveCardBatchIndex(0)
                        setStudyMode('flashcards')
                      }}
                      variant="brand"
                      className="from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 dark:from-purple-500 dark:to-pink-500 dark:hover:from-purple-600 dark:hover:to-pink-600"
                    >
                      <Play className="w-4 h-4 mr-2" />
                      Start Study Session
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {flashcards.length === 0 ? (
                  <div className="text-center py-12">
                    <Brain className="w-16 h-16 text-purple-300 mx-auto mb-4" />
                    <p className="text-muted-foreground mb-4">
                      No flashcards yet. Upload a textbook to generate your first set.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Stats Summary */}
                    <div className="grid grid-cols-3 gap-4 mb-6">
                      <div className="text-center p-4 rounded-xl bg-purple-50 dark:bg-purple-900/20">
                        <p className="text-2xl font-bold text-purple-600">{flashcards.length}</p>
                        <p className="text-sm text-muted-foreground">Total Cards</p>
                      </div>
                      <div className="text-center p-4 rounded-xl bg-green-50 dark:bg-green-900/20">
                        <p className="text-2xl font-bold text-green-600">
                          {textbooks.length}
                        </p>
                        <p className="text-sm text-muted-foreground">Textbooks</p>
                      </div>
                      <div className="text-center p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20">
                        <p className="text-2xl font-bold text-blue-600">
                          {textbooks.reduce((sum, t) => sum + (t.cardBatches?.length || 0), 0)}
                        </p>
                        <p className="text-sm text-muted-foreground">10-Card Batches</p>
                      </div>
                    </div>

                    {/* Card Preview Grid */}
                    <div className="grid md:grid-cols-2 gap-4">
                      {flashcards.slice(0, 6).map((fc) => (
                        <Card key={fc.id} className="border hover:shadow-md transition-shadow">
                          <CardContent className="pt-4 space-y-2">
                            <div className="flex items-center justify-between">
                              <Badge variant="secondary" className="w-fit">{fc.category || 'General'}</Badge>
                            </div>
                            <div>
                              <div className="font-medium line-clamp-2">{fc.front}</div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                    {flashcards.length > 6 && (
                      <p className="text-center text-sm text-muted-foreground">
                        And {flashcards.length - 6} more cards...
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Quizzes Tab */}
        <TabsContent value="quizzes">
          {activeQuiz ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold">{activeQuiz.title}</h2>
                <Button variant="outline" onClick={() => setActiveQuiz(null)}>
                  Exit Quiz
                </Button>
              </div>
              <QuizPlayer 
                quiz={activeQuiz} 
                onComplete={(score) => {
                  toast({
                    title: "Quiz Complete!",
                    description: `You scored ${score}%`,
                  })
                }}
              />
            </div>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Adaptive Quizzes</CardTitle>
                <CardDescription>
                  Test your knowledge with AI-generated quizzes
                </CardDescription>
              </CardHeader>
              <CardContent>
                {textbooks.length === 0 ? (
                  <div className="text-center py-12">
                    <Target className="w-16 h-16 text-purple-300 mx-auto mb-4" />
                    <p className="text-muted-foreground">
                      Upload a textbook to generate practice quizzes
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground mb-4">
                      Select a textbook to generate and take a quiz
                    </p>
                    <div className="grid md:grid-cols-2 gap-4">
                      {textbooks.map((book) => (
                        <Card key={book.id} className="border hover:shadow-md transition-shadow">
                          <CardContent className="pt-4">
                            <div className="flex items-center gap-3 mb-3">
                              <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                                <BookOpen className="w-5 h-5 text-white" />
                              </div>
                              <div>
                                <h4 className="font-semibold">{book.title}</h4>
                                <p className="text-xs text-muted-foreground">{book.quizBatches?.length || 0} quizzes</p>
                              </div>
                            </div>
                            <Button
                              size="sm"
                              variant="brand"
                              className="w-full from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 dark:from-purple-500 dark:to-pink-500 dark:hover:from-purple-600 dark:hover:to-pink-600"
                              onClick={() => handleGenerateQuiz(book.id)}
                              disabled={loading}
                            >
                              <Target className="w-4 h-4 mr-2" />
                              Generate New Quiz
                            </Button>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Feynman Tab (local, AI-assisted) */}
        <TabsContent value="feynman">
          {textbooks.length === 0 ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-purple-500" />
                  Feynman Technique
                </CardTitle>
                <CardDescription>
                  Upload a textbook first to generate concepts and unlock AI-assisted Feynman coaching.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Once you have flashcards, we&apos;ll extract key concepts and let you explain them in your own words,
                  then an AI coach will highlight exactly what you understood, misunderstood, and missed.
                </p>
              </CardContent>
            </Card>
          ) : !selectedTextbook ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-purple-500" />
                  Choose a Textbook
                </CardTitle>
                <CardDescription>
                  Pick a textbook to practice explaining its key concepts using the Feynman Technique.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4">
                  {textbooks.map((book) => (
                    <Card
                      key={book.id}
                      className="border hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => {
                        setSelectedTextbook(book)
                        setStudyMode('feynman')
                      }}
                    >
                      <CardContent className="pt-4 space-y-2">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                            <Brain className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <h4 className="font-semibold">{book.title}</h4>
                            <p className="text-xs text-muted-foreground">
                              {(book.cardBatches || []).reduce((sum, b) => sum + b.length, 0)} cards ·{' '}
                              {book.totalPages} pages
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : (
            <LocalFeynmanPractice
              textbookTitle={selectedTextbook.title}
              cards={(selectedTextbook.cardBatches || []).flat()}
            />
          )}
        </TabsContent>

        {/* Progress Tab */}
        <TabsContent value="progress">
          <LearningAnalytics 
            flashcards={analyticsFlashcards}
            textbooksCount={textbooks.length}
            quizzesCompleted={textbooks.reduce((sum, book) => sum + (book.quizBatches?.length || 0), 0)}
          />
        </TabsContent>
      </Tabs>
      </div>
    </TooltipProvider>
  )
}
