# Monitoring & Error Tracking Setup Guide

This guide walks you through setting up comprehensive monitoring, error tracking, and observability for Interview Pro in production.

---

## Table of Contents

1. [Error Tracking (Sentry)](#error-tracking-sentry)
2. [Uptime Monitoring](#uptime-monitoring)
3. [Performance Monitoring](#performance-monitoring)
4. [Database Monitoring](#database-monitoring)
5. [Log Aggregation](#log-aggregation)
6. [Alerting](#alerting)
7. [Dashboard Setup](#dashboard-setup)
8. [Testing Monitoring](#testing-monitoring)

---

## Error Tracking (Sentry)

### Why Sentry?
- Real-time error tracking
- Source map support for debugging
- User context (which user hit the error)
- Release tracking
- Performance monitoring
- **Free tier:** 5,000 errors/month

### Setup Steps

#### 1. Create Sentry Account

```bash
# Sign up at https://sentry.io
# Create a new project: Next.js
```

#### 2. Install Sentry SDK

```bash
npm install --save @sentry/nextjs
```

#### 3. Initialize Sentry

```bash
npx @sentry/wizard@latest -i nextjs
```

This creates:
- `sentry.client.config.ts`
- `sentry.server.config.ts`
- `sentry.edge.config.ts`

#### 4. Configure Environment Variables

Add to `.env.local`:

```bash
# Sentry
NEXT_PUBLIC_SENTRY_DSN=https://<key>@<org>.ingest.sentry.io/<project>
SENTRY_ORG=your-org
SENTRY_PROJECT=interview-pro
SENTRY_AUTH_TOKEN=<auth-token>

# Environment
NEXT_PUBLIC_ENVIRONMENT=production # or development/staging
```

#### 5. Update Sentry Configuration

**sentry.client.config.ts:**
```typescript
import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NEXT_PUBLIC_ENVIRONMENT || 'development',

  // Adjust sample rate for production (100% = all errors)
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

  // Session replay (expensive - use carefully)
  replaysSessionSampleRate: 0.1, // 10% of sessions
  replaysOnErrorSampleRate: 1.0, // 100% of error sessions

  // Don't send errors in development
  enabled: process.env.NODE_ENV === 'production',

  // Ignore common browser errors
  ignoreErrors: [
    'ResizeObserver loop limit exceeded',
    'Non-Error promise rejection captured',
  ],

  beforeSend(event, hint) {
    // Don't send events from demo user
    if (event.user?.email === 'demo@interview-pro.com') {
      return null
    }
    return event
  },
})
```

**sentry.server.config.ts:**
```typescript
import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NEXT_PUBLIC_ENVIRONMENT || 'development',
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  enabled: process.env.NODE_ENV === 'production',
})
```

#### 6. Add User Context

In your auth utils ([lib/firebase/auth-utils.ts](lib/firebase/auth-utils.ts)):

```typescript
import * as Sentry from '@sentry/nextjs'

export async function resolveUserId(request: Request): Promise<string> {
  const userId = // ... existing logic

  // Set user context for Sentry
  if (userId && process.env.NODE_ENV === 'production') {
    Sentry.setUser({ id: userId })
  }

  return userId
}
```

#### 7. Manual Error Capture

```typescript
// Capture exceptions
try {
  riskyOperation()
} catch (error) {
  Sentry.captureException(error, {
    tags: {
      feature: 'ats-scanner',
      userId: 'user-123',
    },
    level: 'error',
  })
  throw error
}

// Capture messages
Sentry.captureMessage('User uploaded suspicious file', {
  level: 'warning',
  extra: {
    fileName: 'malware.exe',
    userId: 'user-123',
  },
})
```

#### 8. Performance Monitoring

```typescript
// Trace expensive operations
import * as Sentry from '@sentry/nextjs'

const transaction = Sentry.startTransaction({
  name: 'Generate Flashcards',
  op: 'ai.generation',
})

try {
  await generateFlashcards(textbook)
  transaction.setStatus('ok')
} catch (error) {
  transaction.setStatus('internal_error')
  throw error
} finally {
  transaction.finish()
}
```

---

## Uptime Monitoring

### Option 1: UptimeRobot (Recommended - Free)

#### Setup:
1. Sign up at https://uptimerobot.com
2. Create monitors:
   - **Main Site:** `https://your-domain.com` (HTTP, 5-min interval)
   - **API Health:** `https://your-domain.com/api/health` (HTTP, 5-min interval)
   - **Backend API:** `https://backend.your-domain.com/health` (HTTP, 5-min interval)

#### Alert Contacts:
- Email: `team@your-domain.com`
- SMS (optional, paid): For critical alerts
- Slack/Discord webhook (optional): Real-time alerts

#### Configuration:
```
Monitor Type: HTTP(s)
Monitoring Interval: Every 5 minutes
Monitor Timeout: 30 seconds
HTTP Method: GET (HEAD for homepage)
Expected Status Code: 200
```

### Option 2: Pingdom

Similar setup, more features but paid.

### Option 3: Better Uptime

Modern alternative with status page integration.

---

## Performance Monitoring

### New Relic (Comprehensive)

#### 1. Sign Up & Install

```bash
npm install newrelic
```

#### 2. Configuration

Create `newrelic.js`:

```javascript
exports.config = {
  app_name: ['Interview Pro'],
  license_key: process.env.NEW_RELIC_LICENSE_KEY,
  logging: {
    level: 'info',
  },
  allow_all_headers: true,
  attributes: {
    exclude: [
      'request.headers.cookie',
      'request.headers.authorization',
    ],
  },
}
```

#### 3. Initialize

In `instrumentation.ts`:

```typescript
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('newrelic')
  }
}
```

### Vercel Analytics (Simpler Alternative)

```bash
npm install @vercel/analytics
```

In `app/layout.tsx`:

```typescript
import { Analytics } from '@vercel/analytics/react'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
```

---

## Database Monitoring

### Supabase (Built-in)

If using Supabase:
- Dashboard → Database → Logs
- Set up alerts for slow queries (>1s)
- Monitor connection pool usage

### Prisma Pulse (Real-time Database Changes)

```bash
npm install @prisma/extension-pulse
```

```typescript
import { PrismaClient } from '@prisma/client'
import { withPulse } from '@prisma/extension-pulse'

const prisma = new PrismaClient().$extends(withPulse())

// Subscribe to changes
const subscription = await prisma.user.subscribe({
  create: {
    after: (event) => {
      console.log('New user created:', event.created.email)
    },
  },
})
```

### Manual Query Logging

In `lib/prisma.ts`:

```typescript
import { PrismaClient } from '@prisma/client'
import * as Sentry from '@sentry/nextjs'

const prisma = new PrismaClient({
  log: [
    { level: 'warn', emit: 'event' },
    { level: 'error', emit: 'event' },
  ],
})

prisma.$on('warn', (e) => {
  console.warn('Prisma warning:', e)
})

prisma.$on('error', (e) => {
  console.error('Prisma error:', e)
  Sentry.captureException(new Error(e.message), {
    tags: { source: 'prisma' },
  })
})

// Log slow queries in production
if (process.env.NODE_ENV === 'production') {
  prisma.$use(async (params, next) => {
    const before = Date.now()
    const result = await next(params)
    const after = Date.now()
    const duration = after - before

    if (duration > 1000) {
      Sentry.captureMessage('Slow database query', {
        level: 'warning',
        extra: {
          model: params.model,
          action: params.action,
          duration: `${duration}ms`,
        },
      })
    }

    return result
  })
}

export { prisma }
```

---

## Log Aggregation

### Option 1: Structured Logging with Winston

```bash
npm install winston
```

Create `lib/logger.ts`:

```typescript
import winston from 'winston'

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'interview-pro' },
  transports: [
    // Write to console in development
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    }),

    // Write to file in production
    ...(process.env.NODE_ENV === 'production'
      ? [
          new winston.transports.File({ filename: 'error.log', level: 'error' }),
          new winston.transports.File({ filename: 'combined.log' }),
        ]
      : []),
  ],
})

export { logger }
```

Usage:

```typescript
import { logger } from '@/lib/logger'

logger.info('User logged in', { userId: 'user-123', method: 'google' })
logger.error('Payment failed', { userId: 'user-456', error: error.message })
logger.warn('File upload suspicious', { fileName: 'test.exe', userId: 'user-789' })
```

### Option 2: Cloud Logging

**Vercel:** Logs automatically captured in dashboard

**Railway:** Logs in deployment dashboard

**AWS:** CloudWatch Logs

```bash
npm install aws-sdk
```

---

## Alerting

### Critical Alerts

Set up alerts for:

1. **Error Rate Spike** (Sentry)
   - Threshold: >10 errors in 5 minutes
   - Action: Email + Slack notification

2. **API Downtime** (UptimeRobot)
   - Threshold: 2 consecutive failures
   - Action: Email + SMS

3. **Slow Response Time** (New Relic)
   - Threshold: Average response time >500ms for 5 minutes
   - Action: Email notification

4. **Database Errors** (Manual logging)
   - Threshold: Any database connection error
   - Action: Immediate alert

5. **Credit System Anomaly**
   - Threshold: >100 credits spent by single user in 1 hour
   - Action: Email notification (potential abuse)

### Setting Up Slack Alerts

1. Create Slack webhook:
   - Go to https://api.slack.com/apps
   - Create app → Incoming Webhooks
   - Copy webhook URL

2. Add to `.env.production`:
   ```bash
   SLACK_WEBHOOK_URL=https://hooks.slack.com/services/...
   ```

3. Create alert function:

```typescript
// lib/alerts.ts
export async function sendSlackAlert(message: string, severity: 'info' | 'warning' | 'error') {
  if (!process.env.SLACK_WEBHOOK_URL) return

  const colors = {
    info: '#36a64f',
    warning: '#ff9800',
    error: '#f44336',
  }

  await fetch(process.env.SLACK_WEBHOOK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      attachments: [
        {
          color: colors[severity],
          title: `[${severity.toUpperCase()}] Interview Pro`,
          text: message,
          ts: Math.floor(Date.now() / 1000),
        },
      ],
    }),
  })
}
```

---

## Dashboard Setup

### Option 1: Grafana + Prometheus

Complex but powerful. Best for advanced users.

### Option 2: Custom Next.js Admin Dashboard

Create `app/admin/dashboard/page.tsx`:

```typescript
import { prisma } from '@/lib/prisma'

export default async function AdminDashboard() {
  const stats = await Promise.all([
    prisma.user.count(),
    prisma.transaction.aggregate({ _sum: { delta: true } }),
    prisma.interviewSession.count({ where: { completed: true } }),
    prisma.textbook.count(),
  ])

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-8">Admin Dashboard</h1>

      <div className="grid grid-cols-4 gap-4">
        <StatCard title="Total Users" value={stats[0]} />
        <StatCard title="Total Credits Spent" value={Math.abs(stats[1]._sum.delta || 0)} />
        <StatCard title="Completed Sessions" value={stats[2]} />
        <StatCard title="Textbooks Uploaded" value={stats[3]} />
      </div>

      {/* Add charts, recent activity, error logs, etc. */}
    </div>
  )
}
```

### Option 3: Third-Party Dashboard Services

- **Retool:** Low-code admin dashboard
- **Metabase:** Open-source BI tool
- **Redash:** SQL-based dashboards

---

## Testing Monitoring

### Test Error Tracking

```typescript
// Add to your test suite
describe('Sentry Integration', () => {
  it('should capture exceptions', async () => {
    const mockCapture = jest.spyOn(Sentry, 'captureException')

    try {
      throw new Error('Test error')
    } catch (error) {
      Sentry.captureException(error)
    }

    expect(mockCapture).toHaveBeenCalled()
  })
})
```

### Test Alerts Manually

```bash
# Trigger test error in production
curl -X POST https://your-domain.com/api/test-sentry \
  -H "Authorization: Bearer <admin-token>"
```

Create `app/api/test-sentry/route.ts`:

```typescript
import * as Sentry from '@sentry/nextjs'

export async function POST(req: Request) {
  // Only allow in non-production or with admin token
  const token = req.headers.get('authorization')
  if (process.env.NODE_ENV === 'production' && token !== `Bearer ${process.env.ADMIN_TEST_TOKEN}`) {
    return new Response('Unauthorized', { status: 401 })
  }

  Sentry.captureMessage('Test Sentry integration', {
    level: 'info',
    tags: { test: true },
  })

  return new Response(JSON.stringify({ success: true, message: 'Test error sent to Sentry' }))
}
```

---

## Monitoring Checklist

Before production launch:

- [ ] Sentry installed and configured
- [ ] Source maps uploaded to Sentry
- [ ] User context added to errors
- [ ] Uptime monitoring configured (2+ monitors)
- [ ] Alert contacts configured (email, SMS, Slack)
- [ ] Database query logging enabled
- [ ] Slow query alerts set up
- [ ] Performance monitoring enabled
- [ ] Admin dashboard accessible
- [ ] Test alerts sent successfully
- [ ] Monitoring documented in runbook

---

## Recommended Monitoring Stack (Free Tier)

**For Startups:**
1. **Sentry** - Error tracking (5k errors/month free)
2. **UptimeRobot** - Uptime monitoring (50 monitors free)
3. **Vercel Analytics** - Performance (included with Vercel)
4. **Supabase Dashboard** - Database monitoring (included)
5. **Slack** - Alerts (free)

**Total Cost:** $0/month

**When to Upgrade:**
- Sentry: >5k errors/month → $26/month
- UptimeRobot: Need SMS alerts → $7/month
- New Relic: Need APM → $99/month

---

## Maintenance

### Weekly:
- [ ] Review error trends in Sentry
- [ ] Check uptime percentage (should be >99.9%)
- [ ] Review slow queries

### Monthly:
- [ ] Update alert thresholds based on traffic
- [ ] Review and archive old logs
- [ ] Test disaster recovery procedures

### Quarterly:
- [ ] Audit monitoring coverage
- [ ] Review and update runbook
- [ ] Test failover procedures

---

## Additional Resources

- [Sentry Next.js Docs](https://docs.sentry.io/platforms/javascript/guides/nextjs/)
- [Vercel Analytics](https://vercel.com/analytics)
- [UptimeRobot API](https://uptimerobot.com/api/)
- [Winston Logging](https://github.com/winstonjs/winston)

---

**Last Updated:** 2026-01-14
**Next Review:** After production launch
