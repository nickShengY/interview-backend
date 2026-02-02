import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { resolveUserId } from '@/lib/firebase/auth-utils'
import { TxType } from '@prisma/client'

export async function POST(req: NextRequest) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not available' }, { status: 404 })
  }
  
  // Resolve user ID - this works for both demo and authenticated users
  const userId = await resolveUserId(req)
  
  const updated = await prisma.$transaction([
    prisma.user.update({ where: { id: userId }, data: { credits: { increment: 100 } } }),
    prisma.transaction.create({ data: { userId, type: TxType.REWARD, delta: 100 } }),
  ])
  const user = updated[0] as { credits: number }
  return NextResponse.json({ credits: user.credits })
}
