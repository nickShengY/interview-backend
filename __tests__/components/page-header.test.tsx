/**
 * Tests for the PageHeader component
 */

import { render, screen } from '@testing-library/react'
import { PageHeader } from '@/components/page-header'

describe('PageHeader', () => {
  it('should render title', () => {
    render(<PageHeader title="Test Title" />)
    expect(screen.getByText('Test Title')).toBeTruthy()
  })

  it('should render description when provided', () => {
    render(<PageHeader title="Title" description="Some description text" />)
    expect(screen.getByText('Some description text')).toBeTruthy()
  })

  it('should not render description element when not provided', () => {
    const { container } = render(<PageHeader title="No Desc" />)
    const paragraphs = container.querySelectorAll('p')
    expect(paragraphs.length).toBe(0)
  })

  it('should apply custom className', () => {
    const { container } = render(<PageHeader title="Title" className="custom-class" />)
    expect(container.firstElementChild?.classList.contains('custom-class')).toBe(true)
  })

  it('should apply titleClassName', () => {
    const { container } = render(<PageHeader title="Title" titleClassName="title-custom" />)
    const h1 = container.querySelector('h1')
    expect(h1?.classList.contains('title-custom')).toBe(true)
  })

  it('should apply descriptionClassName', () => {
    const { container } = render(
      <PageHeader title="Title" description="Desc" descriptionClassName="desc-custom" />
    )
    const p = container.querySelector('p')
    expect(p?.classList.contains('desc-custom')).toBe(true)
  })

  it('should render title as h1 element', () => {
    const { container } = render(<PageHeader title="Heading" />)
    expect(container.querySelector('h1')?.textContent).toBe('Heading')
  })

  it('should accept ReactNode as title', () => {
    render(<PageHeader title={<span data-testid="custom-title">Custom</span>} />)
    expect(screen.getByTestId('custom-title')).toBeTruthy()
  })

  it('should accept ReactNode as description', () => {
    render(
      <PageHeader
        title="Title"
        description={<span data-testid="custom-desc">Custom Desc</span>}
      />
    )
    expect(screen.getByTestId('custom-desc')).toBeTruthy()
  })
})
