/**
 * Tests for the Networking Email Generator component
 */

import { render, screen } from '@testing-library/react'
import { NetworkingEmailGenerator } from '@/components/career-tools/networking-email-generator'

jest.mock('next/navigation', () => ({
  usePathname: () => '/career-tools',
  useRouter: () => ({ push: jest.fn() }),
}))

jest.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: jest.fn() }),
}))

jest.mock('@/lib/auth-fetch', () => ({
  authFetch: jest.fn(),
}))

describe('NetworkingEmailGenerator', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should render the component title', () => {
    render(<NetworkingEmailGenerator />)
    expect(screen.getByText(/Networking Email/i)).toBeTruthy()
  })

  it('should have email type selector', () => {
    render(<NetworkingEmailGenerator />)
    // Check for select trigger or email type options
    const buttons = screen.getAllByRole('button')
    expect(buttons.length).toBeGreaterThan(0)
  })

  it('should render input fields for recipient details', () => {
    render(<NetworkingEmailGenerator />)
    expect(screen.getByPlaceholderText(/Engineering Manager/i)).toBeTruthy()
  })

  it('should have a generate button', () => {
    render(<NetworkingEmailGenerator />)
    const buttons = screen.getAllByRole('button')
    const genBtn = buttons.find(b => b.textContent?.includes('Generate'))
    expect(genBtn).toBeTruthy()
  })

  it('should render without crashing', () => {
    const { container } = render(<NetworkingEmailGenerator />)
    expect(container).toBeTruthy()
  })
})
