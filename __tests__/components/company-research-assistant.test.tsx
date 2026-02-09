/**
 * Tests for the Company Research Assistant component
 */

import { render, screen } from '@testing-library/react'
import { CompanyResearchAssistant } from '@/components/career-tools/company-research-assistant'

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

describe('CompanyResearchAssistant', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should render the component title', () => {
    render(<CompanyResearchAssistant />)
    expect(screen.getByText(/Company Research/i)).toBeTruthy()
  })

  it('should have company name input', () => {
    render(<CompanyResearchAssistant />)
    expect(screen.getByPlaceholderText(/Google, Stripe/i)).toBeTruthy()
  })

  it('should have a research button', () => {
    render(<CompanyResearchAssistant />)
    const buttons = screen.getAllByRole('button')
    const researchBtn = buttons.find(b => b.textContent?.includes('Research'))
    expect(researchBtn).toBeTruthy()
  })

  it('should render without crashing', () => {
    const { container } = render(<CompanyResearchAssistant />)
    expect(container).toBeTruthy()
  })

  it('should have role input field', () => {
    render(<CompanyResearchAssistant />)
    expect(screen.getByPlaceholderText(/Senior Software Engineer/i)).toBeTruthy()
  })
})
