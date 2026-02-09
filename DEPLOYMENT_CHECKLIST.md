# Production Deployment Checklist

**Project:** Interview Pro - ATS & Career Advancement Platform
**Last Updated:** 2026-01-14

Use this checklist before deploying to production to ensure all critical items are addressed.

---

## Pre-Deployment (1-2 Weeks Before Launch)

### 🔒 Security

- [ ] Run `npm audit` and fix all critical/high vulnerabilities
- [ ] Run `pip-audit` (backend) and fix vulnerabilities
- [ ] Implement Content Security Policy (CSP) headers
- [ ] Add file upload magic byte verification ([lib/file-security.ts](lib/file-security.ts))
- [ ] Enable HTTPS/TLS everywhere (enforce HSTS)
- [ ] Rotate all API keys and secrets
- [ ] Move secrets to cloud secret manager (Google Cloud Secret Manager / AWS Secrets Manager)
- [ ] Add rate limiting to all API endpoints
- [ ] Verify CORS configuration for production domains only
- [ ] Test authentication flows (login, logout, session expiry)
- [ ] Verify user isolation (can't access other users' data)
- [ ] Add CSRF protection for state-changing operations
- [ ] Review and sanitize all user inputs
- [ ] Set up Web Application Firewall (WAF) - optional but recommended

### 🗄️ Database

- [ ] Set up automated daily backups
- [ ] Test database restore procedure
- [ ] Create read replicas (if high traffic expected)
- [ ] Add database connection pooling (if not already configured)
- [ ] Verify all indexes are created (`npx prisma db push`)
- [ ] Set up database monitoring/alerts
- [ ] Plan for database scaling (vertical/horizontal)
- [ ] Document database migration procedure

### ☁️ Infrastructure

- [ ] Choose hosting provider (Vercel, Railway, AWS, etc.)
- [ ] Set up production environment
- [ ] Configure environment variables in production
- [ ] Set up custom domain + SSL certificate
- [ ] Configure DNS records
- [ ] Set up CDN for static assets (if needed)
- [ ] Configure auto-scaling rules
- [ ] Set up load balancer (if multi-instance)
- [ ] Plan disaster recovery procedure

### 📊 Monitoring & Logging

- [ ] Set up error tracking (Sentry, Rollbar, etc.)
- [ ] Configure structured logging (JSON format to cloud logging)
- [ ] Set up uptime monitoring (Pingdom, UptimeRobot, etc.)
- [ ] Configure performance monitoring (New Relic, Datadog, etc.)
- [ ] Set up alerts for critical errors
- [ ] Create dashboard for key metrics (credits usage, API calls, errors)
- [ ] Set up log retention policy
- [ ] Configure alerting thresholds

### 🧪 Testing

- [ ] All unit tests passing (`npm test`)
- [ ] All backend tests passing (`cd backend && pytest`)
- [ ] All E2E tests passing (`npx playwright test`)
- [ ] Load testing completed (Artillery, k6, etc.)
- [ ] Security testing completed (OWASP ZAP, Burp Suite)
- [ ] Cross-browser testing (Chrome, Firefox, Safari, Edge)
- [ ] Mobile responsiveness verified
- [ ] Accessibility audit completed (WCAG 2.1 AA)

### 📝 Documentation

- [ ] Update README.md with production setup
- [ ] Document all environment variables
- [ ] Create runbook for common incidents
- [ ] Document backup/restore procedures
- [ ] Create architecture diagram
- [ ] Document API endpoints (Swagger/OpenAPI)
- [ ] Write user guide / FAQ
- [ ] Create admin guide

### 💳 Payments (Stripe)

- [ ] Switch from test mode to live mode
- [ ] Verify webhook endpoints are configured
- [ ] Test live payment flow (small transaction)
- [ ] Set up webhook signature verification
- [ ] Configure tax settings (if applicable)
- [ ] Set up refund policy
- [ ] Test subscription cancellation flow
- [ ] Enable fraud prevention (Stripe Radar)

### 🔑 API Keys & Secrets

- [ ] Google API Key (Gemini) - production key with rate limits
- [ ] Firebase Admin SDK credentials - production project
- [ ] Stripe keys - live mode keys
- [ ] Database connection string - production DB
- [ ] NextAuth secret - strong random value
- [ ] All secrets stored in secret manager (not `.env` files)
- [ ] Verify no secrets in git history
- [ ] Set up key rotation schedule

### 📧 Email & Notifications

- [ ] Configure email service (SendGrid, AWS SES, etc.) - if applicable
- [ ] Test welcome email flow - if applicable
- [ ] Test password reset email - if applicable
- [ ] Set up transactional email templates
- [ ] Verify SPF/DKIM/DMARC records for email domain
- [ ] Test notification system (push, email, etc.)

---

## Deployment Day

