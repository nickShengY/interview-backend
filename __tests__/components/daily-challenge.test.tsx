/**
 * Tests for the Daily Challenge component
 */

import { render, screen, fireEvent, act } from '@testing-library/react'

// Mock next/navigation
jest.mock('next/navigation', () => ({
  usePathname: () => '/daily-challenge',
  useRouter: () => ({ push: jest.fn() }),
}))

// Mock the toast hook
const mockToast = jest.fn()
jest.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: mockToast }),
}))

// Mock page-header
jest.mock('@/components/page-header', () => ({
  PageHeader: ({ title, description }: { title: string; description: string }) => (
    <div>
      <h1>{title}</h1>
      <p>{description}</p>
    </div>
  ),
}))

import DailyChallengeClient from '@/app/daily-challenge/daily-challenge-client'

describe('DailyChallengeClient', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    localStorage.clear()
  })

  it('should render the page header', () => {
    render(<DailyChallengeClient />)
    expect(screen.getByText('Daily Interview Challenge')).toBeTruthy()
  })

  it('should display streak stats at 0 initially', () => {
    render(<DailyChallengeClient />)
    expect(screen.getByText('Current Streak')).toBeTruthy()
    expect(screen.getByText('Longest Streak')).toBeTruthy()
    expect(screen.getByText('Total Completed')).toBeTruthy()
    expect(screen.getByText('Consistency')).toBeTruthy()
  })

  it('should display a daily question', () => {
    render(<DailyChallengeClient />)
    expect(screen.getByText("Today's Challenge", { exact: false })).toBeTruthy()
  })

  it('should render the answer textarea', () => {
    render(<DailyChallengeClient />)
    const textarea = screen.getByPlaceholderText(/STAR method/i)
    expect(textarea).toBeTruthy()
  })

  it('should have submit button disabled when answer is empty', () => {
    render(<DailyChallengeClient />)
    const submitBtn = screen.getByText('Submit Answer')
    expect(submitBtn.closest('button')?.hasAttribute('disabled')).toBe(true)
  })

  it('should enable submit button when answer has text', () => {
    render(<DailyChallengeClient />)
    const textarea = screen.getByPlaceholderText(/STAR method/i)
    fireEvent.change(textarea, { target: { value: 'This is my detailed answer about the situation where I had to work under pressure and deliver results in a timely manner.' } })
    const submitBtn = screen.getByText('Submit Answer')
    expect(submitBtn.closest('button')?.hasAttribute('disabled')).toBe(false)
  })

  it('should show toast when answer is too short', () => {
    render(<DailyChallengeClient />)
    const textarea = screen.getByPlaceholderText(/STAR method/i)
    fireEvent.change(textarea, { target: { value: 'Short' } })
    // Force-click submit by finding it
    const buttons = screen.getAllByRole('button')
    const submitBtn = buttons.find(b => b.textContent?.includes('Submit Answer'))
    if (submitBtn) {
      fireEvent.click(submitBtn)
    }
    // Toast should be called with too short error
    expect(mockToast).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Too Short' })
    )
  })

  it('should show hint when hint button is clicked', () => {
    render(<DailyChallengeClient />)
    const hintBtn = screen.getByText('Show Hint')
    fireEvent.click(hintBtn)
    expect(screen.getByText('Hide Hint')).toBeTruthy()
  })

  it('should toggle hint visibility', () => {
    render(<DailyChallengeClient />)
    const hintBtn = screen.getByText('Show Hint')
    fireEvent.click(hintBtn)
    expect(screen.getByText('Hide Hint')).toBeTruthy()
    fireEvent.click(screen.getByText('Hide Hint'))
    expect(screen.getByText('Show Hint')).toBeTruthy()
  })

  it('should display achievement badges', () => {
    render(<DailyChallengeClient />)
    expect(screen.getByText('Achievement Badges')).toBeTruthy()
    expect(screen.getByText('First Step')).toBeTruthy()
    expect(screen.getByText('Committed')).toBeTruthy()
    expect(screen.getByText('Unstoppable')).toBeTruthy()
    expect(screen.getByText('Legend')).toBeTruthy()
  })

  it('should display 30-day calendar', () => {
    render(<DailyChallengeClient />)
    expect(screen.getByText('Last 30 Days')).toBeTruthy()
    expect(screen.getByText('Completed')).toBeTruthy()
    expect(screen.getByText('Missed')).toBeTruthy()
    expect(screen.getByText('Today')).toBeTruthy()
  })

  it('should show difficulty badge for the question', () => {
    render(<DailyChallengeClient />)
    const badges = ['Easy', 'Medium', 'Hard']
    const found = badges.some(b => screen.queryByText(b) !== null)
    expect(found).toBe(true)
  })

  it('should show character count', () => {
    render(<DailyChallengeClient />)
    expect(screen.getByText('0 chars')).toBeTruthy()
  })

  it('should update character count as user types', () => {
    render(<DailyChallengeClient />)
    const textarea = screen.getByPlaceholderText(/STAR method/i)
    fireEvent.change(textarea, { target: { value: 'Hello world' } })
    expect(screen.getByText('11 chars')).toBeTruthy()
  })

  it('should submit answer and show completion state', () => {
    render(<DailyChallengeClient />)
    const textarea = screen.getByPlaceholderText(/STAR method/i)
    const longAnswer = 'In my previous role at Company X, I was tasked with leading a critical project that required cross-functional collaboration. I organized weekly syncs and delivered on time.'
    fireEvent.change(textarea, { target: { value: longAnswer } })
    
    const buttons = screen.getAllByRole('button')
    const submitBtn = buttons.find(b => b.textContent?.includes('Submit Answer'))
    if (submitBtn) {
      fireEvent.click(submitBtn)
    }
    
    expect(screen.getByText('Challenge Complete!')).toBeTruthy()
  })

  it('should persist answer to localStorage after submit', () => {
    render(<DailyChallengeClient />)
    const textarea = screen.getByPlaceholderText(/STAR method/i)
    const longAnswer = 'In my previous role at Company X, I was tasked with leading a critical project. The task involved coordinating multiple teams.'
    fireEvent.change(textarea, { target: { value: longAnswer } })
    
    const buttons = screen.getAllByRole('button')
    const submitBtn = buttons.find(b => b.textContent?.includes('Submit Answer'))
    if (submitBtn) {
      fireEvent.click(submitBtn)
    }
    
    const today = new Date().toISOString().split('T')[0]
    const saved = localStorage.getItem(`daily_answer_${today}`)
    expect(saved).toBe(longAnswer)
  })

  it('should persist streak data to localStorage after submit', () => {
    render(<DailyChallengeClient />)
    const textarea = screen.getByPlaceholderText(/STAR method/i)
    const longAnswer = 'This is a detailed answer about my experience working in a fast-paced environment where I had to adapt quickly.'
    fireEvent.change(textarea, { target: { value: longAnswer } })
    
    const buttons = screen.getAllByRole('button')
    const submitBtn = buttons.find(b => b.textContent?.includes('Submit Answer'))
    if (submitBtn) {
      fireEvent.click(submitBtn)
    }
    
    const streakData = JSON.parse(localStorage.getItem('daily_challenge_streak') || '{}')
    expect(streakData.currentStreak).toBe(1)
    expect(streakData.totalCompleted).toBe(1)
  })

  it('should restore submitted answer from localStorage', () => {
    const today = new Date().toISOString().split('T')[0]
    localStorage.setItem(`daily_answer_${today}`, 'Previously submitted answer that was saved in local storage.')
    
    render(<DailyChallengeClient />)
    expect(screen.getByText('Challenge Complete!')).toBeTruthy()
  })

  it('should reset streak if user missed a day', () => {
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 2)
    const streakData = {
      currentStreak: 5,
      longestStreak: 5,
      totalCompleted: 5,
      lastCompletedDate: yesterday.toISOString().split('T')[0],
      history: [],
    }
    localStorage.setItem('daily_challenge_streak', JSON.stringify(streakData))
    
    render(<DailyChallengeClient />)
    const updatedStreak = JSON.parse(localStorage.getItem('daily_challenge_streak') || '{}')
    expect(updatedStreak.currentStreak).toBe(0)
    expect(updatedStreak.longestStreak).toBe(5) // Longest should be preserved
  })
})
