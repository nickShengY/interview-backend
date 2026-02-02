# 🚀 Deployment Checklist

Use this checklist to ensure smooth deployment to production.

## Pre-Deployment Checklist

### Code Quality
- [ ] All tests pass: `npm run test:ci`
- [ ] Build succeeds: `npm run build`
- [ ] TypeScript check passes: `npm run type-check`
- [ ] ESLint passes: `npm run lint`
- [ ] No console errors in browser
- [ ] All features tested manually

### Environment Setup
- [ ] All environment variables documented in `.env.example`
- [ ] Production environment variables ready
- [ ] Secrets are different from development
- [ ] Database connection string updated for production
- [ ] OAuth redirect URIs updated for production domain
- [ ] Stripe webhook URL points to production

### Database
- [ ] Database created in production (Supabase/PlanetScale)
- [ ] Schema applied: `npm run db:push`
- [ ] Database connection tested
- [ ] Indexes verified
- [ ] Backup strategy in place

### Security
- [ ] All secrets rotated (don't use dev secrets in prod)
- [ ] CORS configured for production domain
- [ ] Rate limiting configured
- [ ] Security headers enabled
- [ ] HTTPS enforced
- [ ] No sensitive data in logs

### Third-Party Services
- [ ] Google OAuth configured for production domain
- [ ] Stripe configured with production keys
- [ ] Stripe products created
- [ ] Stripe webhook endpoint added
- [ ] Gemini API key has sufficient quota

---

## Deployment Steps

### 1. Deploy Database

**Supabase (Recommended):**
```bash
# 1. Create project at supabase.com
# 2. Get connection string from Settings -> Database
# 3. Update DATABASE_URL in your environment
# 4. Apply schema
npm run db:push
```

**PlanetScale:**
```bash
# 1. Create database at planetscale.com
# 2. Get connection string
# 3. Update DATABASE_URL
# 4. Apply schema
npm run db:migrate
```

### 2. Deploy Backend

**Railway:**
```bash
# 1. Create account at railway.app
# 2. New Project -> Deploy from GitHub
# 3. Select repository
# 4. Add environment variables:
#    - GOOGLE_API_KEY
#    - ALLOWED_ORIGINS
# 5. Settings:
#    - Root Directory: backend
#    - Start Command: uvicorn main:app --host 0.0.0.0 --port $PORT
```

**Render:**
```bash
# 1. Create account at render.com
# 2. New Web Service
# 3. Connect repository
# 4. Settings:
#    - Environment: Python 3
#    - Build: pip install -r requirements.txt
#    - Start: uvicorn main:app --host 0.0.0.0 --port $PORT
#    - Root Directory: backend
```

**Get Backend URL:** `https://your-backend.railway.app` or similar

### 3. Update OAuth Configuration

**Google Cloud Console:**
1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Select your project
3. APIs & Services -> Credentials
4. Edit OAuth 2.0 Client ID
5. Add to Authorized JavaScript origins:
   - `https://your-frontend.vercel.app`
6. Add to Authorized redirect URIs:
   - `https://your-frontend.vercel.app/api/auth/callback/google`
7. Save

### 4. Deploy Frontend

**Vercel (Recommended):**
```bash
# 1. Push to GitHub
git add .
git commit -m "Ready for production"
git push origin main

# 2. Import to Vercel
# - Go to vercel.com
# - New Project -> Import from GitHub
# - Select repository

# 3. Configure Project
# - Framework Preset: Next.js
# - Root Directory: ./
# - Build Command: npm run build
# - Output Directory: .next

# 4. Add Environment Variables
# Copy each variable from .env.local:
```

Environment variables to add:
```
DATABASE_URL
NEXTAUTH_URL (use Vercel URL)
NEXTAUTH_SECRET
GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET
GOOGLE_API_KEY
STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET
STRIPE_PRICE_PRO
STRIPE_PRICE_ULTRA
NEXT_PUBLIC_APP_URL (use Vercel URL)
NEXT_PUBLIC_ATS_API (use Railway/Render URL)
```

```bash
# 5. Deploy
# Click "Deploy" - takes ~3-5 minutes
```

### 5. Configure Stripe Webhook

**Stripe Dashboard:**
1. Go to [dashboard.stripe.com](https://dashboard.stripe.com)
2. Developers -> Webhooks
3. Add endpoint
4. Endpoint URL: `https://your-app.vercel.app/api/stripe/webhook`
5. Select events:
   - `checkout.session.completed`
6. Add endpoint
7. Copy signing secret (starts with `whsec_`)
8. Update `STRIPE_WEBHOOK_SECRET` in Vercel

**Test webhook:**
```bash
# Install Stripe CLI
stripe listen --forward-to https://your-app.vercel.app/api/stripe/webhook

# Create test payment
stripe trigger checkout.session.completed
```

### 6. Update Backend CORS

In your backend environment (Railway/Render):
```
ALLOWED_ORIGINS=https://your-app.vercel.app
```

Restart backend service.

---

## Post-Deployment Verification

### Automated Checks

```bash
# Frontend health
curl https://your-app.vercel.app/api/health

# Backend health  
curl https://your-backend.railway.app/health

# Expected response: {"status":"healthy",...}
```

### Manual Testing

#### Authentication Flow
1. [ ] Visit your production URL
2. [ ] Click "Sign In"
3. [ ] Sign in with Google
4. [ ] Redirected back to app
5. [ ] Profile shows your name/email
6. [ ] Sign out works

#### ATS Scanner
1. [ ] Navigate to ATS Scanner
2. [ ] Upload a resume (PDF)
3. [ ] Paste job description
4. [ ] Click "Start ATS Scan"
5. [ ] Results displayed
6. [ ] Generate cover letter works
7. [ ] Credits deducted

#### Interview Practice
1. [ ] Navigate to Technical Interview
2. [ ] Generate question
3. [ ] Submit answer
4. [ ] Get feedback
5. [ ] Credits deducted

#### Payments
1. [ ] Navigate to Profile
2. [ ] Click upgrade plan
3. [ ] Complete Stripe checkout (use test card: 4242 4242 4242 4242)
4. [ ] Redirected back to profile
5. [ ] Credits updated
6. [ ] Transaction shows in history

### Performance Checks

```bash
# Test page load speed
curl -w "@curl-format.txt" -o /dev/null -s https://your-app.vercel.app/

# Check Lighthouse score
# Open Chrome DevTools -> Lighthouse -> Run
# Target scores:
# - Performance: >90
# - Accessibility: >90
# - Best Practices: >90
# - SEO: >90
```

### Security Checks

```bash
# Check security headers
curl -I https://your-app.vercel.app/

# Should include:
# - X-Frame-Options: SAMEORIGIN
# - X-Content-Type-Options: nosniff
# - Referrer-Policy: origin-when-cross-origin
```

**SSL Certificate:**
- [ ] HTTPS works (padlock in browser)
- [ ] No mixed content warnings
- [ ] Certificate is valid

**CORS:**
```bash
# Should fail (blocked by CORS)
curl -X POST https://your-backend.railway.app/scan \
  -H "Origin: https://evil-site.com"

# Should succeed
curl -X GET https://your-backend.railway.app/health
```

---

## Monitoring Setup

### Error Tracking (Recommended)

**Sentry:**
```bash
npm install @sentry/nextjs
npx @sentry/wizard@latest -i nextjs
```

Add to `.env.local`:
```
NEXT_PUBLIC_SENTRY_DSN="your-sentry-dsn"
SENTRY_AUTH_TOKEN="your-auth-token"
```

### Analytics (Optional)

**Vercel Analytics:**
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

### Uptime Monitoring

**UptimeRobot (Free):**
1. Go to [uptimerobot.com](https://uptimerobot.com)
2. Add New Monitor
3. Monitor Type: HTTP(s)
4. URL: `https://your-app.vercel.app/api/health`
5. Monitoring Interval: 5 minutes
6. Alert Contacts: Your email

---

## Rollback Plan

If deployment fails:

### Frontend (Vercel)
1. Go to Vercel Dashboard
2. Deployments tab
3. Find last working deployment
4. Click "..." -> "Promote to Production"

### Backend (Railway/Render)
1. Go to project dashboard
2. Deployments tab
3. Select previous deployment
4. Click "Redeploy"

### Database
```bash
# If using migrations
npx prisma migrate resolve --rolled-back [migration-name]

# If using db push, restore from backup
# (This is why backups are important!)
```

---

## Troubleshooting

### Build Fails on Vercel

**Check build logs:**
1. Vercel Dashboard -> Project -> Deployments
2. Click failed deployment
3. View "Building" logs

**Common issues:**
- Missing environment variables
- TypeScript errors
- Missing dependencies
- Prisma client not generated

**Fix:**
```bash
# Ensure postinstall runs
"postinstall": "prisma generate"

# Add to package.json
"engines": {
  "node": ">=18.0.0"
}
```

### Authentication Not Working in Production

1. **Check OAuth redirect URIs:**
   - Must exactly match production URL
   - Include `/api/auth/callback/google`

2. **Check NEXTAUTH_URL:**
   ```
   NEXTAUTH_URL=https://your-app.vercel.app
   ```

3. **Check NEXTAUTH_SECRET:**
   - Must be set
   - Different from development

### Database Connection Fails

1. **Check connection string:**
   - Correct username/password
   - Correct host/port
   - Database exists

2. **Check network:**
   - Database allows connections from Vercel IPs
   - No firewall blocking

3. **Test connection:**
   ```bash
   npm run db:studio
   ```

### Stripe Webhook Not Working

1. **Check endpoint URL:**
   - Must be exact production URL
   - Include `/api/stripe/webhook`

2. **Check signing secret:**
   - Starts with `whsec_`
   - Matches webhook in Stripe Dashboard

3. **Test webhook:**
   ```bash
   # View webhook logs in Stripe Dashboard
   # Check for errors
   ```

---

## Production Maintenance

### Daily
- [ ] Check error logs (Sentry/Vercel)
- [ ] Monitor uptime (UptimeRobot)
- [ ] Check Stripe for new payments

### Weekly
- [ ] Review performance metrics
- [ ] Check database size/growth
- [ ] Review user feedback

### Monthly
- [ ] Update dependencies
- [ ] Rotate secrets (if needed)
- [ ] Review costs (Vercel/Railway/Stripe)
- [ ] Backup database

### Quarterly
- [ ] Security audit
- [ ] Performance optimization
- [ ] Feature planning
- [ ] User surveys

---

## Success! 🎉

If all checks pass, your application is:
- ✅ Deployed to production
- ✅ Fully functional
- ✅ Secure and monitored
- ✅ Ready for users

**Share your app with the world!** 🚀
