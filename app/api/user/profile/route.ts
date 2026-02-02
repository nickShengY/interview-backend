import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { resolveUserId } from '@/lib/firebase/auth-utils'

export async function GET(request: Request) {
  try {
    // Resolve user ID - ensures user exists in database
    const userId = await resolveUserId(request)

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        country: true,
        mbti: true,
        sign: true,
        credits: true,
        plan: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json(user)
  } catch (error) {
    console.error('Error fetching user profile:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PATCH(req: Request) {
  try {
    // Resolve user ID - ensures user exists in database
    const userId = await resolveUserId(req)
    
    const body = await req.json()
    
    // Validate and filter allowed fields
    const allowedFields = ['name', 'country', 'mbti', 'sign']
    const updates: Record<string, string> = {}
    
    for (const field of allowedFields) {
      if (field in body && typeof body[field] === 'string') {
        updates[field] = body[field]
      }
    }
    
    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: 'No valid fields to update' },
        { status: 400 }
      )
    }
    
    const user = await prisma.user.update({
      where: { id: userId },
      data: updates,
      select: {
        id: true,
        name: true,
        email: true,
        country: true,
        mbti: true,
        sign: true,
        credits: true,
        plan: true,
        updatedAt: true,
      }
    })
    return NextResponse.json(user)
  } catch (error) {
    console.error('Error updating user profile:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
