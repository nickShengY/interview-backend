/**
 * Tests for the Career Roadmap Client page component
 */

import { render, screen, fireEvent } from '@testing-library/react'

jest.mock('next/navigation', () => ({
  usePathname: () => '/career-roadmap',
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

import CareerRoadmapClient from '@/app/career-roadmap/career-roadmap-client'

describe('CareerRoadmapClient', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should render the page header', () => {
    render(<CareerRoadmapClient />)
    expect(screen.getByText('AI Career Roadmap Planner')).toBeTruthy()
  })

  it('should render current role input', () => {
    render(<CareerRoadmapClient />)
    expect(screen.getByPlaceholderText(/Junior Data Analyst/i)).toBeTruthy()
  })

  it('should render target role input', () => {
    render(<CareerRoadmapClient />)
    expect(screen.getByPlaceholderText(/Machine Learning Engineer/i)).toBeTruthy()
  })

  it('should have generate button', () => {
    render(<CareerRoadmapClient />)
    const buttons = screen.getAllByRole('button')
    const genBtn = buttons.find(b => b.textContent?.includes('Generate'))
    expect(genBtn).toBeTruthy()
  })

  it('should disable generate button when required fields missing', () => {
    render(<CareerRoadmapClient />)
    const buttons = screen.getAllByRole('button')
    const genBtn = buttons.find(b => b.textContent?.includes('Generate'))
    expect(genBtn?.hasAttribute('disabled')).toBe(true)
  })

  it('should render without crashing', () => {
    const { container } = render(<CareerRoadmapClient />)
    expect(container).toBeTruthy()
  })

  it('should show credit cost', () => {
    render(<CareerRoadmapClient />)
    expect(screen.getByText(/1 credit/i)).toBeTruthy()
  })

  it('should have skills input field', () => {
    render(<CareerRoadmapClient />)
    expect(screen.getByPlaceholderText(/Python, SQL/i)).toBeTruthy()
  })
})
