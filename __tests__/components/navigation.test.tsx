import { render, screen } from '@testing-library/react'
import Navigation from '@/components/navigation'
import { useSession } from '@/lib/auth-client'

// Mock next/navigation
jest.mock('next/navigation', () => ({
  usePathname: () => '/',
}))

jest.mock('@/lib/auth-client', () => ({
  useSession: jest.fn(),
  signIn: jest.fn(),
  signOut: jest.fn(),
}))

describe('Navigation', () => {
  it('renders navigation links', () => {
    ;(useSession as unknown as jest.Mock).mockReturnValue({
      data: null,
      status: 'unauthenticated',
    })

    render(
      <Navigation />
    )
    
    expect(screen.getByText(/Interview Pro/i)).toBeTruthy()
  })

  it('shows sign in button when not authenticated', () => {
    ;(useSession as unknown as jest.Mock).mockReturnValue({
      data: null,
      status: 'unauthenticated',
    })

    render(
      <Navigation />
    )
    
    expect(screen.getByText(/Sign In/i)).toBeTruthy()
  })
})
