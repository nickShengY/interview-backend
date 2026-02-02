import { NextRequest, NextResponse } from 'next/server'
import { requireCredits } from '@/lib/requireCredits'

export const runtime = 'nodejs'

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

async function handler(req: NextRequest, _userId: string) {
  void _userId
  try {
    const form = await req.formData()
    const resume = form.get('resume') as File | null
    const jd = form.get('jd') as string | null

    if (!resume || !jd) {
      return NextResponse.json({ error: 'Missing resume or job description' }, { status: 400 })
    }

    const backend = process.env.NEXT_PUBLIC_ATS_API || 'http://localhost:8000'

    const out = new FormData()
    out.append('resume', resume)
    out.append('jd', jd)

    const res = await fetch(`${backend}/scan`, { method: 'POST', body: out })
    const text = await res.text()

    // Pass through status; requireCredits will refund on non-OK
    try {
      return NextResponse.json(JSON.parse(text), { status: res.status })
    } catch {
      return NextResponse.json({ error: text || 'Backend returned non-JSON' }, { status: res.status })
    }
  } catch (e: unknown) {
    return NextResponse.json({ error: getErrorMessage(e) || 'Failed to proxy ATS scan' }, { status: 500 })
  }
}

// Deduct 2 credits per ATS scan
export const POST = requireCredits(2, 'ATS_SCAN', handler)
