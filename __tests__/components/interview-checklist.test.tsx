/**
 * Tests for the Interview Checklist component
 */

import { render, screen, fireEvent } from '@testing-library/react'
import { InterviewChecklist } from '@/components/career-tools/interview-checklist'

jest.mock('next/navigation', () => ({
  usePathname: () => '/career-tools',
  useRouter: () => ({ push: jest.fn() }),
}))

jest.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: jest.fn() }),
}))

describe('InterviewChecklist', () => {
  beforeEach(() => {
    localStorage.clear()
    jest.clearAllMocks()
  })

  it('should render the checklist title', () => {
    render(<InterviewChecklist />)
    expect(screen.getByText(/Interview Day Checklist/i)).toBeTruthy()
  })

  it('should display tasks completed count', () => {
    render(<InterviewChecklist />)
    expect(screen.getByText(/tasks completed/i)).toBeTruthy()
  })

  it('should display checklist categories', () => {
    render(<InterviewChecklist />)
    expect(screen.getByText(/1 Week Before/i)).toBeTruthy()
  })

  it('should allow clicking items to toggle checked state', () => {
    render(<InterviewChecklist />)
    const buttons = screen.getAllByRole('button')
    // Find a checklist item button (not Reset)
    const itemButtons = buttons.filter(b => !b.textContent?.includes('Reset'))
    expect(itemButtons.length).toBeGreaterThan(0)
    fireEvent.click(itemButtons[0])
    // After clicking, the item should be saved to localStorage
    const saved = localStorage.getItem('interview_checklist')
    expect(saved).toBeTruthy()
  })

  it('should have a Reset button', () => {
    render(<InterviewChecklist />)
    expect(screen.getByText('Reset')).toBeTruthy()
  })

  it('should show starting prompt text', () => {
    render(<InterviewChecklist />)
    expect(screen.getByText(/Let's get started/i)).toBeTruthy()
  })
})
