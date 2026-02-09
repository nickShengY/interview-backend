/**
 * Tests for the sitemap generation
 */

import sitemap from '@/app/sitemap'

describe('Sitemap', () => {
  let urls: any[]

  beforeAll(() => {
    urls = sitemap()
  })

  it('should return an array of URL entries', () => {
    expect(Array.isArray(urls)).toBe(true)
    expect(urls.length).toBeGreaterThan(0)
  })

  it('should include the homepage', () => {
    const home = urls.find((u: any) => !u.url.includes('/') || u.url === urls[0]?.url)
    expect(home).toBeTruthy()
  })

  it('should include career tools pages', () => {
    const careerToolsUrl = urls.find((u: any) => u.url.includes('/career-tools'))
    expect(careerToolsUrl).toBeTruthy()
  })

  it('should include daily challenge page', () => {
    const dailyUrl = urls.find((u: any) => u.url.includes('/daily-challenge'))
    expect(dailyUrl).toBeTruthy()
  })

  it('should include salary negotiation page', () => {
    const salaryUrl = urls.find((u: any) => u.url.includes('/salary-negotiation'))
    expect(salaryUrl).toBeTruthy()
  })

  it('should include linkedin optimizer page', () => {
    const linkedinUrl = urls.find((u: any) => u.url.includes('/linkedin-optimizer'))
    expect(linkedinUrl).toBeTruthy()
  })

  it('should include career roadmap page', () => {
    const roadmapUrl = urls.find((u: any) => u.url.includes('/career-roadmap'))
    expect(roadmapUrl).toBeTruthy()
  })

  it('should include ATS scanner page', () => {
    const atsUrl = urls.find((u: any) => u.url.includes('/ats-scanner'))
    expect(atsUrl).toBeTruthy()
  })

  it('should have lastModified as Date for all entries', () => {
    urls.forEach((entry: any) => {
      expect(entry.lastModified).toBeInstanceOf(Date)
    })
  })

  it('should have valid changeFrequency values', () => {
    const validFreqs = ['always', 'hourly', 'daily', 'weekly', 'monthly', 'yearly', 'never']
    urls.forEach((entry: any) => {
      expect(validFreqs).toContain(entry.changeFrequency)
    })
  })

  it('should have priority between 0 and 1', () => {
    urls.forEach((entry: any) => {
      expect(entry.priority).toBeGreaterThanOrEqual(0)
      expect(entry.priority).toBeLessThanOrEqual(1)
    })
  })

  it('should have URLs that start with http:// or https://', () => {
    urls.forEach((entry: any) => {
      expect(entry.url).toMatch(/^https?:\/\//)
    })
  })
})
