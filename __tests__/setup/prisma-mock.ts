/**
 * Prisma mock for unit testing
 * Install jest-mock-extended: npm install -D jest-mock-extended
 */

// Simple mock implementation that doesn't require jest-mock-extended
const createPrismaMock = () => ({
  user: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
    delete: jest.fn(),
    upsert: jest.fn(),
  },
  userProgress: {
    findUnique: jest.fn(),
    upsert: jest.fn(),
    updateMany: jest.fn(),
  },
  transaction: {
    findMany: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    aggregate: jest.fn(),
  },
  qA: {
    findFirst: jest.fn(),
    create: jest.fn(),
    findMany: jest.fn(),
  },
  interviewSession: {
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
  },
  generatedQuestion: {
    findMany: jest.fn(),
    create: jest.fn(),
  },
  textbook: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  flashcard: {
    findFirst: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  flashcardReview: {
    create: jest.fn(),
  },
  quiz: {
    findMany: jest.fn(),
    create: jest.fn(),
  },
  $queryRaw: jest.fn(),
  $transaction: jest.fn(),
})

export const prismaMock = createPrismaMock()

export const resetPrismaMock = () => {
  Object.values(prismaMock).forEach((model) => {
    if (typeof model === 'object' && model !== null) {
      Object.values(model).forEach((method) => {
        if (typeof method === 'function' && 'mockReset' in method) {
          (method as jest.Mock).mockReset()
        }
      })
    }
  })
}

beforeEach(() => {
  resetPrismaMock()
})
