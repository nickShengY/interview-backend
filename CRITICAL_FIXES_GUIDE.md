# Critical Fixes - Implementation Guide

This guide provides step-by-step instructions for the **MUST-FIX** issues before production deployment.

---

## 🔥 Fix #1: Enable Authentication (HIGH PRIORITY)

### Step 1.1: Fix Layout to Use SessionProvider
**File:** `app/layout.tsx`

```typescript
// Current (BROKEN):
import { SessionProvider } from "next-auth/react"  // Imported but not used!

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider ...>
          {children}  // ❌ Not wrapped with SessionProvider
        </ThemeProvider>
      </body>
    </html>
  )
}

// Fixed:
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <SessionProvider>  {/* ✅ Add this */}
          <ThemeProvider ...>
            {children}
          </ThemeProvider>
        </SessionProvider>
      </body>
    </html>
  )
}
```

### Step 1.2: Create Middleware for Protected Routes
**File:** `middleware.ts` (CREATE NEW)

```typescript
export { default } from "next-auth/middleware"

export const config = {
  matcher: [
    '/profile/:path*',
    '/ats-scanner/:path*',
    '/technical-interview/:path*',
    '/behavioral-interview/:path*',
    '/review/:path*',
  ]
}
```

### Step 1.3: Fix Navigation to Show Real User
**File:** `components/navigation.tsx`

```typescript
"use client"

import { useSession, signOut } from "next-auth/react"

export default function Navigation() {
  const { data: session, status } = useSession()
  
  // Show loading state
  if (status === "loading") {
    return <nav>Loading...</nav>
  }
  
  // Show login button if not authenticated
  if (!session) {
    return <nav>
      <Link href="/api/auth/signin">
        <Button>Sign In</Button>
      </Link>
    </nav>
  }
  
  // Show user info
  return (
    <nav>
      <Avatar>
        <AvatarImage src={session.user?.image || ""} />
        <AvatarFallback>
          {session.user?.name?.charAt(0) || "U"}
        </AvatarFallback>
      </Avatar>
      <DropdownMenuItem onClick={() => signOut()}>
        Sign Out
      </DropdownMenuItem>
    </nav>
  )
}
```

### Step 1.4: Fix Profile Page to Fetch Real Data
**File:** `app/profile/page.tsx`

```typescript
"use client"

import { useSession } from "next-auth/react"
import { useEffect, useState } from "react"

export default function ProfilePage() {
  const { data: session } = useSession()
  const [userData, setUserData] = useState(null)
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    async function fetchUserData() {
      try {
        const res = await fetch('/api/user/profile')
        const data = await res.json()
        setUserData(data)
      } catch (error) {
        console.error('Failed to fetch user data:', error)
      } finally {
        setLoading(false)
      }
    }
    
    if (session) {
      fetchUserData()
    }
  }, [session])
  
  if (loading) return <div>Loading...</div>
  
  return (
    <div>
      <h1>{userData?.name || session?.user?.name}</h1>
      <p>{userData?.email || session?.user?.email}</p>
      <p>Credits: {userData?.credits || 0}</p>
    </div>
  )
}
```

### Step 1.5: Create User Profile API
**File:** `app/api/user/profile/route.ts` (CREATE NEW)

```typescript
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      country: true,
      istp: true,
      sign: true,
      credits: true,
      plan: true,
      createdAt: true,
    }
  })
  
  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }
  
  return NextResponse.json(user)
}

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  const body = await req.json()
  
  // Validate input
  const allowedFields = ['name', 'country', 'istp', 'sign']
  const updates = Object.keys(body)
    .filter(key => allowedFields.includes(key))
    .reduce((obj, key) => ({ ...obj, [key]: body[key] }), {})
  
  const user = await prisma.user.update({
    where: { id: session.user.id },
    data: updates,
  })
  
  return NextResponse.json(user)
}
```

---

## 🔥 Fix #2: Remove Dangerous Build Settings

### Step 2.1: Fix next.config.mjs
**File:** `next.config.mjs`

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  // ❌ REMOVE THESE DANGEROUS SETTINGS:
  // eslint: { ignoreDuringBuilds: true },
  // typescript: { ignoreBuildErrors: true },
  
  // ✅ PROPER CONFIGURATION:
  reactStrictMode: true,
  
  images: {
    // Enable optimization for production
    unoptimized: process.env.NODE_ENV === 'development',
    domains: ['lh3.googleusercontent.com'], // For Google OAuth avatars
  },
  
  // Security headers
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin'
          }
        ]
      }
    ]
  },
}

