# Deployment Notes - Learning System Update

## ⚠️ CRITICAL: Prisma Client Regeneration Required

The database schema has been significantly updated with new models and fields. **You MUST restart the development server** to regenerate the Prisma client.

### Current Lint Errors (Expected)
These errors will disappear after regenerating Prisma:
- `Property 'interviewSession' does not exist on type 'PrismaClient'`
- `Property 'userProgress' does not exist on type 'PrismaClient'`
- `sessionId does not exist in type QACreateInput`
- `chunkId does not exist in type FlashcardCreateInput`

### Steps to Deploy

#### 1. Stop Development Server
Press `Ctrl+C` in the terminal running `npm run dev`

#### 2. Regenerate Prisma Client
```bash
npx prisma generate
```

If you encounter Windows file lock errors, close any TypeScript language servers:
- In VS Code: Run "TypeScript: Restart TS Server" from command palette (Ctrl+Shift+P)
- Or simply close and reopen your IDE

#### 3. Push Database Changes
```bash
npx prisma db push
```

This will add the new tables:
- `UserProgress` - Track streaks and engagement
- `InterviewSession` - Track 5-question sets for rewards

And update existing tables:
- `QA` - Add `sessionId` field
- `Flashcard` - Add `chunkId`, `category`, `keyTerms`, `mnemonics`
- `User` - Add `progress` relation
- `Transaction` - Add `DAILY_CHECKIN` and `STREAK_BONUS` types

#### 4. Restart Development Server
```bash
npm run dev
```

#### 5. Verify Database Migration
Check that Prisma successfully created the new models:
```bash
npx prisma studio
```

You should see:
- UserProgress table
- InterviewSession table
- Updated Flashcard fields
- Updated QA fields

## 🧪 Testing Checklist

### Check-In System
- [ ] Navigate to home page
- [ ] See check-in streak component
- [ ] Click "Check In" button
- [ ] Verify credits awarded (5 base + streak bonus)
- [ ] Verify streak counter increments
- [ ] Try checking in again (should show "Already checked in")

### Interview Reward System
- [ ] Start technical interview
- [ ] Answer all 5 questions
- [ ] Verify spin wheel appears ONLY after question 5
- [ ] Spin wheel shows result (0, 5, or 100 credits)
- [ ] Credits update in FloatingCredits component
- [ ] Check transaction log shows REWARD type

### Enhanced Flashcard Generation
- [ ] Upload a textbook
- [ ] Generate flashcards
- [ ] Verify flashcards have:
  - `chunkId` (grouped concepts)
  - `category` (topic classification)
  - `keyTerms` array (important terms)
  - `mnemonics` (memory aids when applicable)

### Dynamic Reward Odds

Test with different user states:

**New User (first 3 sessions):**
- [ ] Complete interview set
- [ ] Higher chance of winning (65% vs 40%)

**Low Credits (<20):**
- [ ] Spend credits until below 20
- [ ] Complete interview set
- [ ] Higher chance of winning (60% vs 40%)

**Losing Streak (5+ losses):**
- [ ] Get 5+ "Try Again" results
- [ ] Complete another set
- [ ] Higher chance of winning (70% vs 40%)

## 📊 Database Monitoring

### Key Queries

**Check user engagement:**
```sql
SELECT 
  COUNT(*) as active_users,
  AVG(currentStreak) as avg_streak,
  MAX(longestStreak) as best_streak
FROM "UserProgress";
```

**Check reward distribution:**
```sql
SELECT 
  rewardAmount,
  COUNT(*) as sessions,
  ROUND(AVG(correctCount), 2) as avg_correct
FROM "InterviewSession"
WHERE completed = true
GROUP BY rewardAmount
ORDER BY rewardAmount;
```

**Check check-in stats:**
```sql
SELECT 
  DATE(lastCheckIn) as check_in_date,
  COUNT(*) as users,
  AVG(currentStreak) as avg_streak
FROM "UserProgress"
WHERE lastCheckIn > NOW() - INTERVAL '30 days'
GROUP BY DATE(lastCheckIn)
ORDER BY check_in_date DESC;
```

## 🔧 Configuration

### Environment Variables
Ensure these are set in `.env`:
```env
# Required for AI features
OPENROUTER_API_KEY=your_openrouter_api_key_here
# Optional attribution headers
# OPENROUTER_APP_URL=https://yourdomain.com
# OPENROUTER_APP_NAME=Interview Pro

# Database
DATABASE_URL=your_postgresql_url_here
```

### Credit Costs Reference
- Technical Interview (5 questions): 5 credits
- Behavioral Interview (5 questions): 5 credits
- Textbook Upload: 10 credits
- Generate Flashcards: 5 credits
- Generate Quiz: 5 credits

### Free Credit Sources
- New user bonus: 10 credits (initial)
- Daily check-in: 5 credits
- 3-day streak: +3 bonus
- 7-day streak: +20 bonus
- 30-day streak: +100 bonus
- Interview rewards: 0, 5, or 100 credits (session-based)

## 🚨 Troubleshooting

### "Property does not exist on PrismaClient"
**Cause:** Prisma client not regenerated
**Fix:** Run `npx prisma generate` and restart dev server

### "EPERM: operation not permitted" during generate
**Cause:** File lock from TypeScript server or running app
**Fix:** 
1. Stop dev server
2. Restart TypeScript server in IDE
3. Run generate again

### Check-in not working
**Check:**
1. UserProgress model created in database
2. API route `/api/user/checkin` accessible
3. Demo user or authenticated user available

### Rewards not appearing after 5 questions
**Check:**
1. InterviewSession model created
2. sessionId being passed in evaluation calls
3. Check browser console for errors
4. Verify spin wheel component receives rewardAmount

### Flashcards missing chunk data
**Check:**
1. Flashcard model updated with new fields
2. AI prompt generating chunked structure
3. API parsing chunks correctly
4. Database shows chunkId, category, keyTerms, mnemonics

## 📈 Performance Considerations

### Database Indexes
The schema includes indexes on:
- `UserProgress.userId` (unique lookup)
- `UserProgress.lastCheckIn` (streak queries)
- `InterviewSession.userId, completed` (user session history)
- `Flashcard.chunkId` (grouped retrieval)
- `Flashcard.category` (interleaved learning)

### API Rate Limiting
Consider adding rate limiting to:
- `/api/user/checkin` - Once per day per user
- `/api/interview/evaluate` - Prevent spam submissions
- Flashcard/quiz generation - Expensive AI calls

### Caching Strategy
Implement caching for:
- User progress stats (5-minute cache)
- Check-in status (until midnight)
- Session completion status (immutable once complete)

## 🎯 Next Steps

After successful deployment:

1. **Monitor Metrics:**
   - Daily active users
   - Check-in participation rate
   - Session completion rate
   - Credit purchase conversion

2. **A/B Test Reward Odds:**
   - Test different probability distributions
   - Measure impact on retention and revenue
   - Optimize for user satisfaction + profitability

3. **Gather User Feedback:**
   - Survey about streak system
   - Interview about learning effectiveness
   - NPS score before/after chunking implementation

4. **Iterate Based on Data:**
   - Adjust streak rewards if engagement plateaus
   - Modify reward odds if churn increases
   - Enhance chunking algorithm based on retention data

## 📞 Support

If you encounter issues not covered here:
1. Check browser console for client-side errors
2. Check server logs for API errors
3. Verify database schema matches expected structure
4. Review `LEARNING_SYSTEM.md` for feature details
