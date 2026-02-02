export interface LocalFlashcard {
  id: string
  textbookId: string
  front: string
  back: string
  category?: string
  keyTerms?: string[]
  mnemonic?: string | null
}

export interface LocalQuizQuestion {
  id: string
  question: string
  options: string[]
  correctAnswer: string
  explanation?: string
}

export interface LocalTextbookSession {
  id: string
  title: string
  createdAt: string
  totalPages: number
  totalCards: number
  totalQuestions: number
  cardBatches: LocalFlashcard[][]
  quizBatches: LocalQuizQuestion[][]
}

const STORAGE_KEY = 'textbook_local_sessions_v1'

export function loadLocalSessions(): LocalTextbookSession[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed as LocalTextbookSession[]
  } catch {
    return []
  }
}

export function saveLocalSessions(sessions: LocalTextbookSession[]) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions))
  } catch {
    // ignore quota / serialization errors for now
  }
}

export function upsertLocalSession(session: LocalTextbookSession) {
  if (typeof window === 'undefined') return
  const existing = loadLocalSessions()
  const without = existing.filter(s => s.id !== session.id)
  const next = [...without, session]
  saveLocalSessions(next)
}
