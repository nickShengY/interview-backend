/**
 * Tests for the Salary Negotiation Client page component
 */

import { render, screen, fireEvent } from '@testing-library/react'

jest.mock('next/navigation', () => ({
  usePathname: () => '/salary-negotiation',
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

import SalaryNegotiationClient from '@/app/salary-negotiation/salary-negotiation-client'

describe('SalaryNegotiationClient', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should render the page header', () => {
    render(<SalaryNegotiationClient />)
    expect(screen.getByText('AI Salary Negotiation Coach')).toBeTruthy()
  })

  it('should render job title input', () => {
    render(<SalaryNegotiationClient />)
    expect(screen.getByPlaceholderText(/Software Engineer/i)).toBeTruthy()
  })

  it('should render industry selector', () => {
    render(<SalaryNegotiationClient />)
    expect(screen.getByText('Industry *')).toBeTruthy()
  })

  it('should have generate button', () => {
    render(<SalaryNegotiationClient />)
    const buttons = screen.getAllByRole('button')
    const genBtn = buttons.find(b => b.textContent?.includes('Generate'))
    expect(genBtn).toBeTruthy()
  })

  it('should disable generate button when required fields are empty', () => {
    render(<SalaryNegotiationClient />)
    const buttons = screen.getAllByRole('button')
    const genBtn = buttons.find(b => b.textContent?.includes('Generate'))
    expect(genBtn?.hasAttribute('disabled') || genBtn?.getAttribute('disabled') !== null).toBeTruthy()
  })

  it('should render without crashing', () => {
    const { container } = render(<SalaryNegotiationClient />)
    expect(container).toBeTruthy()
  })

  it('should show credit cost indicator', () => {
    render(<SalaryNegotiationClient />)
    expect(screen.getByText(/1 credit/i)).toBeTruthy()
  })

  it('should render experience level selector', () => {
    render(<SalaryNegotiationClient />)
    const buttons = screen.getAllByRole('combobox')
    expect(buttons.length).toBeGreaterThan(0)
  })
})
