/**
 * Tests for StructuredData component and schema exports
 */

import { render } from '@testing-library/react'
import {
  StructuredData,
  organizationSchema,
  websiteSchema,
  generateBreadcrumbSchema,
} from '@/components/structured-data'

describe('StructuredData', () => {
  it('should render a script tag with JSON-LD', () => {
    const data = { '@type': 'Test', name: 'Hello' }
    const { container } = render(<StructuredData data={data} />)
    const script = container.querySelector('script[type="application/ld+json"]')
    expect(script).toBeTruthy()
    expect(script?.innerHTML).toBe(JSON.stringify(data))
  })

  it('should handle complex nested data', () => {
    const data = {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      nested: { deep: { value: 42 } },
      array: [1, 2, 3],
    }
    const { container } = render(<StructuredData data={data} />)
    const script = container.querySelector('script[type="application/ld+json"]')
    expect(JSON.parse(script?.innerHTML || '{}')).toEqual(data)
  })

  it('should handle empty data', () => {
    const { container } = render(<StructuredData data={{}} />)
    const script = container.querySelector('script[type="application/ld+json"]')
    expect(script?.innerHTML).toBe('{}')
  })
})

describe('organizationSchema', () => {
  it('should have correct @context', () => {
    expect(organizationSchema['@context']).toBe('https://schema.org')
  })

  it('should have correct @type', () => {
    expect(organizationSchema['@type']).toBe('Organization')
  })

  it('should have name Interview Pro', () => {
    expect(organizationSchema.name).toBe('Interview Pro')
  })

  it('should have a valid URL', () => {
    expect(organizationSchema.url).toContain('https://')
  })

  it('should have social media links', () => {
    expect(organizationSchema.sameAs.length).toBeGreaterThan(0)
  })

  it('should have contact point', () => {
    expect(organizationSchema.contactPoint).toBeDefined()
    expect(organizationSchema.contactPoint['@type']).toBe('ContactPoint')
  })
})

describe('websiteSchema', () => {
  it('should have correct @type', () => {
    expect(websiteSchema['@type']).toBe('WebSite')
  })

  it('should have search action', () => {
    expect(websiteSchema.potentialAction).toBeDefined()
    expect(websiteSchema.potentialAction['@type']).toBe('SearchAction')
  })

  it('should have search target URL', () => {
    expect(websiteSchema.potentialAction.target).toContain('search')
  })
})

describe('generateBreadcrumbSchema', () => {
  it('should generate breadcrumb list with correct structure', () => {
    const items = [
      { name: 'Home', item: '/' },
      { name: 'Career Tools', item: '/career-tools' },
    ]
    const schema = generateBreadcrumbSchema(items)
    expect(schema['@type']).toBe('BreadcrumbList')
    expect(schema.itemListElement).toHaveLength(2)
    expect(schema.itemListElement[0].position).toBe(1)
    expect(schema.itemListElement[1].position).toBe(2)
  })

  it('should prefix items with base URL', () => {
    const items = [{ name: 'Test', item: '/test' }]
    const schema = generateBreadcrumbSchema(items)
    expect(schema.itemListElement[0].item).toContain('https://interview-pro.ai/test')
  })

  it('should handle empty items array', () => {
    const schema = generateBreadcrumbSchema([])
    expect(schema.itemListElement).toHaveLength(0)
  })

  it('should handle single item', () => {
    const schema = generateBreadcrumbSchema([{ name: 'Home', item: '/' }])
    expect(schema.itemListElement[0].name).toBe('Home')
    expect(schema.itemListElement[0].position).toBe(1)
  })
})
