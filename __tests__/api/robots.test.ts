/**
 * Tests for robots.txt generation
 */

import robots from '@/app/robots'

describe('robots.txt', () => {
  let result: any

  beforeAll(() => {
    result = robots()
  })

  it('should return rules array', () => {
    expect(Array.isArray(result.rules)).toBe(true)
    expect(result.rules.length).toBeGreaterThan(0)
  })

  it('should have a wildcard user agent rule', () => {
    const wildcard = result.rules.find((r: any) => r.userAgent === '*')
    expect(wildcard).toBeTruthy()
    expect(wildcard.allow).toBe('/')
  })

  it('should disallow /api/ for all agents', () => {
    const wildcard = result.rules.find((r: any) => r.userAgent === '*')
    expect(wildcard.disallow).toContain('/api/')
  })

  it('should disallow /profile for all agents', () => {
    const wildcard = result.rules.find((r: any) => r.userAgent === '*')
    expect(wildcard.disallow).toContain('/profile')
  })

  it('should have GPTBot rule', () => {
    const gptBot = result.rules.find((r: any) => r.userAgent === 'GPTBot')
    expect(gptBot).toBeTruthy()
  })

  it('should have sitemap URL', () => {
    expect(result.sitemap).toContain('/sitemap.xml')
  })

  it('should have host', () => {
    expect(result.host).toBeTruthy()
  })
})
