/**
 * Extended credits system tests - edge cases and error handling
 */

import { prismaMock } from '../setup/prisma-mock'

jest.mock('@/lib/prisma', () => ({
  prisma: prismaMock,
}))

import { ensureCredits, addCredits, refundCredits } from '@/lib/credits'
import { TxType } from '@prisma/client'

describe('Credits System - Extended Edge Cases', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('ensureCredits edge cases', () => {
    it('should handle negative cost gracefully', async () => {
      prismaMock.$transaction.mockImplementation(async (callback) => {
        if (typeof callback === 'function') {
          const mockTx = {
            user: {
              updateMany: jest.fn().mockResolvedValue({ count: 1 }),
              findUnique: jest.fn(),
            },
            transaction: {
              create: jest.fn().mockResolvedValue({ id: 'tx-1' }),
            },
          }
          return callback(mockTx as any)
        }
        return Promise.resolve([])
      })

      // Negative cost should still work (the where clause uses gte)
      await expect(ensureCredits('user-1', -1, TxType.ATS_SCAN)).resolves.not.toThrow()
    })

    it('should handle very large credit costs', async () => {
      prismaMock.$transaction.mockImplementation(async (callback) => {
        if (typeof callback === 'function') {
          const mockTx = {
            user: {
              updateMany: jest.fn().mockResolvedValue({ count: 0 }),
              findUnique: jest.fn().mockResolvedValue({ id: 'user-1' }),
            },
            transaction: { create: jest.fn() },
          }
          return callback(mockTx as any)
        }
        return Promise.resolve([])
      })

      await expect(ensureCredits('user-1', 999999, TxType.ATS_SCAN)).rejects.toThrow('Insufficient credits')
    })

    it('should handle database connection error', async () => {
      prismaMock.$transaction.mockRejectedValue(new Error('Connection refused'))

      await expect(ensureCredits('user-1', 1, TxType.TECH_Q)).rejects.toThrow('Connection refused')
    })

    it('should handle transaction timeout', async () => {
      prismaMock.$transaction.mockRejectedValue(new Error('Transaction timed out'))

      await expect(ensureCredits('user-1', 1, TxType.BEHAV_Q)).rejects.toThrow('Transaction timed out')
    })
  })

  describe('addCredits edge cases', () => {
    it('should handle adding zero credits', async () => {
      prismaMock.$transaction.mockResolvedValue([
        { id: 'user-1', credits: 10 },
        { id: 'tx-1' },
      ])

      await expect(addCredits('user-1', 0)).resolves.not.toThrow()
    })

    it('should handle very large credit additions', async () => {
      prismaMock.$transaction.mockResolvedValue([
        { id: 'user-1', credits: 1000000 },
        { id: 'tx-1' },
      ])

      await expect(addCredits('user-1', 1000000, TxType.STRIPE_TOPUP)).resolves.not.toThrow()
    })

    it('should handle database error during add', async () => {
      prismaMock.$transaction.mockRejectedValue(new Error('DB error'))

      await expect(addCredits('user-1', 10)).rejects.toThrow('DB error')
    })
  })

  describe('refundCredits edge cases', () => {
    it('should handle refund of zero credits', async () => {
      prismaMock.$transaction.mockResolvedValue([{}, {}])

      await expect(refundCredits('user-1', 0)).resolves.not.toThrow()
    })

    it('should handle refund with explicit transaction type', async () => {
      prismaMock.$transaction.mockResolvedValue([{}, {}])

      await expect(refundCredits('user-1', 5, TxType.COVER_LETTER)).resolves.not.toThrow()
      expect(prismaMock.$transaction).toHaveBeenCalled()
    })

    it('should handle database error during refund', async () => {
      prismaMock.$transaction.mockRejectedValue(new Error('Serialization failure'))

      await expect(refundCredits('user-1', 2)).rejects.toThrow('Serialization failure')
    })
  })
})
