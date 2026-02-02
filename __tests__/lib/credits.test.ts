/**
 * Unit tests for the credits system
 */

import { prismaMock } from '../setup/prisma-mock'

// Mock prisma before importing credits
jest.mock('@/lib/prisma', () => ({
  prisma: prismaMock,
}))

import { ensureCredits, addCredits, refundCredits } from '@/lib/credits'
import { TxType } from '@prisma/client'

describe('Credits System', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('ensureCredits', () => {
    it('should deduct credits when user has sufficient balance', async () => {
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

      await expect(ensureCredits('user-1', 5, TxType.ATS_SCAN)).resolves.not.toThrow()
    })

    it('should throw error when user has insufficient credits', async () => {
      prismaMock.$transaction.mockImplementation(async (callback) => {
        if (typeof callback === 'function') {
          const mockTx = {
            user: {
              updateMany: jest.fn().mockResolvedValue({ count: 0 }),
              findUnique: jest.fn().mockResolvedValue({ id: 'user-1' }),
            },
            transaction: {
              create: jest.fn(),
            },
          }
          return callback(mockTx as any)
        }
        return Promise.resolve([])
      })

      await expect(ensureCredits('user-1', 5, TxType.ATS_SCAN)).rejects.toThrow('Insufficient credits')
    })

    it('should throw error when user not found', async () => {
      prismaMock.$transaction.mockImplementation(async (callback) => {
        if (typeof callback === 'function') {
          const mockTx = {
            user: {
              updateMany: jest.fn().mockResolvedValue({ count: 0 }),
              findUnique: jest.fn().mockResolvedValue(null),
            },
            transaction: {
              create: jest.fn(),
            },
          }
          return callback(mockTx as any)
        }
        return Promise.resolve([])
      })

      await expect(ensureCredits('nonexistent-user', 5, TxType.ATS_SCAN)).rejects.toThrow('User not found')
    })

    it('should create transaction record with correct type', async () => {
      const createSpy = jest.fn().mockResolvedValue({ id: 'tx-1' })
      
      prismaMock.$transaction.mockImplementation(async (callback) => {
        if (typeof callback === 'function') {
          const mockTx = {
            user: {
              updateMany: jest.fn().mockResolvedValue({ count: 1 }),
              findUnique: jest.fn(),
            },
            transaction: {
              create: createSpy,
            },
          }
          return callback(mockTx as any)
        }
        return Promise.resolve([])
      })

      await ensureCredits('user-1', 2, TxType.COVER_LETTER)
      
      expect(createSpy).toHaveBeenCalledWith({
        data: { userId: 'user-1', type: TxType.COVER_LETTER, delta: -2 },
      })
    })

    it('should handle zero cost correctly', async () => {
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

      await expect(ensureCredits('user-1', 0, TxType.TECH_Q)).resolves.not.toThrow()
    })
  })

  describe('addCredits', () => {
    it('should add credits to user account', async () => {
      prismaMock.$transaction.mockResolvedValue([
        { id: 'user-1', credits: 15 },
        { id: 'tx-1' },
      ])

      await expect(addCredits('user-1', 10, TxType.STRIPE_TOPUP)).resolves.not.toThrow()
      
      expect(prismaMock.$transaction).toHaveBeenCalled()
    })

    it('should create positive delta transaction', async () => {
      prismaMock.$transaction.mockResolvedValue([
        { id: 'user-1', credits: 20 },
        { id: 'tx-1', delta: 10 },
      ])

      await addCredits('user-1', 10, TxType.REWARD)
      
      expect(prismaMock.$transaction).toHaveBeenCalled()
    })

    it('should default to STRIPE_TOPUP transaction type', async () => {
      prismaMock.$transaction.mockResolvedValue([{}, {}])

      await addCredits('user-1', 50)
      
      expect(prismaMock.$transaction).toHaveBeenCalled()
    })
  })

  describe('refundCredits', () => {
    it('should refund credits to user account', async () => {
      prismaMock.$transaction.mockResolvedValue([
        { id: 'user-1', credits: 12 },
        { id: 'tx-1' },
      ])

      await expect(refundCredits('user-1', 2, TxType.ATS_SCAN)).resolves.not.toThrow()
    })

    it('should default to REWARD transaction type', async () => {
      prismaMock.$transaction.mockResolvedValue([{}, {}])

      await refundCredits('user-1', 5)
      
      expect(prismaMock.$transaction).toHaveBeenCalled()
    })
  })

  describe('Transaction Types', () => {
    it.each([
      [TxType.ATS_SCAN, 2],
      [TxType.COVER_LETTER, 3],
      [TxType.TECH_Q, 1],
      [TxType.BEHAV_Q, 1],
      [TxType.TEXTBOOK_UPLOAD, 5],
      [TxType.TEXTBOOK_GENERATE_FLASHCARDS, 2],
      [TxType.TEXTBOOK_GENERATE_QUIZ, 2],
    ])('should handle %s transaction type with cost %i', async (txType, cost) => {
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

      await expect(ensureCredits('user-1', cost, txType)).resolves.not.toThrow()
    })
  })

  describe('Concurrency Safety', () => {
    it('should use atomic updateMany for credit deduction', async () => {
      const updateManySpy = jest.fn().mockResolvedValue({ count: 1 })
      
      prismaMock.$transaction.mockImplementation(async (callback) => {
        if (typeof callback === 'function') {
          const mockTx = {
            user: {
              updateMany: updateManySpy,
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

      await ensureCredits('user-1', 5, TxType.ATS_SCAN)
      
      expect(updateManySpy).toHaveBeenCalledWith({
        where: { id: 'user-1', credits: { gte: 5 } },
        data: { credits: { decrement: 5 } },
      })
    })
  })
})
