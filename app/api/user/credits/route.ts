import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { resolveUserId } from '@/lib/firebase/auth-utils'

export async function GET(request: Request) {
  try {
    // Resolve user ID - ensures user exists in database
    const userId = await resolveUserId(request)

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { credits: true, plan: true },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(user)
  } catch (error) {
    console.error('Error fetching credits:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