export default nextConfig
```

### Step 2.2: Create ESLint Config
**File:** `.eslintrc.json` (CREATE NEW)

```json
{
  "extends": [
    "next/core-web-vitals",
    "next/typescript"
  ],
  "rules": {
    "@typescript-eslint/no-unused-vars": "error",
    "@typescript-eslint/no-explicit-any": "warn",
    "react-hooks/rules-of-hooks": "error",
    "react-hooks/exhaustive-deps": "warn"
  }
}
```

### Step 2.3: Enable TypeScript Strict Mode
**File:** `tsconfig.json`

```json
{
  "compilerOptions": {
    "strict": true,  // ✅ Add this
    "noUncheckedIndexedAccess": true,  // ✅ Add this
    "noImplicitAny": true,
    // ... rest of config
  }
}
```

---

## 🔥 Fix #3: Add Error Handling

### Step 3.1: Create Global Error Boundary
**File:** `app/error.tsx` (CREATE NEW)

```typescript
'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertTriangle } from 'lucide-react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log error to monitoring service (e.g., Sentry)
    console.error('Application error:', error)
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="max-w-lg w-full">
        <CardHeader>
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-6 h-6 text-red-500" />
            <CardTitle>Something went wrong!</CardTitle>
          </div>
          <CardDescription>
            We encountered an unexpected error. Please try again.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
            <p className="text-sm text-red-800 dark:text-red-200 font-mono">
              {error.message}
            </p>
          </div>
          <div className="flex space-x-2">
            <Button onClick={() => reset()} className="flex-1">
              Try Again
            </Button>
            <Button 
              variant="outline" 
              onClick={() => window.location.href = '/'}
              className="flex-1"
            >
              Go Home
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
```

### Step 3.2: Create Loading States
**File:** `app/loading.tsx` (CREATE NEW)

```typescript
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

export default function Loading() {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="space-y-2">
        <Skeleton className="h-12 w-3/4 mx-auto" />
        <Skeleton className="h-4 w-1/2 mx-auto" />
      </div>
      <div className="grid md:grid-cols-2 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-6 w-1/2" />
              <Skeleton className="h-4 w-3/4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-32 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
```

### Step 3.3: Create 404 Page
**File:** `app/not-found.tsx` (CREATE NEW)

```typescript
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { FileQuestion } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="text-center space-y-6">
        <FileQuestion className="w-24 h-24 mx-auto text-gray-400" />
        <h1 className="text-6xl font-bold text-gray-900 dark:text-white">404</h1>
        <h2 className="text-2xl font-semibold">Page Not Found</h2>
        <p className="text-gray-600 dark:text-gray-400 max-w-md">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Link href="/">
          <Button size="lg">
            Go Back Home
          </Button>
        </Link>
      </div>
    </div>
  )
}
```

### Step 3.4: Add Skeleton Component
**File:** `components/ui/skeleton.tsx` (CREATE NEW)

```typescript
import { cn } from "@/lib/utils"

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-gray-200 dark:bg-gray-700", className)}
      {...props}
    />
  )
}

export { Skeleton }
```

---

## 🔥 Fix #4: Secure the Backend API

### Step 4.1: Fix CORS Settings
**File:** `backend/main.py`

```python
# ❌ CURRENT (INSECURE):
allow_origins=["*"]

# ✅ FIXED:
import os

allowed_origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,  # From environment variable
    allow_credentials=True,
    allow_methods=["GET", "POST"],  # Only needed methods
    allow_headers=["Content-Type", "Authorization"],
)
```

### Step 4.2: Add Rate Limiting
**File:** `backend/main.py`

```python
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

@app.post("/scan")
@limiter.limit("5/minute")  # Max 5 scans per minute
async def scan_resume(request: Request, resume: UploadFile = File(...), jd: str = Form(...)):
    # ... existing code
```

### Step 4.3: Add Input Validation
**File:** `backend/main.py`

```python
from pydantic import BaseModel, validator

class ScanRequest(BaseModel):
    jd: str
    
    @validator('jd')
    def jd_must_not_be_empty(cls, v):
        if not v or len(v.strip()) < 10:
            raise ValueError('Job description too short')
        if len(v) > 50000:
            raise ValueError('Job description too long')
        return v

@app.post("/scan")
async def scan_resume(
    resume: UploadFile = File(...), 
    jd: str = Form(...)
):
    # Validate file size
    if resume.size and resume.size > 10 * 1024 * 1024:  # 10MB
        raise HTTPException(status_code=400, detail="File too large")
    
    # Validate job description
    try:
        ScanRequest(jd=jd)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    
    # ... rest of code
```

### Step 4.4: Update Backend Requirements
**File:** `backend/requirements.txt`

```
fastapi==0.110.0
uvicorn[standard]==0.29.0
pdfplumber==0.10.3
python-docx==1.1.0
docx2txt==0.8
scikit-learn==1.4.2
numpy==1.26.4
nltk==3.8.1
python-multipart==0.0.9
requests==2.32.3
google-generativeai==0.7.2
slowapi==0.1.9  # ✅ Add for rate limiting
pydantic==2.6.0  # ✅ Add for validation
```

---

## 🔥 Fix #5: Add Database Indexes

### Step 5.1: Update Prisma Schema
**File:** `prisma/schema.prisma`

```prisma
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String?
  country   String?
  istp      String?
  sign      String?
  credits   Int      @default(0)
  plan      Plan     @default(FREE)
  stripeCustomerId String? @unique  // ✅ Add unique constraint
  transactions Transaction[]
  qa         QA[]
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  @@index([email])  // ✅ Add index
  @@index([stripeCustomerId])  // ✅ Add index
}

