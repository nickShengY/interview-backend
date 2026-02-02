import { PrismaClient } from '@prisma/client'

// Prevent multiple instances in development
const globalForPrisma = global as unknown as { prisma?: PrismaClient }

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error'] : ['error'],
  })

if (process.env.NODE_ENV === 'development') globalForPrisma.prisma = prisma
