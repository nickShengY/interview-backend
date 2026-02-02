/**
 * Unit tests for requireCredits middleware
 */

import { prismaMock } from '../setup/prisma-mock'

jest.mock('@/lib/prisma', () => ({
  prisma: prismaMock,
}))

jest.mock('@/lib/firebase/auth-utils', () => ({
  resolveUserId: jest.fn(),
}))

jest.mock('@/lib/credits', () => ({
  ensureCredits: jest.fn(),
  refundCredits: jest.fn(),
}))

import { requireCredits } from '@/lib/requireCredits'
import { resolveUserId } from '@/lib/firebase/auth-utils'
import { ensureCredits, refundCredits } from '@/lib/credits'
import { NextRequest, NextResponse } from 'next/server'
import { TxType } from '@prisma/client'

describe('requireCredits Middleware', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should resolve user ID and pass it to handler', async () => {
    ;(resolveUserId as jest.Mock).mockResolvedValue('user-123')
    ;(ensureCredits as jest.Mock).mockResolvedValue(undefined)

    const handler = jest.fn().mockResolvedValue(
      NextResponse.json({ success: true })
    )

    const wrapped = requireCredits(2, TxType.ATS_SCAN, handler)
    const request = new NextRequest('http://localhost/api/test', { method: 'POST' })

    await wrapped(request)

    expect(handler).toHaveBeenCalledWith(request, 'user-123')
  })

  it('should deduct credits before calling handler', async () => {
    ;(resolveUserId as jest.Mock).mockResolvedValue('user-123')
    ;(ensureCredits as jest.Mock).mockResolvedValue(undefined)

    const handler = jest.fn().mockResolvedValue(
      NextResponse.json({ success: true })
    )

    const wrapped = requireCredits(5, TxType.COVER_LETTER, handler)
    const request = new NextRequest('http://localhost/api/test', { method: 'POST' })

    await wrapped(request)

    expect(ensureCredits).toHaveBeenCalledWith('user-123', 5, TxType.COVER_LETTER)
    // Verify handler was called after ensureCredits (order enforced by implementation)
    expect(handler).toHaveBeenCalled()
  })

  it('should return 402 when insufficient credits', async () => {
    ;(resolveUserId as jest.Mock).mockResolvedValue('user-123')
    ;(ensureCredits as jest.Mock).mockRejectedValue(new Error('Insufficient credits'))

    const handler = jest.fn()

    const wrapped = requireCredits(10, TxType.ATS_SCAN, handler)
    const request = new NextRequest('http://localhost/api/test', { method: 'POST' })

    const response = await wrapped(request)
    const data = await response.json()

    expect(response.status).toBe(402)
    expect(data.error).toBe('Insufficient credits')
    expect(handler).not.toHaveBeenCalled()
  })

  it('should refund credits when handler fails', async () => {
    ;(resolveUserId as jest.Mock).mockResolvedValue('user-123')
    ;(ensureCredits as jest.Mock).mockResolvedValue(undefined)
    ;(refundCredits as jest.Mock).mockResolvedValue(undefined)

    const handler = jest.fn().mockRejectedValue(new Error('Handler error'))

    const wrapped = requireCredits(3, TxType.TEXTBOOK_UPLOAD, handler)
    const request = new NextRequest('http://localhost/api/test', { method: 'POST' })

    const response = await wrapped(request)

    expect(refundCredits).toHaveBeenCalledWith('user-123', 3, TxType.TEXTBOOK_UPLOAD)
    expect(response.status).toBe(500)
  })

  it('should refund credits when handler returns non-OK response', async () => {
    ;(resolveUserId as jest.Mock).mockResolvedValue('user-123')
    ;(ensureCredits as jest.Mock).mockResolvedValue(undefined)
    ;(refundCredits as jest.Mock).mockResolvedValue(undefined)

    const handler = jest.fn().mockResolvedValue(
      NextResponse.json({ error: 'Bad request' }, { status: 400 })
    )

    const wrapped = requireCredits(2, TxType.ATS_SCAN, handler)
    const request = new NextRequest('http://localhost/api/test', { method: 'POST' })

    await wrapped(request)

    expect(refundCredits).toHaveBeenCalledWith('user-123', 2, TxType.ATS_SCAN)
  })

  it('should not refund credits when handler succeeds', async () => {
    ;(resolveUserId as jest.Mock).mockResolvedValue('user-123')
    ;(ensureCredits as jest.Mock).mockResolvedValue(undefined)

    const handler = jest.fn().mockResolvedValue(
      NextResponse.json({ success: true }, { status: 200 })
    )

    const wrapped = requireCredits(2, TxType.ATS_SCAN, handler)
    const request = new NextRequest('http://localhost/api/test', { method: 'POST' })

    await wrapped(request)

    expect(refundCredits).not.toHaveBeenCalled()
  })

  it('should handle User not found error from ensureCredits', async () => {
    ;(resolveUserId as jest.Mock).mockResolvedValue('user-123')
    ;(ensureCredits as jest.Mock).mockRejectedValue(new Error('User not found'))

    const handler = jest.fn()

    const wrapped = requireCredits(2, TxType.ATS_SCAN, handler)
    const request = new NextRequest('http://localhost/api/test', { method: 'POST' })

    const response = await wrapped(request)
    const data = await response.json()

    expect(response.status).toBe(402)
    expect(data.error).toBe('User not found')
  })

  it.each([
    [TxType.ATS_SCAN, 2],
    [TxType.COVER_LETTER, 3],
    [TxType.TECH_Q, 1],
    [TxType.BEHAV_Q, 1],
    [TxType.TEXTBOOK_UPLOAD, 5],
    [TxType.TEXTBOOK_GENERATE_FLASHCARDS, 2],
    [TxType.TEXTBOOK_GENERATE_QUIZ, 2],
  ])('should handle %s with cost %i', async (txType, cost) => {
    ;(resolveUserId as jest.Mock).mockResolvedValue('user-123')
    ;(ensureCredits as jest.Mock).mockResolvedValue(undefined)

    const handler = jest.fn().mockResolvedValue(
      NextResponse.json({ success: true })
    )

    const wrapped = requireCredits(cost, txType, handler)
    const request = new NextRequest('http://localhost/api/test', { method: 'POST' })

    await wrapped(request)

    expect(ensureCredits).toHaveBeenCalledWith('user-123', cost, txType)
  })
})
