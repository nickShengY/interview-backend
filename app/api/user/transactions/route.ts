import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { resolveUserId } from '@/lib/firebase/auth-utils'

export async function GET(req: Request) {
  try {
    // Resolve user ID - ensures user exists in database
    const userId = await resolveUserId(req)
    
    const { searchParams } = new URL(req.url)
    const limit = parseInt(searchParams.get('limit') || '50')
    
    const transactions = await prisma.transaction.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: Math.min(limit, 100), // Max 100
      select: {
        id: true,
        type: true,
        delta: true,
        createdAt: true,
      }
    })
    
    return NextResponse.json(transactions)
  } catch (error) {
    console.error('Error fetching transactions:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
