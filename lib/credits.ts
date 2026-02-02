import { prisma } from './prisma'
import { TxType } from '@prisma/client'

export async function ensureCredits(userId: string, cost: number, txType: TxType): Promise<void> {
  await prisma.$transaction(async (tx) => {
    const updated = await tx.user.updateMany({
      where: { id: userId, credits: { gte: cost } },
      data: { credits: { decrement: cost } },
    })

    if (updated.count === 0) {
      const exists = await tx.user.findUnique({ where: { id: userId }, select: { id: true } })
      if (!exists) throw new Error('User not found')
      throw new Error('Insufficient credits')
    }

    await tx.transaction.create({ data: { userId, type: txType, delta: -cost } })
  })
}

export async function addCredits(userId: string, amount: number, txType: TxType = TxType.STRIPE_TOPUP): Promise<void> {
  await prisma.$transaction([
    prisma.user.update({ where: { id: userId }, data: { credits: { increment: amount } } }),
    prisma.transaction.create({ data: { userId, type: txType, delta: amount } }),
  ])
}

export async function refundCredits(userId: string, amount: number, txType: TxType = TxType.REWARD): Promise<void> {
  await prisma.$transaction([
    prisma.user.update({ where: { id: userId }, data: { credits: { increment: amount } } }),
    prisma.transaction.create({ data: { userId, type: txType, delta: amount } }),
  ])
}
