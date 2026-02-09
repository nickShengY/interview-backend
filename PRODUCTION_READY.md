# 🚀 Production Ready - Complete Setup Guide

This guide will take you from development to a **fully production-ready application** that passes all quality standards.

---

## ✅ What Was Fixed

All critical production blockers have been resolved:

### 1. ✅ Authentication System
- **Fixed**: SessionProvider now properly wraps the app
- **Added**: Middleware for route protection
- **Added**: Real user authentication with useSession
- **Added**: Sign in/out functionality with Google OAuth
- **Added**: NextAuth database models (Account, Session, VerificationToken)

### 2. ✅ Error Handling
- **Added**: Global error boundary (`app/error.tsx`)
- **Added**: Loading states (`app/loading.tsx`)
- **Added**: 404 page (`app/not-found.tsx`)
- **Added**: Skeleton component for loading states

### 3. ✅ Security
- **Fixed**: CORS now uses environment variables (not "*")
- **Added**: Rate limiting (10 requests/minute per IP)
- **Added**: Input validation with Pydantic
- **Added**: File size limits (10MB max)
- **Added**: Security headers in Next.js config
- **Added**: Proper error logging

### 4. ✅ Database
- **Added**: Indexes on all foreign keys
- **Added**: Composite indexes for common queries
- **Added**: Cascade delete rules
- **Added**: Text type for long fields
- **Added**: NextAuth required tables
- **Fixed**: Default credits set to 10 for new users

### 5. ✅ Build Configuration  
- **Removed**: Dangerous `ignoreDuringBuilds` and `ignoreBuildErrors`
- **Added**: React strict mode
- **Added**: Image optimization
- **Added**: Security headers
- **Added**: Route redirects for duplicate paths

### 6. ✅ Testing Infrastructure
- **Added**: Jest configuration for unit tests
- **Added**: Playwright for E2E tests
- **Added**: Sample tests for components
- **Added**: Test scripts in package.json

### 7. ✅ Monitoring & SEO
- **Added**: Health check endpoints
- **Added**: Structured logging
- **Added**: Sitemap and robots.txt
- **Added**: Enhanced SEO metadata
- **Added**: Environment validation

### 8. ✅ Real API Integration
- **Updated**: Navigation uses real user data
- **Updated**: Floating credits fetches real balance
- **Added**: User profile API endpoints
- **Added**: Transactions API endpoint

---

## 📋 Step-by-Step Setup Instructions

### Phase 1: Install Dependencies (5 minutes)

```bash
# Install Node.js dependencies
npm install

# Install Python backend dependencies
cd backend
pip install -r requirements.txt
cd ..
```

### Phase 2: Environment Setup (10 minutes)

1. **Copy environment template:**
```bash
cp .env.example .env.local
```

2. **Fill in ALL required variables in `.env.local`:**

```bash
# Database - Get from Supabase, PlanetScale, or Railway
DATABASE_URL="postgresql://username:password@host:5432/database"

# NextAuth - Generate secret: openssl rand -base64 32
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-random-secret-here"

# Google OAuth - Get from Google Cloud Console
# https://console.cloud.google.com/apis/credentials
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# OpenRouter AI - Get from https://openrouter.ai/keys
OPENROUTER_API_KEY="your-openrouter-api-key"
# Optional attribution headers
# OPENROUTER_APP_URL="https://yourdomain.com"
# OPENROUTER_APP_NAME="Interview Pro"

# Stripe - Get from https://dashboard.stripe.com/apikeys
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# Create products in Stripe Dashboard, copy price IDs
STRIPE_PRICE_PRO="price_..."
STRIPE_PRICE_ULTRA="price_..."

# App URLs
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NEXT_PUBLIC_ATS_API="http://localhost:8000"

# Optional: For backend CORS
ALLOWED_ORIGINS="http://localhost:3000"
```

**⚠️ IMPORTANT**: Never commit `.env.local` to git!

### Phase 3: Database Setup (5 minutes)

```bash
# Generate Prisma client
npm run db:generate

# Push schema to database (creates all tables)
npm run db:push

# Or create a migration for production
npm run db:migrate

# Optional: View database in browser
npm run db:studio
```

**Verify:** Check that all tables were created:
- User
- Account
- Session
- VerificationToken
- Transaction
- QA

### Phase 4: Setup Google OAuth (10 minutes)

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Google+ API
4. Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client ID"
5. Application type: "Web application"
6. Authorized JavaScript origins:
   - `http://localhost:3000`
   - `https://yourdomain.com` (production)
7. Authorized redirect URIs:
   - `http://localhost:3000/api/auth/callback/google`
   - `https://yourdomain.com/api/auth/callback/google`
8. Copy Client ID and Client Secret to `.env.local`

### Phase 5: Setup Stripe (15 minutes)

