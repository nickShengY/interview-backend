# Neon Database Setup Guide

## What is Neon?

Neon is a **serverless PostgreSQL** database designed for modern applications with:
- ✅ **Auto-scaling storage** - Only pay for what you use
- ✅ **Branching** - Create instant database copies for development
- ✅ **Serverless architecture** - No connection pooling needed
- ✅ **Free tier** - 0.5 GB storage, 100 hours compute/month
- ✅ **Global edge network** - Low latency worldwide

Perfect for production deployment of our ATS Interview App!

## Setup Instructions

### 1. Create Neon Account
1. Go to [neon.tech](https://neon.tech)
2. Sign up with GitHub/Google
3. Create a new project

### 2. Get Connection String
After creating your project, Neon will provide a connection string:

```
postgresql://[user]:[password]@[endpoint].neon.tech/[dbname]?sslmode=require
```

### 3. Update Environment Variables

**Production (.env.production):**
```bash
DATABASE_URL="postgresql://user:password@ep-cool-morning-123456.us-east-2.aws.neon.tech/neondb?sslmode=require"
```

**Development (.env.local):**
```bash
# You can use Neon for development too, or keep local Postgres
DATABASE_URL="postgresql://localhost:5432/ats_dev"
```

### 4. Run Prisma Migrations

```bash
# Generate Prisma Client
npx prisma generate

# Push schema to Neon (for development)
npx prisma db push

# OR create and run migrations (for production)
npx prisma migrate dev --name add_textbook_learning

# Migrate production
npx prisma migrate deploy
```

### 5. Verify Connection

```bash
# Open Prisma Studio to view your data
npx prisma studio
```

## New Database Models Added

### 1. Question Deduplication
```prisma
model GeneratedQuestion {
  // Stores all generated interview questions
  // Prevents showing users duplicate questions
}
```

### 2. Textbook Learning System
```prisma
model Textbook {
  // Main textbook with chapters
}

model Flashcard {
  // Spaced repetition flashcards
  // Uses SuperMemo SM-2 algorithm
}

model Quiz {
  // Auto-generated quizzes
}
```

## Neon Features for Our App

### Auto-Scaling
- Storage scales from 0 GB to unlimited
- Compute scales based on active connections
- **Cost**: $0 for free tier, ~$20-40/month for production

### Branching
```bash
# Create a dev branch from production
neon branches create --name dev-feature-xyz

# Get branch connection string
neon connection-string dev-feature-xyz
```

### Connection Pooling (Built-in)
Neon handles connection pooling automatically - no need for external solutions like PgBouncer!

## Migration from Current Database

If you're migrating from another PostgreSQL database:

```bash
# 1. Backup current database
pg_dump $OLD_DATABASE_URL > backup.sql

# 2. Restore to Neon
psql $NEON_DATABASE_URL < backup.sql

# 3. Run new migrations
npx prisma migrate deploy
```

## Performance Optimization

### Indexes Added
- User queries: `@@index([userId, createdAt])`
- Question lookups: `@@index([userId, questionType])`
- Flashcard reviews: `@@index([userId, nextReview])`
- All foreign keys are indexed automatically

### Query Tips
```typescript
// Good: Use indexes
const questions = await prisma.generatedQuestion.findMany({
  where: { userId, questionType: 'TECH' },
  orderBy: { createdAt: 'desc' },
  take: 10
})

// Bad: Full table scan
const allQuestions = await prisma.generatedQuestion.findMany()
```

## Monitoring

Neon provides built-in monitoring:
- Query performance
- Storage usage
- Connection stats
- CPU/Memory metrics

Access via: [console.neon.tech](https://console.neon.tech)

## Cost Estimation

**Free Tier:**
- 0.5 GB storage
- 100 compute hours/month
- Perfect for development

**Pro Tier ($20/month):**
- 10 GB storage
- Unlimited compute hours
- Branching
- Auto-scaling

**Estimated for 1000 active users:**
- Storage: ~2-5 GB
- Compute: ~200 hours/month
- **Total cost**: ~$25-35/month

## Security

Neon provides:
- ✅ SSL/TLS encryption (required)
- ✅ Connection string credentials
- ✅ IP allowlisting (optional)
- ✅ Role-based access control

## Backup & Recovery

### Automatic Backups
- Point-in-time recovery (PITR)
- 7-day retention on free tier
- 30-day retention on paid plans

### Manual Backup
```bash
# Export database
pg_dump $DATABASE_URL > backup-$(date +%Y%m%d).sql

# Restore if needed
psql $DATABASE_URL < backup-20241107.sql
```

## Common Commands

```bash
# Check Neon CLI version
neon --version

# List projects
neon projects list

# List branches
neon branches list

# Get connection string
neon connection-string main

# Delete branch
neon branches delete dev-feature-xyz
```

## Troubleshooting

### Connection Issues
```bash
# Test connection
psql "$DATABASE_URL" -c "SELECT 1"
```

### Migration Errors
```bash
# Reset database (WARNING: Deletes all data)
npx prisma migrate reset

# Or manually fix
npx prisma migrate resolve --applied "migration_name"
```

### Performance Issues
- Check slow queries in Neon console
- Add missing indexes
- Use connection pooling (automatic in Neon)

## Next Steps

1. ✅ Create Neon account
2. ✅ Update DATABASE_URL
3. ✅ Run migrations: `npx prisma migrate deploy`
4. ✅ Test connection: `npx prisma studio`
5. ✅ Deploy to Vercel with Neon connection string

## Resources

- [Neon Documentation](https://neon.tech/docs)
- [Prisma + Neon Guide](https://neon.tech/docs/guides/prisma)
- [Neon Dashboard](https://console.neon.tech)
- [Connection String Format](https://neon.tech/docs/connect/connect-from-any-app)

---

**Ready to migrate?** Follow steps 1-5 above and you'll be live on Neon in minutes! 🚀
