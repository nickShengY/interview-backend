# 🔥 Firebase Migration Guide

## Complete migration from NextAuth → Firebase Authentication

This guide covers migrating your ATS Interview App to use Firebase for authentication, deployment, and backend services while keeping Neon for the database.

---

## 📋 Architecture Overview

### What Changed:
- ❌ **Removed:** NextAuth, Google OAuth via NextAuth, Stripe payments, Vercel deployment
- ✅ **Added:** Firebase Authentication, Firebase Admin SDK, Firebase Hosting, Demo User System
- ✅ **Kept:** Neon PostgreSQL database, Prisma ORM, Google Gemini AI, Python FastAPI backend

### New Stack:
- **Frontend:** Next.js 15 (App Router)
- **Auth:** Firebase Authentication
- **Database:** Neon PostgreSQL (serverless)
- **Deployment:** Firebase Hosting
- **Backend:** Firebase Functions + Python FastAPI (deployed separately)
- **AI:** Google Gemini API

---

## 🚀 Step 1: Install Firebase Packages

```bash
# Install Firebase dependencies
npm install firebase firebase-admin

# Remove old dependencies (optional cleanup)
npm uninstall next-auth @next-auth/prisma-adapter stripe
```

---

## 🔑 Step 2: Set Up Firebase Project

### A. Create Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add Project"
3. Name it: `interview-plus` or your preferred name
4. Disable Google Analytics (optional)
5. Click "Create Project"

### B. Enable Authentication
1. In Firebase Console → **Authentication**
2. Click "Get Started"
3. Enable sign-in methods:
   - ✅ **Email/Password** (for regular users)
   - ✅ **Google** (OAuth provider)
   - ⚠️ Demo user works without these!

### C. Get Firebase Config (Client-side)
1. Go to **Project Settings** (gear icon)
2. Scroll to "Your apps" → Click web icon (</>)
3. Register app: `interview-plus-web`
4. Copy the config object and update `.env`:

```bash
NEXT_PUBLIC_FIREBASE_API_KEY="AIzaSy..."
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="your-project.firebaseapp.com"
NEXT_PUBLIC_FIREBASE_PROJECT_ID="your-project-id"
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="your-project.appspot.com"
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="123456789"
NEXT_PUBLIC_FIREBASE_APP_ID="1:123456789:web:abc..."
```

### D. Get Firebase Admin SDK (Server-side)
1. Go to **Project Settings** → **Service Accounts**
2. Click "Generate new private key"
3. Download the JSON file
4. Extract values and add to `.env`:

```bash
FIREBASE_PROJECT_ID="your-project-id"
FIREBASE_CLIENT_EMAIL="firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com"
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIE...\n-----END PRIVATE KEY-----"
```

**⚠️ Important:** Replace `\n` in the private key with actual newlines or keep them escaped.

---

## 🎭 Step 3: Demo User System

### How It Works:
- **Email:** `demo@interview-plus.app`
- **Password:** `Demo123!`
- **Credits:** 1000 (unlimited for testing)
- **Plan:** ULTRA (full access)
- **Bypass:** No Firebase auth needed

### Usage:
The demo user is automatically created in the database on first login. Users can test all features without signing up!

---

## 🔄 Step 4: Update Prisma Schema

Your existing Prisma schema works with Firebase! The `User` model uses Firebase UID as the ID.

**No changes needed** - Firebase UIDs are strings just like NextAuth IDs.

```bash
# Regenerate Prisma Client
npx prisma generate

# Push schema to Neon
npx prisma db push
```

---

## 🏗️ Step 5: Deploy to Firebase

### A. Install Firebase CLI
```bash
npm install -g firebase-tools
```

### B. Login and Initialize
```bash
# Login to Firebase
firebase login

# Initialize project (in your app directory)
firebase init

# Select:
# ✅ Hosting
# ✅ Functions (optional)
# ? Use existing project: YES
# ? Select your Firebase project
# ? Public directory: .next
# ? Configure as single-page app: NO
# ? Set up automatic builds: NO
```

### C. Update `.firebaserc`
```json
{
  "projects": {
    "default": "your-firebase-project-id"
  }
}
```

### D. Build and Deploy
```bash
# Build Next.js
npm run build

# Deploy to Firebase
firebase deploy
```

Your app will be live at: `https://your-project-id.web.app`

---

## 🛡️ Step 6: Implement Auth Components (TODO)

You'll need to create auth UI components. Here's what's needed:

### Files to Create:
1. `components/firebase-auth/login-form.tsx` - Login with email/password or Google
2. `components/firebase-auth/signup-form.tsx` - User registration
3. `components/firebase-auth/auth-provider.tsx` - Context provider
4. `app/api/auth/verify/route.ts` - Server-side token verification
5. `middleware.ts` - Protect routes

### Basic Auth Flow:
1. User logs in → Get Firebase ID token
2. Send token to server → Verify with Firebase Admin SDK
3. Create/update user in Neon database
4. Store token in cookie/local storage
5. Protected routes check token validity

---

## 🔧 Step 7: Update Environment Variables

### Development (`.env.local`):
```bash
# Database
DATABASE_URL="postgresql://neondb_owner:xxx@ep-xxx-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require"

# Firebase (Client)
NEXT_PUBLIC_FIREBASE_API_KEY="AIzaSy..."
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="your-project.firebaseapp.com"
NEXT_PUBLIC_FIREBASE_PROJECT_ID="your-project-id"
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="your-project.appspot.com"
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="123456789"
NEXT_PUBLIC_FIREBASE_APP_ID="1:123456789:web:abc..."

# Firebase (Server)
FIREBASE_PROJECT_ID="your-project-id"
FIREBASE_CLIENT_EMAIL="firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com"
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIE...\n-----END PRIVATE KEY-----"

# OpenRouter AI
OPENROUTER_API_KEY="your-openrouter-api-key"
# Optional attribution headers
# OPENROUTER_APP_URL="https://yourdomain.com"
# OPENROUTER_APP_NAME="Interview Pro"

# Backend API
NEXT_PUBLIC_ATS_API="http://localhost:8000"
```

