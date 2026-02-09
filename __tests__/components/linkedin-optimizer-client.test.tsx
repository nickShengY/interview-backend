/**
 * Tests for the LinkedIn Optimizer Client page component
 */

import { render, screen, fireEvent } from '@testing-library/react'

jest.mock('next/navigation', () => ({
  usePathname: () => '/linkedin-optimizer',
  useRouter: () => ({ push: jest.fn() }),
}))

const mockToast = jest.fn()
jest.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: mockToast }),
}))

jest.mock('@/lib/auth-fetch', () => ({
  authFetch: jest.fn(),
}))

jest.mock('@/components/page-header', () => ({
  PageHeader: ({ title, description }: { title: string; description: string }) => (
    <div><h1>{title}</h1><p>{description}</p></div>
  ),
}))

import LinkedInOptimizerClient from '@/app/linkedin-optimizer/linkedin-optimizer-client'

describe('LinkedInOptimizerClient', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should render the page header', () => {
    render(<LinkedInOptimizerClient />)
    expect(screen.getByText('LinkedIn Profile Optimizer')).toBeTruthy()
  })

  it('should render input fields', () => {
    render(<LinkedInOptimizerClient />)
    const textboxes = screen.getAllByRole('textbox')
    expect(textboxes.length).toBeGreaterThan(0)
  })

  it('should have an optimize button', () => {
    render(<LinkedInOptimizerClient />)
    const buttons = screen.getAllByRole('button')
    const optBtn = buttons.find(b => b.textContent?.includes('Optimize'))
    expect(optBtn).toBeTruthy()
  })

  it('should disable optimize button when headline and summary are empty', () => {
    render(<LinkedInOptimizerClient />)
    const buttons = screen.getAllByRole('button')
    const optBtn = buttons.find(b => b.textContent?.includes('Optimize'))
    expect(optBtn?.hasAttribute('disabled')).toBe(true)
  })

  it('should render without crashing', () => {
    const { container } = render(<LinkedInOptimizerClient />)
    expect(container).toBeTruthy()
  })

  it('should show credit cost', () => {
    render(<LinkedInOptimizerClient />)
    expect(screen.getByText(/1 credit/i)).toBeTruthy()
  })

  it('should have textarea for summary/about section', () => {
    render(<LinkedInOptimizerClient />)
    const textareas = screen.getAllByRole('textbox')
    expect(textareas.length).toBeGreaterThan(0)
  })
})