model Transaction {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)  // ✅ Add cascade
  type      TxType
  delta     Int
  createdAt DateTime @default(now())
  
  @@index([userId])  // ✅ Add index
  @@index([createdAt])  // ✅ Add index
}

model QA {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)  // ✅ Add cascade
  kind      QAKind
  question  String   @db.Text  // ✅ Use Text for long content
  answer    String   @db.Text  // ✅ Use Text for long content
  feedback  String?  @db.Text  // ✅ Use Text for long content
  createdAt DateTime @default(now())
  
  @@index([userId])  // ✅ Add index
  @@index([createdAt])  // ✅ Add index
}
```

### Step 5.2: Apply Database Changes

```bash
# Generate Prisma client with new schema
npx prisma generate

# Push changes to database
npx prisma db push

# Or create a migration for production
npx prisma migrate dev --name add_indexes_and_cascades
```

---

## 🔥 Fix #6: Replace Mock Data with Real API Calls

### Step 6.1: Fix ATS Scanner
**File:** `app/ats-scanner/page.tsx`

```typescript
const handleScan = async () => {
  if (!resumeFile || !jobDescription.trim()) {
    toast({
      title: "Missing Information",
      description: "Please upload a resume and provide a job description.",
      variant: "destructive",
    })
    return
  }

  setIsScanning(true)

  try {
    const formData = new FormData()
    formData.append('resume', resumeFile)
    formData.append('jd', jobDescription)

    const response = await fetch(`${process.env.NEXT_PUBLIC_ATS_API}/scan`, {
      method: 'POST',
      body: formData,
    })

    if (!response.ok) {
      throw new Error('Scan failed')
    }

    const results = await response.json()
    setScanResults(results)
    
    toast({
      title: "Scan Complete!",
      description: "Your resume has been analyzed successfully.",
    })
  } catch (error) {
    console.error('Scan error:', error)
    toast({
      title: "Scan Failed",
      description: "Failed to analyze resume. Please try again.",
      variant: "destructive",
    })
  } finally {
    setIsScanning(false)
  }
}
```

---

## 🔥 Fix #7: Add Environment Validation

### Step 7.1: Install env-nextjs
```bash
npm install @t3-oss/env-nextjs zod
```

### Step 7.2: Create Env Schema
**File:** `lib/env.ts` (CREATE NEW)

```typescript
import { createEnv } from "@t3-oss/env-nextjs"
import { z } from "zod"

export const env = createEnv({
  server: {
    DATABASE_URL: z.string().url(),
    NEXTAUTH_SECRET: z.string().min(1),
    NEXTAUTH_URL: z.string().url(),
    GOOGLE_CLIENT_ID: z.string().min(1),
    GOOGLE_CLIENT_SECRET: z.string().min(1),
    GOOGLE_API_KEY: z.string().min(1),
    STRIPE_SECRET_KEY: z.string().startsWith("sk_"),
    STRIPE_WEBHOOK_SECRET: z.string().startsWith("whsec_"),
    STRIPE_PRICE_PRO: z.string().startsWith("price_"),
    STRIPE_PRICE_ULTRA: z.string().startsWith("price_"),
  },
  client: {
    NEXT_PUBLIC_ATS_API: z.string().url(),
    NEXT_PUBLIC_APP_URL: z.string().url(),
  },
  runtimeEnv: {
    DATABASE_URL: process.env.DATABASE_URL,
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
    GOOGLE_API_KEY: process.env.GOOGLE_API_KEY,
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
    STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
    STRIPE_PRICE_PRO: process.env.STRIPE_PRICE_PRO,
    STRIPE_PRICE_ULTRA: process.env.STRIPE_PRICE_ULTRA,
    NEXT_PUBLIC_ATS_API: process.env.NEXT_PUBLIC_ATS_API,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  },
})
```

### Step 7.3: Use in Code
Replace all `process.env.X` with `env.X` throughout the codebase.

---

## ✅ Verification Checklist

After implementing these fixes:

- [ ] App builds without TypeScript errors (`npm run build`)
- [ ] No ESLint errors (`npm run lint`)
- [ ] Authentication works (can sign in/out)
- [ ] Protected routes require authentication
- [ ] Profile page shows real user data
- [ ] ATS scanner connects to backend API
- [ ] Backend has rate limiting enabled
- [ ] Database has proper indexes
- [ ] Error pages display correctly
- [ ] Loading states work
- [ ] Environment variables validated on startup

---

## Next Steps

After completing these critical fixes:

1. **Add Tests** - See `TESTING_GUIDE.md` (to be created)
2. **Add Monitoring** - Set up Sentry, logging
3. **Performance Optimization** - Enable image optimization, caching
4. **Security Audit** - Run security checks
5. **Load Testing** - Test with realistic traffic

**Estimated Time:** 2-3 days for an experienced developer to implement all critical fixes.