### Production (Firebase Hosting Environment):
```bash
# Set environment variables in Firebase
firebase functions:config:set \
  database.url="postgresql://..." \
  firebase.project_id="your-project-id" \
  firebase.client_email="..." \
  firebase.private_key="..." \
  google.api_key="..."
```

---

## 🔍 Step 8: Testing

### A. Test Demo User
```bash
# Start dev server
npm run dev

# Navigate to login page
# Email: demo@interview-plus.app
# Password: Demo123!
```

### B. Test Firebase Auth
1. Sign up with email/password
2. Sign in with Google
3. Check Neon database for new user
4. Verify credits (10 for new users)

### C. Test Features
- ✅ ATS Scanner
- ✅ Technical Interview
- ✅ Behavioral Interview
- ✅ Cover Letter Generator
- ✅ Textbook Learning (UI)
- ✅ Credit system

---

## 📦 Step 9: Deploy Python Backend

Your Python FastAPI backend needs to be deployed separately:

### Option A: Firebase Functions (Python)
```bash
# Create functions directory
mkdir -p functions/python

# Copy backend files
cp -r backend/* functions/python/

# Deploy
firebase deploy --only functions
```

### Option B: Google Cloud Run (Recommended)
```bash
# Build Docker image
docker build -t gcr.io/your-project-id/ats-backend ./backend

# Push to Container Registry
docker push gcr.io/your-project-id/ats-backend

# Deploy to Cloud Run
gcloud run deploy ats-backend \
  --image gcr.io/your-project-id/ats-backend \
  --platform managed \
  --region us-east1 \
  --allow-unauthenticated
```

### Option C: Railway/Render (Alternative)
Deploy your Python backend to Railway or Render and update:
```bash
NEXT_PUBLIC_ATS_API="https://your-backend.railway.app"
```

---

## 🔐 Security Best Practices

### 1. Environment Variables
- ✅ Never commit `.env` files
- ✅ Use GitHub Secrets for CI/CD
- ✅ Rotate Firebase private keys regularly

### 2. Firebase Security Rules
```javascript
// Firestore rules (if using Firestore)
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

### 3. Rate Limiting
Firebase automatically provides:
- DDoS protection
- Rate limiting on auth endpoints
- CORS handling

---

## 📊 Monitoring & Analytics

### Firebase Console Dashboards:
1. **Authentication** - User sign-ups, logins
2. **Hosting** - Traffic, bandwidth usage
3. **Performance** - Page load times
4. **Crashlytics** - Error tracking (add if needed)

### Optional: Add Google Analytics
```typescript
// lib/firebase/analytics.ts
import { getAnalytics } from 'firebase/analytics'
import app from './config'

export const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null
```

---

## 🐛 Troubleshooting

### Issue: "Firebase module not found"
**Solution:**
```bash
npm install firebase firebase-admin
```

### Issue: "Invalid private key"
**Solution:** Ensure `FIREBASE_PRIVATE_KEY` has proper newlines:
```bash
# In .env, escape newlines:
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIE...\n-----END PRIVATE KEY-----"
```

### Issue: "Authentication failed"
**Solution:** Check Firebase Console → Authentication is enabled

### Issue: "Demo user can't login"
**Solution:** Run:
```bash
npx prisma studio
# Check if demo user exists with email: demo@interview-plus.app
# If not, it will be auto-created on first attempt
```

### Issue: "Build fails on Firebase"
**Solution:** Check `firebase.json` public directory:
```json
{
  "hosting": {
    "public": ".next"
  }
}
```

---

## 🎯 Migration Checklist

- [ ] Install Firebase packages
- [ ] Create Firebase project
- [ ] Enable Authentication (Email, Google)
- [ ] Get client config (6 vars)
- [ ] Get admin SDK config (3 vars)
- [ ] Update `.env` with all Firebase vars
- [ ] Update `.firebaserc` with project ID
- [ ] Install Firebase CLI globally
- [ ] Run `firebase login`
- [ ] Test demo user login
- [ ] Test Firebase auth (email + Google)
- [ ] Deploy Python backend (Cloud Run/Railway)
- [ ] Build Next.js (`npm run build`)
- [ ] Deploy to Firebase (`firebase deploy`)
- [ ] Test production app
- [ ] Set up CI/CD (GitHub Actions)
- [ ] Monitor usage in Firebase Console

---

## 📚 Resources

- [Firebase Documentation](https://firebase.google.com/docs)
- [Firebase Authentication Guide](https://firebase.google.com/docs/auth/web/start)
- [Firebase Hosting Guide](https://firebase.google.com/docs/hosting)
- [Neon Database Docs](https://neon.tech/docs/introduction)
- [Next.js + Firebase Tutorial](https://firebase.google.com/docs/hosting/nextjs)

---

## 🎉 You're Done!

Your ATS Interview App now runs on:
- ✅ Firebase Authentication (with demo user!)
- ✅ Firebase Hosting (auto-scaling, CDN)
- ✅ Neon PostgreSQL (serverless database)
- ✅ Google Gemini AI (LLM)
- ✅ Python FastAPI (backend services)

**No NextAuth, no Stripe, no Vercel - pure Firebase + Neon!** 🔥

---

**Questions?** Check the troubleshooting section or reach out for help!