### 🚀 Deployment Steps

1. **Final Code Review**
   - [ ] Review all changes since last deployment
   - [ ] Check for TODO/FIXME comments
   - [ ] Verify version number updated

2. **Pre-Deployment Checks**
   - [ ] All tests passing
   - [ ] No known critical bugs
   - [ ] Staging environment tested
   - [ ] Database migrations ready (if any)
   - [ ] Rollback plan documented

3. **Deploy Frontend**
   ```bash
   # Vercel example
   vercel --prod

   # Or Railway
   railway up --environment production
   ```
   - [ ] Build succeeds
   - [ ] Environment variables set
   - [ ] Domain configured

4. **Deploy Backend**
   ```bash
   # Railway example
   cd backend
   railway up --environment production

   # Or Docker
   docker build -t interview-pro-backend .
   docker push <registry>/interview-pro-backend:latest
   ```
   - [ ] Build succeeds
   - [ ] Health check passes (`/health` endpoint)
   - [ ] Connected to production database

5. **Run Database Migrations**
   ```bash
   npx prisma migrate deploy
   ```
   - [ ] Migrations succeed
   - [ ] No data loss
   - [ ] Indexes created

6. **Smoke Tests**
   - [ ] Homepage loads
   - [ ] Login works
   - [ ] ATS scan works (test with sample resume)
   - [ ] Interview practice works
   - [ ] Credits system works
   - [ ] Payments work (test transaction)
   - [ ] All critical paths working

7. **Post-Deployment Monitoring**
   - [ ] Check error rates in Sentry
   - [ ] Monitor server CPU/memory usage
   - [ ] Check database connection pool
   - [ ] Verify API response times < 200ms (non-AI endpoints)
   - [ ] Monitor for any spikes in traffic

---

## Post-Deployment (First Week)

### 📈 Monitoring

- [ ] Daily review of error logs
- [ ] Monitor user sign-up rate
- [ ] Track credit usage patterns
- [ ] Check API rate limiting effectiveness
- [ ] Monitor database query performance
- [ ] Review security logs for suspicious activity
- [ ] Track user feedback / support tickets

### 🐛 Bug Triage

- [ ] Set up bug tracking system (GitHub Issues, Jira, etc.)
- [ ] Prioritize reported bugs (P0: Critical, P1: High, P2: Medium, P3: Low)
- [ ] Fix critical bugs within 24 hours
- [ ] Plan hotfix deployment process

### 📊 Analytics

- [ ] Set up Google Analytics or equivalent
- [ ] Track key user journeys (funnel analysis)
- [ ] Monitor conversion rates (sign-up → paid user)
- [ ] Track feature usage (which features are most popular?)
- [ ] Set up A/B testing infrastructure (if planned)

### 🔄 Optimization

- [ ] Review slow API endpoints (>500ms)
- [ ] Optimize database queries (add indexes if needed)
- [ ] Review and optimize bundle size
- [ ] Set up caching where appropriate
- [ ] Monitor CDN hit rates

---

## Environment Variables Checklist

### Production Environment Variables

**Frontend (.env.production):**
```bash
# Database
DATABASE_URL=postgresql://user:pass@prod-db-host/db_name

# Auth
NEXTAUTH_SECRET=<strong-random-secret-50+chars>
NEXTAUTH_URL=https://your-production-domain.com

# Firebase
NEXT_PUBLIC_FIREBASE_API_KEY=<prod-firebase-api-key>
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=<prod-project>.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=<prod-project-id>
FIREBASE_PROJECT_ID=<prod-project-id>
FIREBASE_CLIENT_EMAIL=<service-account>@<project>.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="<private-key-from-secret-manager>"

# Google OAuth
GOOGLE_CLIENT_ID=<prod-oauth-client-id>
GOOGLE_CLIENT_SECRET=<prod-oauth-secret>

# AI (OpenRouter)
OPENROUTER_API_KEY=<prod-openrouter-api-key>
# Optional attribution headers
# OPENROUTER_APP_URL=https://your-production-domain.com
# OPENROUTER_APP_NAME=Interview Pro

# Stripe
STRIPE_SECRET_KEY=sk_live_<live-key>
STRIPE_WEBHOOK_SECRET=whsec_<webhook-secret>
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_<live-key>
STRIPE_PRICE_PRO=price_<pro-price-id>
STRIPE_PRICE_ULTRA=price_<ultra-price-id>

# Backend API
NEXT_PUBLIC_ATS_API=https://backend.your-domain.com

# Feature Flags (optional)
NEXT_PUBLIC_ENABLE_STRIPE=true
NEXT_PUBLIC_ENABLE_ANALYTICS=true
```

