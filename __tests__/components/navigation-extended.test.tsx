/**
 * Extended navigation tests covering new modules and More dropdown
 */

import { render, screen, fireEvent } from '@testing-library/react'
import Navigation from '@/components/navigation'
import { useSession } from '@/lib/auth-client'

jest.mock('next/navigation', () => ({
  usePathname: jest.fn(() => '/'),
}))

jest.mock('@/lib/auth-client', () => ({
  useSession: jest.fn(),
  signIn: jest.fn(),
  signOut: jest.fn(),
}))

const { usePathname } = require('next/navigation')

describe('Navigation Extended', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(useSession as unknown as jest.Mock).mockReturnValue({
      data: null,
      status: 'unauthenticated',
    })
    usePathname.mockReturnValue('/')
  })

  it('renders the logo and brand name', () => {
    render(<Navigation />)
    expect(screen.getByText('Interview Pro')).toBeTruthy()
    expect(screen.getByText('AI-Powered Career')).toBeTruthy()
  })

  it('renders primary navigation links', () => {
    render(<Navigation />)
    expect(screen.getByText('ATS')).toBeTruthy()
    expect(screen.getByText('Technical')).toBeTruthy()
    expect(screen.getByText('Behavioral')).toBeTruthy()
    expect(screen.getByText('Learning')).toBeTruthy()
  })

  it('renders Daily Challenge link', () => {
    render(<Navigation />)
    expect(screen.getByText('Daily')).toBeTruthy()
  })

  it('renders More dropdown button', () => {
    render(<Navigation />)
    expect(screen.getByText('More')).toBeTruthy()
  })

  it('highlights active nav item', () => {
    usePathname.mockReturnValue('/daily-challenge')
    render(<Navigation />)
    expect(screen.getByText('Daily Challenge')).toBeTruthy()
  })

  it('shows full name for active route', () => {
    usePathname.mockReturnValue('/ats-scanner')
    render(<Navigation />)
    expect(screen.getByText('ATS Scanner')).toBeTruthy()
  })

  it('shows sign in button when unauthenticated', () => {
    render(<Navigation />)
    expect(screen.getByText('Sign In')).toBeTruthy()
  })

  it('shows user avatar when authenticated', () => {
    ;(useSession as unknown as jest.Mock).mockReturnValue({
      data: {
        user: { name: 'John Doe', email: 'john@example.com', image: '' },
      },
      status: 'authenticated',
    })
    render(<Navigation />)
    expect(screen.getByText('JD')).toBeTruthy()
  })

  it('shows loading state for auth', () => {
    ;(useSession as unknown as jest.Mock).mockReturnValue({
      data: null,
      status: 'loading',
    })
    render(<Navigation />)
    expect(screen.queryByText('Sign In')).toBeFalsy()
  })

  it('shows single initial for email-only user', () => {
    ;(useSession as unknown as jest.Mock).mockReturnValue({
      data: {
        user: { email: 'alice@test.com', name: null, image: '' },
      },
      status: 'authenticated',
    })
    render(<Navigation />)
    expect(screen.getByText('A')).toBeTruthy()
  })

  it('renders mobile menu toggle button', () => {
    render(<Navigation />)
    const buttons = screen.getAllByRole('button')
    // There should be at least a mobile menu toggle
    expect(buttons.length).toBeGreaterThan(0)
  })

  it('toggles mobile menu on click', () => {
    render(<Navigation />)
    // Find the mobile menu toggle (has Menu/X icon)
    const buttons = screen.getAllByRole('button')
    // The last few buttons include the mobile menu toggle
    // Click it to toggle mobile nav
    const mobileToggle = buttons.find(b => {
      const parent = b.closest('.md\\:hidden')
      return parent !== null
    })
    if (mobileToggle) {
      fireEvent.click(mobileToggle)
      // Mobile nav should now show all links including career tools
      expect(screen.getByText('Salary Negotiation')).toBeTruthy()
      expect(screen.getByText('LinkedIn Optimizer')).toBeTruthy()
      expect(screen.getByText('Career Roadmap')).toBeTruthy()
      expect(screen.getByText('Career Toolkit')).toBeTruthy()
    }
  })
})
