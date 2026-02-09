/**
 * Tests for the STAR Story Bank component
 */

// Polyfill crypto.randomUUID for jsdom
if (!globalThis.crypto) (globalThis as any).crypto = {}
if (!(globalThis.crypto as any).randomUUID) {
  (globalThis.crypto as any).randomUUID = () => Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2)
}

import { render, screen, fireEvent } from '@testing-library/react'

jest.mock('next/navigation', () => ({
  usePathname: () => '/career-tools',
  useRouter: () => ({ push: jest.fn() }),
}))

jest.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: jest.fn() }),
}))

import { StarStoryBank as STARStoryBank } from '@/components/career-tools/star-story-bank'

describe('STARStoryBank', () => {
  beforeEach(() => {
    localStorage.clear()
    jest.clearAllMocks()
  })

  it('should render with empty state', () => {
    render(<STARStoryBank />)
    expect(screen.getByText('STAR Story Bank')).toBeTruthy()
    expect(screen.getByText('No Stories Yet')).toBeTruthy()
  })

  it('should show add story button', () => {
    render(<STARStoryBank />)
    expect(screen.getByText('Add Your First Story')).toBeTruthy()
  })

  it('should open form when Add Story is clicked', () => {
    render(<STARStoryBank />)
    fireEvent.click(screen.getByText('Add Your First Story'))
    expect(screen.getByPlaceholderText(/migration project/i)).toBeTruthy()
  })

  it('should display story count in header', () => {
    render(<STARStoryBank />)
    expect(screen.getByText(/0 stories saved/i)).toBeTruthy()
  })

  it('should have Add Story button in header', () => {
    render(<STARStoryBank />)
    const buttons = screen.getAllByRole('button')
    const addBtn = buttons.find(b => b.textContent?.includes('Add Story'))
    expect(addBtn).toBeTruthy()
  })

  it('should render the empty state illustration', () => {
    render(<STARStoryBank />)
    expect(screen.getByText(/Start building your STAR story bank/i)).toBeTruthy()
  })

  it('should persist stories to localStorage', () => {
    // Pre-populate localStorage with a story
    const stories = [{
      id: '1',
      title: 'Led project',
      situation: 'Team needed leadership',
      task: 'Lead the project',
      action: 'Organized sprints',
      result: 'Delivered on time',
      tags: ['leadership'],
      createdAt: new Date().toISOString(),
    }]
    localStorage.setItem('star_stories', JSON.stringify(stories))

    render(<STARStoryBank />)
    expect(screen.getByText(/1 stories? saved/i)).toBeTruthy()
  })
})
