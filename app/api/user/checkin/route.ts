import { NextRequest, NextResponse } from 'next/server'
import { resolveUserId } from '@/lib/firebase/auth-utils'
import { prisma } from '@/lib/prisma'

/**
 * POST /api/user/checkin
 * Daily check-in for streak tracking and free credits
 */
export async function POST(req: NextRequest) {
  try {
    // Resolve user ID - ensures user exists in database
    const userId = await resolveUserId(req)

    const now = new Date()

    const result = await prisma.$transaction(async (tx) => {
      const progress = await tx.userProgress.upsert({
        where: { userId },
        update: {},
        create: { userId },
      })

      const lastCheckIn = progress.lastCheckIn

      // Check if already checked in today
      if (lastCheckIn) {
        const isSameDay =
          lastCheckIn.getFullYear() === now.getFullYear() &&
          lastCheckIn.getMonth() === now.getMonth() &&
          lastCheckIn.getDate() === now.getDate()

        if (isSameDay) {
          return { alreadyCheckedIn: true as const, progress }
        }
      }

      // Calculate streak
      let newStreak = 1
      if (lastCheckIn) {
        const yesterday = new Date(now)
        yesterday.setDate(yesterday.getDate() - 1)

        const isConsecutive =
          lastCheckIn.getFullYear() === yesterday.getFullYear() &&
          lastCheckIn.getMonth() === yesterday.getMonth() &&
          lastCheckIn.getDate() === yesterday.getDate()

        if (isConsecutive) {
          newStreak = progress.currentStreak + 1
        }
      }

      // Calculate rewards based on streak
      const baseReward = 5
      let bonusReward = 0
      let txType: 'DAILY_CHECKIN' | 'STREAK_BONUS' = 'DAILY_CHECKIN'

      if (newStreak % 7 === 0) {
        // Weekly bonus
        bonusReward = 20
        txType = 'STREAK_BONUS'
      } else if (newStreak % 30 === 0) {
        // Monthly mega bonus
        bonusReward = 100
        txType = 'STREAK_BONUS'
      } else if (newStreak >= 3) {
        // Small bonus for 3+ day streaks
        bonusReward = newStreak
      }

      const totalReward = baseReward + bonusReward
      const longestStreak = Math.max(newStreak, progress.longestStreak)

      const claimed = await tx.userProgress.updateMany({
        where: { userId, lastCheckIn: lastCheckIn ?? null },
        data: {
          currentStreak: newStreak,
          longestStreak,
          lastCheckIn: now,
          totalCheckIns: { increment: 1 },
        },
      })

      if (claimed.count === 0) {
        const fresh = await tx.userProgress.findUnique({ where: { userId } })
        return { alreadyCheckedIn: true as const, progress: fresh ?? progress }
      }

      await tx.user.update({
        where: { id: userId },
        data: { credits: { increment: totalReward } },
      })

      await tx.transaction.create({
        data: {
          userId,
          type: txType,
          delta: totalReward,
        },
      })

      return {
        alreadyCheckedIn: false as const,
        reward: totalReward,
        baseReward,
        bonusReward,
        currentStreak: newStreak,
        longestStreak,
        message: bonusReward > 0 ? `${newStreak} day streak! Bonus earned!` : 'Check-in successful!',
      }
    })

    if (result.alreadyCheckedIn) {
      return NextResponse.json({
        success: false,
        message: 'Already checked in today',
        currentStreak: result.progress.currentStreak,
        longestStreak: result.progress.longestStreak,
      })
    }

    return NextResponse.json({
      success: true,
      reward: result.reward,
      baseReward: result.baseReward,
      bonusReward: result.bonusReward,
      currentStreak: result.currentStreak,
      longestStreak: result.longestStreak,
      message: result.message,
    })

  } catch (error) {
    console.error('Check-in error:', error)
    return NextResponse.json({ error: 'Failed to check in' }, { status: 500 })
  }
}

/**
 * GET /api/user/checkin
 * Get current check-in status
 */
export async function GET(req: NextRequest) {
  try {
    // Resolve user ID - ensures user exists in database
    const userId = await resolveUserId(req)

    const progress = await prisma.userProgress.findUnique({
      where: { userId }
    })

    if (!progress) {
      return NextResponse.json({
        currentStreak: 0,
        longestStreak: 0,
        canCheckIn: true
      })
    }

    const now = new Date()
    const lastCheckIn = progress.lastCheckIn

    let canCheckIn = true
    if (lastCheckIn) {
      const isSameDay = 
        lastCheckIn.getFullYear() === now.getFullYear() &&
        lastCheckIn.getMonth() === now.getMonth() &&
        lastCheckIn.getDate() === now.getDate()

      canCheckIn = !isSameDay
    }

    return NextResponse.json({
      currentStreak: progress.currentStreak,
      longestStreak: progress.longestStreak,
      totalCheckIns: progress.totalCheckIns,
      lastCheckIn: progress.lastCheckIn,
      canCheckIn
    })

  } catch (error) {
    console.error('Get check-in status error:', error)
    return NextResponse.json({ error: 'Failed to get status' }, { status: 500 })
  }
}
