/**
 * Tests for the Career Tools Client component (tab container)
 */

import { render, screen, fireEvent } from '@testing-library/react'

jest.mock('next/navigation', () => ({
  usePathname: () => '/career-tools',
  useRouter: () => ({ push: jest.fn() }),
}))

jest.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: jest.fn() }),
}))

jest.mock('@/components/page-header', () => ({
  PageHeader: ({ title, description }: { title: string; description: string }) => (
    <div><h1>{title}</h1><p>{description}</p></div>
  ),
}))

// Mock all sub-components with named exports
jest.mock('@/components/career-tools/star-story-bank', () => ({
  StarStoryBank: () => <div data-testid="star-story-bank">STARStoryBank</div>,
}))
jest.mock('@/components/career-tools/elevator-pitch-generator', () => ({
  ElevatorPitchGenerator: () => <div data-testid="elevator-pitch">ElevatorPitch</div>,
}))
jest.mock('@/components/career-tools/networking-email-generator', () => ({
  NetworkingEmailGenerator: () => <div data-testid="networking-email">NetworkingEmail</div>,
}))
jest.mock('@/components/career-tools/offer-comparison-tool', () => ({
  OfferComparisonTool: () => <div data-testid="offer-comparison">OfferComparison</div>,
}))
jest.mock('@/components/career-tools/interview-checklist', () => ({
  InterviewChecklist: () => <div data-testid="interview-checklist">InterviewChecklist</div>,
}))
jest.mock('@/components/career-tools/company-research-assistant', () => ({
  CompanyResearchAssistant: () => <div data-testid="company-research">CompanyResearch</div>,
}))

import CareerToolsClient from '@/app/career-tools/career-tools-client'

describe('CareerToolsClient', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should render the page header', () => {
    render(<CareerToolsClient />)
    expect(screen.getByText('AI Career Toolkit')).toBeTruthy()
  })

  it('should render tab navigation with all tool tabs', () => {
    render(<CareerToolsClient />)
    expect(screen.getByText('STAR Stories')).toBeTruthy()
    expect(screen.getByText('Elevator Pitch')).toBeTruthy()
    expect(screen.getByText('Networking Emails')).toBeTruthy()
    expect(screen.getByText('Offer Compare')).toBeTruthy()
    expect(screen.getByText('Interview Prep')).toBeTruthy()
    expect(screen.getByText('Company Intel')).toBeTruthy()
  })

  it('should show STAR Story Bank by default', () => {
    render(<CareerToolsClient />)
    expect(screen.getByTestId('star-story-bank')).toBeTruthy()
  })

  it('should switch to Elevator Pitch tab', () => {
    render(<CareerToolsClient />)
    fireEvent.click(screen.getByText('Elevator Pitch'))
    expect(screen.getByTestId('elevator-pitch')).toBeTruthy()
  })

  it('should switch to Networking Emails tab', () => {
    render(<CareerToolsClient />)
    fireEvent.click(screen.getByText('Networking Emails'))
    expect(screen.getByTestId('networking-email')).toBeTruthy()
  })

  it('should switch to Offer Compare tab', () => {
    render(<CareerToolsClient />)
    fireEvent.click(screen.getByText('Offer Compare'))
    expect(screen.getByTestId('offer-comparison')).toBeTruthy()
  })

  it('should switch to Interview Prep tab', () => {
    render(<CareerToolsClient />)
    fireEvent.click(screen.getByText('Interview Prep'))
    expect(screen.getByTestId('interview-checklist')).toBeTruthy()
  })

  it('should switch to Company Intel tab', () => {
    render(<CareerToolsClient />)
    fireEvent.click(screen.getByText('Company Intel'))
    expect(screen.getByTestId('company-research')).toBeTruthy()
  })
})
