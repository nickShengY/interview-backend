# Database Migration Instructions

## Critical: MBTI Field Name Fix

The database schema has been updated to fix a field name mismatch. You **MUST** run this migration before the application will work correctly.

---

## What Changed?

**Schema Update:**
- **Old field name:** `istp` (wrong)
- **New field name:** `mbti` (correct)

This change affects:
- User profile storage
- Profile API endpoints
- Frontend components

---

## Step-by-Step Migration

### 1. Backup Your Database (Recommended)
```bash
# For PostgreSQL
pg_dump your_database_name > backup_$(date +%Y%m%d_%H%M%S).sql

# Or use your database provider's backup tool
```

### 2. Run Prisma Migration
```bash
# Navigate to project root
cd c:\Projects\ats-interview-app

# Create and apply migration
npx prisma migrate dev --name fix_mbti_field_name

# This will:
# - Create a new migration file
# - Apply the schema change to your database
# - Rename the column from 'istp' to 'mbti'
```

### 3. Generate Prisma Client
```bash
npx prisma generate
```

### 4. Verify Migration
```bash
# Open Prisma Studio to check the change
npx prisma studio

# Check that User model now has 'mbti' field (not 'istp')
```

---

## Expected Migration Output

You should see output similar to:
```
Environment variables loaded from .env
Prisma schema loaded from prisma\schema.prisma
Datasource "db": PostgreSQL database "...", schema "public"

Applying migration `20250122_fix_mbti_field_name`

The following migration(s) have been applied:

migrations/
  └─ 20250122_fix_mbti_field_name/
      └─ migration.sql

Your database is now in sync with your schema.

✔ Generated Prisma Client (5.x.x) to .\node_modules\@prisma\client
```

---

## What Happens During Migration?

The migration will execute SQL similar to:
```sql
ALTER TABLE "User" RENAME COLUMN "istp" TO "mbti";
```

**Data Safety:** This is a simple column rename. All existing data will be preserved!

---

## Troubleshooting

### Error: "Column 'istp' does not exist"
**Cause:** Database already has the correct field name  
**Solution:** Your database might already be correct. Check with:
```bash
npx prisma db pull
# If schema shows 'mbti', you're good!
```

### Error: "Database is not in sync"
**Solution:** Reset and re-migrate (⚠️ THIS WILL DELETE DATA):
```bash
npx prisma migrate reset
npx prisma migrate dev
```

### Error: "Can't reach database server"
**Check:**
1. Is PostgreSQL running?
2. Is DATABASE_URL in .env correct?
3. Can you connect with `npx prisma studio`?

---

## Post-Migration Verification

### 1. Check Database Schema
```bash
npx prisma studio
# Navigate to User model
# Verify 'mbti' field exists
```

### 2. Test in Application
1. Start the app: `npm run dev`
2. Go to `/profile`
3. Edit MBTI personality type
4. Save changes
5. Refresh page
6. Verify MBTI is persisted

### 3. Check API Response
```bash
# With auth token
curl http://localhost:3000/api/user/profile

# Should return JSON with 'mbti' field
```

---

## If You Have Production Data

### Option 1: Safe Migration (Recommended)
```bash
# 1. Test on development database first
npx prisma migrate dev --name fix_mbti_field_name

# 2. Review generated SQL in migrations folder

# 3. Deploy to production
npx prisma migrate deploy
```

### Option 2: Manual Migration
If you prefer manual control:

```sql
-- Run directly in your database
BEGIN;

-- Rename the column
ALTER TABLE "User" RENAME COLUMN "istp" TO "mbti";

-- Update Prisma migration tracking
-- (or run: npx prisma migrate resolve --applied fix_mbti_field_name)

COMMIT;
```

---

## Production Deployment

When deploying to production:

```bash
# Don't use 'migrate dev' in production!
# Use 'migrate deploy' instead:

npx prisma migrate deploy
```

This command:
- ✅ Only applies pending migrations
- ✅ Doesn't prompt for input
- ✅ Safe for CI/CD pipelines
- ✅ Doesn't create new migrations

---

## Rollback (If Needed)

If something goes wrong:

### 1. Restore from Backup
```bash
# PostgreSQL
psql your_database_name < backup_file.sql
```

### 2. Revert Code Changes
```bash
git checkout HEAD~1 prisma/schema.prisma
npx prisma generate
```

### 3. Manual Rollback
```sql
ALTER TABLE "User" RENAME COLUMN "mbti" TO "istp";
```

---

## Quick Reference

```bash
# Standard workflow
npx prisma migrate dev --name fix_mbti_field_name
npx prisma generate
npm run dev

# Production workflow  
npx prisma migrate deploy
npm run build
npm start
```

---

## Additional Resources

- [Prisma Migrate Docs](https://www.prisma.io/docs/concepts/components/prisma-migrate)
- [Database Schema Reference](https://www.prisma.io/docs/reference/api-reference/prisma-schema-reference)
- [Migration Troubleshooting](https://www.prisma.io/docs/guides/migrate/prototyping-schema-db-push)

---

**⚠️ IMPORTANT:** Do not proceed with testing the application until this migration is complete!
