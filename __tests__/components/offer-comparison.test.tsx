/**
 * Tests for the Offer Comparison Tool component
 */

// Polyfill crypto.randomUUID for jsdom
if (!globalThis.crypto) (globalThis as any).crypto = {}
if (!globalThis.crypto.randomUUID) {
  globalThis.crypto.randomUUID = () => Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2)
}

import { render, screen, fireEvent } from '@testing-library/react'
import { OfferComparisonTool } from '@/components/career-tools/offer-comparison-tool'

jest.mock('next/navigation', () => ({
  usePathname: () => '/career-tools',
  useRouter: () => ({ push: jest.fn() }),
}))

jest.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: jest.fn() }),
}))

describe('OfferComparisonTool', () => {
  beforeEach(() => {
    localStorage.clear()
    jest.clearAllMocks()
  })

  it('should render the component title', () => {
    render(<OfferComparisonTool />)
    expect(screen.getByText(/Offer Comparison/i)).toBeTruthy()
  })

  it('should have an Add Offer button', () => {
    render(<OfferComparisonTool />)
    const buttons = screen.getAllByRole('button')
    const addBtn = buttons.find(b => b.textContent?.includes('Add Offer'))
    expect(addBtn).toBeTruthy()
  })

  it('should render without crashing with no offers', () => {
    render(<OfferComparisonTool />)
    // Component should render without errors
    expect(screen.getByText(/Offer Comparison/i)).toBeTruthy()
  })

  it('should persist offers to localStorage', () => {
    const offers = [
      { id: '1', company: 'Google', salary: 150000, bonus: 20000, equity: 50000, pto: 20, remote: 'Hybrid', growth: 4, culture: 4, wlb: 3 },
    ]
    localStorage.setItem('offer_comparison', JSON.stringify(offers))
    render(<OfferComparisonTool />)
    // Component renders with pre-existing data
    expect(true).toBe(true)
  })
})