**Backend (.env):**
```bash
# API Key
OPENROUTER_API_KEY=<prod-openrouter-api-key>
# Optional attribution headers
# OPENROUTER_APP_URL=https://your-production-domain.com
# OPENROUTER_APP_NAME=Interview Pro

# SBERT (optional)
SBERT_API_URL=<sbert-service-url>
```

### Verify Environment Variables
- [ ] All required variables set in production
- [ ] No hardcoded secrets in code
- [ ] Secrets stored in secret manager (not `.env` files in production)
- [ ] Development/staging variables different from production
- [ ] Keys have appropriate rate limits/quotas configured

---

## Rollback Plan

If deployment fails or critical issues arise:

### Quick Rollback Steps

1. **Revert Frontend**
   ```bash
   # Vercel: rollback to previous deployment
   vercel rollback <deployment-url>

   # Railway: redeploy previous version
   railway up --environment production --service frontend <previous-commit>
   ```

2. **Revert Backend**
   ```bash
   # Docker: deploy previous image
   docker pull <registry>/interview-pro-backend:<previous-tag>
   docker deploy ...

   # Railway:
   railway up --environment production --service backend <previous-commit>
   ```

3. **Revert Database Migrations** (if needed)
   ```bash
   # Prisma doesn't support automatic rollback
   # Manual SQL rollback required - see migration file
   psql $DATABASE_URL < rollback-script.sql
   ```

4. **Notify Users**
   - [ ] Post status update (status page)
   - [ ] Send notification to active users (if applicable)
   - [ ] Update social media (if applicable)

### Post-Rollback
- [ ] Investigate root cause
- [ ] Fix issue in development
- [ ] Test fix in staging
- [ ] Plan new deployment

---

## Production Readiness Scoring

Score each category 0-10:

| Category | Score | Notes |
|----------|-------|-------|
| Security | __/10 | Critical items from audit addressed? |
| Testing | __/10 | All tests passing? Load tested? |
| Monitoring | __/10 | Errors tracked? Uptime monitored? |
| Database | __/10 | Backups configured? Indexes created? |
| Documentation | __/10 | Runbooks ready? Env vars documented? |
| Performance | __/10 | Load tested? Optimized? |
| Infrastructure | __/10 | Auto-scaling? Redundancy? |

**Minimum Passing Score:** 60/70 (85%)

**Recommendation:**
- **70+:** Ready for production ✅
- **60-69:** Acceptable with minor gaps ⚠️
- **<60:** Not ready - address critical items ❌

---

## Emergency Contacts

Ensure these are documented and accessible:

- **On-Call Engineer:** [Name, Phone, Email]
- **Database Admin:** [Name, Phone, Email]
- **DevOps Lead:** [Name, Phone, Email]
- **Security Contact:** [Name, Phone, Email]

**Escalation Path:**
1. On-Call Engineer (responds within 15 min)
2. Team Lead (responds within 30 min)
3. CTO/Engineering Manager (responds within 1 hour)

---

## Launch Day Communication

- [ ] Announce launch on company channels
- [ ] Post on social media (if applicable)
- [ ] Send email to beta users / waitlist (if applicable)
- [ ] Update status page: "All systems operational"
- [ ] Monitor feedback channels (Twitter, email, support)
- [ ] Prepare for traffic spike (capacity planning)

---

## Week 1 Retrospective

After first week in production:

- [ ] Review metrics (users, errors, performance)
- [ ] Gather user feedback
- [ ] Identify top 3 issues
- [ ] Plan improvements for week 2
- [ ] Update this checklist with lessons learned

---

## Compliance & Legal (if applicable)

- [ ] Privacy Policy published
- [ ] Terms of Service published
- [ ] GDPR compliance verified (if serving EU users)
- [ ] CCPA compliance verified (if serving CA users)
- [ ] Cookie consent implemented
- [ ] Data retention policy documented
- [ ] User data deletion process implemented

---

## Success Metrics

Define success criteria for launch:

**Week 1 Targets:**
- [ ] Uptime > 99.5%
- [ ] Error rate < 0.1%
- [ ] Average API response time < 200ms (non-AI)
- [ ] User sign-ups: ___ (set target)
- [ ] Revenue: ___ (set target, if applicable)

**Week 4 Targets:**
- [ ] Uptime > 99.9%
- [ ] Error rate < 0.05%
- [ ] Monthly Active Users: ___
- [ ] Customer Satisfaction Score: > 4.0/5.0

---

**Good luck with your deployment! 🚀**

Remember: It's better to delay launch by a day to fix critical issues than to rush and have downtime/security incidents.

**Deployment Sign-Off:**

- [ ] Engineering Lead Approval: _________________ Date: _______
- [ ] Security Review Complete: _________________ Date: _______
- [ ] QA Sign-Off: _________________ Date: _______
- [ ] Product Owner Approval: _________________ Date: _______

---

**Post-Launch:** Update this checklist with any lessons learned for future deployments.
