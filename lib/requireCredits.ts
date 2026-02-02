import { NextRequest, NextResponse } from 'next/server'
import { ensureCredits, refundCredits } from './credits'
import { TxType } from '@prisma/client'
import { resolveUserId } from '@/lib/firebase/auth-utils'

function hasMessage(err: unknown): err is { message: string } {
  return (
    typeof err === 'object' &&
    err !== null &&
    'message' in err &&
    typeof (err as { message?: unknown }).message === 'string'
  )
}

function getErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message
  if (hasMessage(err)) return err.message
  if (typeof err === 'string') return err
  return 'Unknown error'
}

/**
 * Wrap a POST handler to enforce credit deduction before continuing.
 * Usage:
 * export const POST = requireCredits(2, 'ATS_SCAN', async (req) => { ... })
 * 
 * This helper:
 * 1. Resolves the user ID (ensuring user exists in database)
 * 2. Deducts credits before calling the handler
 * 3. Refunds credits if the handler fails
 */
export function requireCredits(cost: number, txType: TxType, handler: (req: NextRequest, userId: string) => Promise<Response>) {
  return async function wrapped(req: NextRequest) {
    // Resolve user ID - this ensures user exists in database
    const userId = await resolveUserId(req)
    
    try {
      await ensureCredits(userId, cost, txType)
    } catch (e: unknown) {
      return NextResponse.json({ error: getErrorMessage(e) }, { status: 402 })
    }
    try {
      const res = await handler(req, userId)
      if (!(res as Response).ok) {
        await refundCredits(userId, cost, txType)
      }
      return res
    } catch (err: unknown) {
      await refundCredits(userId, cost, txType)
      return NextResponse.json({ error: getErrorMessage(err) || 'Internal Server Error' }, { status: 500 })
    }
  }
}
