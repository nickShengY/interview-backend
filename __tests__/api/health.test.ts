/**
 * Unit tests for health API route
 */

import { prismaMock } from '../setup/prisma-mock'

jest.mock('@/lib/prisma', () => ({
  prisma: prismaMock,
}))

import { GET } from '@/app/api/health/route'

describe('GET /api/health', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    process.env.NEXT_PUBLIC_ATS_API = 'http://localhost:8000'
    if (!global.AbortSignal) {
      ;(global as typeof globalThis & { AbortSignal: typeof AbortSignal }).AbortSignal =
        (class {
          static timeout() {
            return undefined as unknown as AbortSignal
          }
        } as unknown) as typeof AbortSignal
    }
    if (!('timeout' in global.AbortSignal)) {
      Object.defineProperty(global.AbortSignal, 'timeout', {
        value: jest.fn(),
        configurable: true,
      })
    }
  })

  it('returns healthy status when dependencies are ok', async () => {
    prismaMock.$queryRaw.mockResolvedValue([1])
    global.fetch = jest.fn().mockResolvedValue({ ok: true }) as jest.Mock

    const response = await GET()

    expect(response.status).toBe(200)
    const data = await response.json()
    expect(data.status).toBe('healthy')
    expect(data.services.database).toBe('connected')
    expect(data.services.backend).toBe('healthy')
  })

  it('returns unhealthy status when database fails', async () => {
    prismaMock.$queryRaw.mockRejectedValue(new Error('DB down'))

    const response = await GET()

    expect(response.status).toBe(503)
    const data = await response.json()
    expect(data.status).toBe('unhealthy')
  })

  it('marks backend unreachable on fetch error', async () => {
    prismaMock.$queryRaw.mockResolvedValue([1])
    global.fetch = jest.fn().mockRejectedValue(new Error('down')) as jest.Mock

    const response = await GET()

    expect(response.status).toBe(200)
    const data = await response.json()
    expect(data.services.backend).toBe('unreachable')
  })
})
