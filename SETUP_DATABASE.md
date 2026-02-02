# Quick Database Setup Guide

## Option 1: Neon (Recommended - FREE, 5 minutes)

### Step 1: Create Neon Account
1. Go to https://neon.tech
2. Sign up with GitHub/Google
3. Click "Create Project"
4. Name: `ats-interview-db`
5. Region: Choose closest to you
6. Click "Create"

### Step 2: Get Connection String
1. After project creation, you'll see the connection string
2. Click "Copy" on the connection string
3. It looks like:
   ```
   postgresql://username:password@ep-xxx.region.aws.neon.tech/dbname?sslmode=require
   ```

### Step 3: Update .env
```env
DATABASE_URL="your-neon-connection-string-here"
```

### Step 4: Run Migration
```bash
npx prisma migrate dev --name fix_mbti_field_name
npx prisma generate
```

### Step 5: Verify
```bash
npx prisma studio
# Should open browser showing your database
```

**Done! Your database is ready.**

---

## Option 2: Supabase (Also FREE)

### Step 1: Create Supabase Project
1. Go to https://supabase.com
2. Sign up and create new project
3. Wait 2-3 minutes for database provisioning

### Step 2: Get PostgreSQL Connection String
1. Go to Project Settings → Database
2. Scroll to "Connection string"
3. Select "URI" tab (NOT "Supabase" tab!)
4. Copy the connection string
5. Replace `[YOUR-PASSWORD]` with your database password

### Step 3: Update .env
```env
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.xxx.supabase.co:5432/postgres"
```

### Step 4: Run Migration
```bash
npx prisma migrate dev --name fix_mbti_field_name
npx prisma generate
```

---

## Option 3: Local Docker (For Development)

### Step 1: Install Docker Desktop
- Download from https://www.docker.com/products/docker-desktop

### Step 2: Start PostgreSQL
```bash
docker run --name ats-postgres \
  -e POSTGRES_PASSWORD=mypassword \
  -e POSTGRES_DB=ats_interview_db \
  -p 5432:5432 \
  -d postgres:15
```

### Step 3: Update .env
```env
DATABASE_URL="postgresql://postgres:mypassword@localhost:5432/ats_interview_db?schema=public"
```

### Step 4: Run Migration
```bash
npx prisma migrate dev --name fix_mbti_field_name
npx prisma generate
```

---

## Why PostgreSQL is Perfect for This App

### ✅ Your App Needs:
1. **User Accounts** → PostgreSQL relations
2. **Credit System** → ACID transactions (atomic credit deduction)
3. **Payment History** → Complex joins and queries
4. **Stripe Integration** → Webhooks need reliable transactions
5. **Interview History** → Efficient querying with indexes

### ❌ Why NOT Firestore:
- No built-in transactions (would need manual handling)
- Complex queries are harder
- No Prisma type safety
- Stripe integration more complex
- Would need to rewrite entire codebase

### ✅ Why PostgreSQL:
- Prisma already configured
- Perfect for your data model
- Free tier available everywhere
- Excellent TypeScript support
- Battle-tested for payments/credits

---

## Troubleshooting

### Error: "Can't reach database server"
- Check if connection string is correct
- For Neon/Supabase: Ensure you copied the full string
- For Docker: Ensure container is running (`docker ps`)

### Error: "SSL connection required"
Add `?sslmode=require` to end of connection string:
```env
DATABASE_URL="postgresql://user:pass@host/db?sslmode=require"
```

### Error: "Database does not exist"
- For cloud providers: Database is created automatically
- For local: Run `CREATE DATABASE ats_interview_db;` in psql

---

## Next Steps After Setup

1. ✅ Database connected
2. ✅ Migration run
3. ✅ Prisma generated
4. 🚀 Start app: `pnpm dev`
5. 🔐 Set up Google OAuth
6. 💳 Configure Stripe keys
7. 🤖 Add Google AI API key

---

## Production Deployment

When deploying to Vercel/Netlify:
1. Use Neon/Supabase (free tier works)
2. Add DATABASE_URL to environment variables
3. Run `npx prisma generate` in build command
4. Deploy!

**Your production database is ready to scale.**
