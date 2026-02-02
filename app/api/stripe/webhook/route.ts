import { NextResponse } from 'next/server'

export function GET() {
  return NextResponse.json({ error: 'Stripe disabled. Payments not supported.' }, { status: 404 })
}

export function POST() {
  return NextResponse.json({ error: 'Stripe disabled. Payments not supported.' }, { status: 404 })
}