1. Go to [Stripe Dashboard](https://dashboard.stripe.com/)
2. Get API keys from "Developers" → "API keys"
3. Copy Secret key to `.env.local`

**Create Products:**
1. Go to "Products" → "Add Product"
2. Create "Pro Plan":
   - Name: Pro Plan
   - Price: $7.99 (or your price)
   - Billing: One-time
   - Copy the price ID (starts with `price_`)
3. Create "Ultra Plan":
   - Name: Ultra Plan  
   - Price: $27.99
   - Billing: One-time
   - Copy the price ID

**Setup Webhook:**
1. Go to "Developers" → "Webhooks" → "Add endpoint"
2. Endpoint URL: `https://yourdomain.com/api/stripe/webhook`
3. Listen to events: `checkout.session.completed`
4. Copy signing secret (starts with `whsec_`)

### Phase 6: Verify Setup (5 minutes)

Run the verification checks:

```bash
# Type check
npm run type-check

# Lint check
npm run lint

# Test database connection
npm run db:studio
```

All should pass without errors.

---

## 🏃 Running the Application

### Development Mode

**Terminal 1 - Database (optional, if using Docker):**
```bash
npm run docker:dev
```

**Terminal 2 - Backend:**
```bash
cd backend
uvicorn main:app --reload --port 8000
```

**Terminal 3 - Frontend:**
```bash
npm run dev
```

**Access:**
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000/docs
- Database Studio: `npm run db:studio`

### Testing

```bash
# Run unit tests
npm test

# Run tests once (CI mode)
npm run test:ci

# Run E2E tests
npm run test:e2e

# Run E2E tests with UI
npm run test:e2e:ui
```

### Production Build

```bash
# Build for production
npm run build

# Start production server
npm start
```

**Verify build:**
- No TypeScript errors
- No ESLint errors
- Bundle size is reasonable
- All pages render correctly

---

## 🚀 Deployment

### Frontend Deployment (Vercel)

1. **Push to GitHub:**
```bash
git add .
git commit -m "Production ready"
git push origin main
```

2. **Deploy to Vercel:**
   - Go to [vercel.com](https://vercel.com)
   - Import your GitHub repository
   - Framework: Next.js
   - Root directory: `.` (default)

3. **Add Environment Variables:**
   Copy all variables from `.env.local` to Vercel dashboard:
   - Settings → Environment Variables
   - Add each variable
   - Apply to Production, Preview, and Development

4. **Deploy:**
   - Vercel will auto-deploy on push to main
   - First deployment may take 3-5 minutes

5. **Update OAuth URLs:**
   - Go to Google Cloud Console
   - Add Vercel URL to authorized origins and redirect URIs

### Backend Deployment (Railway/Render)

**Option A: Railway**

1. Go to [railway.app](https://railway.app)
2. New Project → Deploy from GitHub
3. Select your repository
4. Add environment variables:
```
OPENROUTER_API_KEY=...
# Optional attribution headers
# OPENROUTER_APP_URL=https://your-frontend-url.vercel.app
# OPENROUTER_APP_NAME=Interview Pro
ALLOWED_ORIGINS=https://your-frontend-url.vercel.app
```
5. Settings:
   - Root Directory: `backend`
   - Start Command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
6. Deploy

**Option B: Render**

1. Go to [render.com](https://render.com)
2. New → Web Service
3. Connect GitHub repository
4. Settings:
   - Environment: Python 3
   - Build Command: `pip install -r requirements.txt`
   - Start Command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
   - Root Directory: `backend`
5. Add environment variables
6. Deploy

### Database Deployment

**Option A: Supabase (Recommended)**

1. Go to [supabase.com](https://supabase.com)
2. New Project
3. Copy connection string
4. Update `DATABASE_URL` in Vercel and locally
5. Run: `npm run db:push`

**Option B: PlanetScale**

1. Go to [planetscale.com](https://planetscale.com)
2. Create database
3. Get connection string
4. Update environment variables
5. Push schema

### Post-Deployment Checklist

- [ ] Frontend accessible at production URL
- [ ] Backend API responding at `/health`
- [ ] Database connected (check `/api/health`)
- [ ] Google OAuth login works
- [ ] Stripe checkout works
- [ ] ATS scanning works
- [ ] All pages load without errors
- [ ] SEO metadata correct (view source)
- [ ] Security headers present (check browser dev tools)

---

## 🧪 Testing Guide

### Unit Tests

```bash
# Run in watch mode during development
npm test

# Run all tests once
npm run test:ci

# Generate coverage report
npm run test:ci
# Open coverage/lcov-report/index.html
```

### E2E Tests

```bash
# Install browsers (first time only)
npx playwright install

# Run all E2E tests
npm run test:e2e

# Run with UI (interactive)
npm run test:e2e:ui

# Run specific test
npx playwright test e2e/homepage.spec.ts
```

### Manual Testing Checklist

**Authentication:**
- [ ] Sign in with Google works
- [ ] Profile shows correct user info
- [ ] Sign out works
- [ ] Protected routes redirect to sign in

**ATS Scanner:**
- [ ] Upload PDF resume
- [ ] Get scan results
- [ ] Generate cover letter
- [ ] Credits deducted correctly

**Interview Practice:**
- [ ] Technical questions generate
- [ ] Behavioral questions generate
- [ ] Can submit answers
- [ ] Spin wheel works
- [ ] View past Q&A

**Credits:**
- [ ] Balance displays correctly
- [ ] Transactions show up
- [ ] Purchase credits with Stripe
- [ ] Credits update after purchase

---

## 📊 Monitoring & Maintenance

### Health Checks

**Frontend:**
```bash
curl https://your-app.vercel.app/api/health
```

**Backend:**
```bash
curl https://your-backend.railway.app/health
```

Both should return `{"status": "healthy"}`

### Logging

**View logs in production:**

- **Vercel**: Dashboard → Project → Deployments → View logs
- **Railway**: Dashboard → Project → Deployments → View logs

**Add error monitoring (recommended):**

```bash
npm install @sentry/nextjs
npx @sentry/wizard@latest -i nextjs
```

### Database Monitoring

```bash
# Check database health
npm run db:studio

# View recent transactions
# Run in Prisma Studio or psql
SELECT * FROM "Transaction" ORDER BY "createdAt" DESC LIMIT 10;

# Check user count
SELECT COUNT(*) FROM "User";
```

### Performance Monitoring

Add Vercel Analytics:
```bash
npm install @vercel/analytics
```

Update `app/layout.tsx`:
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

## 🔒 Security Best Practices

### Environment Variables
- ✅ Never commit `.env.local` to git
- ✅ Use different keys for dev/prod
- ✅ Rotate keys every 90 days
- ✅ Use Vercel/Railway environment variables

### API Security
- ✅ Rate limiting enabled (10/min)
- ✅ CORS restricted to frontend domain
- ✅ Input validation on all endpoints
- ✅ File size limits enforced
- ✅ SQL injection protected (Prisma)

### Authentication
- ✅ OAuth only (no password storage)
- ✅ Session tokens encrypted
- ✅ CSRF protection enabled
- ✅ Secure cookies in production

### Data Privacy
- ✅ No sensitive data in logs
- ✅ User data encrypted in database
- ✅ Cascade delete on user removal
- ✅ Privacy policy and terms included

---

## 🐛 Troubleshooting

### Build Fails

**Error: "Module not found"**
```bash
# Delete and reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

**Error: "TypeScript errors"**
```bash
# Check TypeScript configuration
npm run type-check
# Fix errors shown
```

**Error: "Prisma client not generated"**
```bash
npm run db:generate
```

### Authentication Not Working

**Google OAuth fails:**
1. Check `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`
2. Verify redirect URI in Google Console matches exactly
3. Check `NEXTAUTH_URL` matches your domain
4. Ensure `NEXTAUTH_SECRET` is set

**"Not authenticated" errors:**
1. Check browser cookies enabled
2. Clear browser cache
3. Check if middleware is blocking route
4. Verify SessionProvider is wrapping app

### Database Issues

**Connection fails:**
1. Check `DATABASE_URL` format
2. Verify database is running
3. Check firewall/network settings
4. Test connection with Prisma Studio

**Schema out of sync:**
```bash
# Reset database (WARNING: deletes data!)
npm run db:push -- --force-reset

# Or create migration
npm run db:migrate
```

### Backend API Issues

**CORS errors:**
1. Check `ALLOWED_ORIGINS` includes frontend URL
2. Ensure no trailing slash in URL
3. Check browser console for actual error

**Rate limit hit:**
1. Increase limit in `backend/main.py`
2. Or wait 1 minute
3. Consider per-user rate limiting

### Stripe Issues

**Webhook not receiving events:**
1. Check webhook URL is correct
2. Verify `STRIPE_WEBHOOK_SECRET`
3. Test with Stripe CLI:
```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

**Payment not updating credits:**
1. Check webhook logs in Stripe Dashboard
2. Verify transaction created in database
3. Check server logs for errors

---

## 📚 Additional Resources

### Documentation
- [Next.js Docs](https://nextjs.org/docs)
- [Prisma Docs](https://www.prisma.io/docs)
- [NextAuth.js Docs](https://next-auth.js.org/)
- [Stripe Docs](https://stripe.com/docs)
- [FastAPI Docs](https://fastapi.tiangolo.com/)

### Support
- Check existing GitHub issues
- Review error logs carefully
- Test in local development first
- Ask in project discussions

---

## ✨ Success Criteria

Your app is **production ready** when:

- ✅ All tests pass (`npm run test:ci`)
- ✅ Build completes without errors (`npm run build`)
- ✅ TypeScript check passes (`npm run type-check`)
- ✅ ESLint passes (`npm run lint`)
- ✅ All environment variables set
- ✅ Database schema applied
- ✅ Google OAuth configured
- ✅ Stripe configured and tested
- ✅ Health checks return healthy
- ✅ Manual testing checklist complete
- ✅ Deployed to production
- ✅ Monitoring configured

---

## 🎉 You're Ready!

If you've completed all steps above, your application is:

- ✅ Secure and protected
- ✅ Performant and optimized
- ✅ Monitored and observable
- ✅ Tested and reliable
- ✅ Production-grade quality

**Next Steps:**
1. Complete final testing
2. Deploy to production
3. Monitor for first 24 hours
4. Gather user feedback
5. Iterate and improve

Good luck with your launch! 🚀
