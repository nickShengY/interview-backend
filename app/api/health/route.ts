import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // Check database connection
    await prisma.$queryRaw`SELECT 1`
    
    // Check backend API
    let backendStatus = 'unknown'
    try {
      const backendUrl = process.env.NEXT_PUBLIC_ATS_API
      if (backendUrl) {
        const response = await fetch(`${backendUrl}/health`, {
          signal: AbortSignal.timeout(5000) // 5 second timeout
        })
        backendStatus = response.ok ? 'healthy' : 'unhealthy'
      }
    } catch {
      backendStatus = 'unreachable'
    }
    
    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      services: {
        database: 'connected',
        backend: backendStatus,
      }
    })
  } catch (error) {
    return NextResponse.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      services: {
        database: 'disconnected',
        backend: 'unknown',
      },
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 503 })
  }
}
