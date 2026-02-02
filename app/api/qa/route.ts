import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { resolveUserId } from '@/lib/firebase/auth-utils'

export async function GET(req: NextRequest) {
  try {
    // Resolve user ID - ensures user exists in database
    const userId = await resolveUserId(req)

    const qas = await prisma.qA.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json({ qas })
  } catch (error) {
    console.error('Error fetching QAs:', error)
    return NextResponse.json({ error: 'Failed to fetch QAs' }, { status: 500 })
  }
}
