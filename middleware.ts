import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(_req: NextRequest) {
  // TODO: Add Firebase token verification here when ready.
  // For now, allow all requests to pass through (demo mode enabled via client).
  return NextResponse.next()
}

export const config = {
  matcher: [
    '/profile/:path*',
    '/ats-scanner/:path*',
    '/technical-interview/:path*',
    '/behavioral-interview/:path*',
    '/review/:path*',
  ],
}
