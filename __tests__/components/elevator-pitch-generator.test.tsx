/**
 * Tests for the Elevator Pitch Generator component
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { ElevatorPitchGenerator } from '@/components/career-tools/elevator-pitch-generator'

jest.mock('next/navigation', () => ({
  usePathname: () => '/career-tools',
  useRouter: () => ({ push: jest.fn() }),
}))

const mockToast = jest.fn()
jest.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: mockToast }),
}))

// Mock authFetch
jest.mock('@/lib/auth-fetch', () => ({
  authFetch: jest.fn(),
}))

describe('ElevatorPitchGenerator', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should render the component title', () => {
    render(<ElevatorPitchGenerator />)
    expect(screen.getAllByText(/Elevator Pitch/i).length).toBeGreaterThan(0)
  })

  it('should render input fields', () => {
    render(<ElevatorPitchGenerator />)
    expect(screen.getByPlaceholderText(/e\.g\. Alex/i)).toBeTruthy()
  })

  it('should have a generate button', () => {
    render(<ElevatorPitchGenerator />)
    const buttons = screen.getAllByRole('button')
    const genBtn = buttons.find(b => b.textContent?.includes('Generate'))
    expect(genBtn).toBeTruthy()
  })

  it('should render without crashing with empty state', () => {
    const { container } = render(<ElevatorPitchGenerator />)
    expect(container).toBeTruthy()
  })

  it('should show input fields for role and skills', () => {
    render(<ElevatorPitchGenerator />)
    expect(screen.getByPlaceholderText(/Frontend Developer/i)).toBeTruthy()
    expect(screen.getByPlaceholderText(/Product Manager/i)).toBeTruthy()
  })
})
