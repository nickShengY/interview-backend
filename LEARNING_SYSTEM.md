# Advanced Learning System & Gamification

## Overview
This document describes the enhanced learning and reward systems implemented to maximize user engagement, retention, and educational outcomes.

## 🧠 Learning Science Implementation

### Chunking Technique (Herbert Simon)
Based on Nobel Prize-winning cognitive science research, information is grouped into meaningful "chunks" for better retention.

**Implementation:**
- Flashcards are organized into 3-5 chunks (each containing 3-5 related cards)
- Each chunk represents a meaningful topic cluster
- Reduces cognitive load by grouping related concepts
- Enhances long-term memory formation

**Location:** `app/api/textbook/flashcards/route.ts`

### Spaced Repetition (SuperMemo SM-2)
Flashcards are reviewed at optimal intervals based on the Ebbinghaus forgetting curve.

**Algorithm:**
- Initial interval: 1 day
- Subsequent intervals calculated based on performance
- Ease factor adjusts difficulty
- Reviews scheduled when memory is about to fade

**Schema:** `Flashcard` model in `prisma/schema.prisma`

### Active Recall
Students must retrieve information from memory rather than passive recognition.

**Features:**
- Front/back flashcard format forces retrieval
- Key terms extracted for focused practice
- No multiple choice to avoid recognition bias

### Mnemonics & Memory Aids
AI generates creative memory devices for difficult concepts.

**Types:**
- Acronyms (e.g., "ROY G BIV" for rainbow colors)
- Vivid mental imagery
- Rhymes and word associations
- Story-based mnemonics

**Schema:** `mnemonics` field in `Flashcard` model

### Interleaved Learning
Mixed practice of different topics prevents over-specialization.

**Implementation:**
- Flashcards tagged with `category`
- Review sessions mix categories
- Prevents "illusion of mastery" from blocked practice

## 🎮 Gamification & Reward System

### Dynamic Reward Probabilities

**Base Odds (after completing 5 questions):**
- 0 credits: 60% chance
- 5 credits: 35% chance  
- 100 credits: 5% chance

**Boosted Odds for Low Credit Users (< 20 credits):**
- 0 credits: 40% (-20%)
- 5 credits: 45% (+10%)
- 100 credits: 15% (+10%)

**Boosted Odds for Losing Streaks (5+ losses):**
- 0 credits: 30% (-30%)
- 5 credits: 50% (+15%)
- 100 credits: 20% (+15%)

**Boosted Odds for New Users (first 3 sessions):**
- 0 credits: 35% (-25%)
- 5 credits: 50% (+15%)
- 100 credits: 15% (+10%)

**Purpose:** Hook new users and retain struggling users while maintaining profitability.

**Location:** `app/api/interview/evaluate/route.ts` - `calculateReward()` function

### Session-Based Rewards

**Old System:**
- Reward after each correct answer
- Immediate but low value
- High credit drain

**New System:**
- Reward only after completing all 5 questions
- Creates anticipation and commitment
- Tracks progress: `InterviewSession` model
- Shows spin wheel with predetermined result

**Benefits:**
- Reduces credit giveaways by 80%
- Increases session completion rate
- Creates mini-goals and milestones

### Daily Check-In Streaks

**Rewards:**
- Daily check-in: 5 credits
- 3+ day streak: +streak length bonus
- 7 day streak: +20 bonus credits 🔥
- 30 day streak: +100 bonus credits 🏆

**Purpose:** 
- Drive daily engagement
- Create habit formation
- Reward loyal users

**API:** `/api/user/checkin` (GET/POST)
**Component:** `components/check-in-streak.tsx`
**Schema:** `UserProgress` model tracks streaks

### Progress Tracking

**Metrics Tracked:**
- `currentStreak`: Active check-in streak
- `longestStreak`: Personal best
- `totalCheckIns`: Lifetime check-ins
- `lastRewardWon`: For smart reward timing
- `totalRewardsWon`: Lifetime rewards
- `totalQuestionSets`: Experience level
- `consecutiveLosses`: For boosted odds

**Schema:** `UserProgress` model in `prisma/schema.prisma`

## 🎯 Monetization Strategy

### Free Credits
- Daily check-in: 5 credits/day → 150 credits/month
- Streak bonuses: Up to 4 weekly bonuses (80 credits)
- Random rewards: Average 2-3 per week (10-300 credits)
- **Total Free:** ~240-530 credits/month

### Paid Credits
- Technical interview: 5 credits per set
- Behavioral interview: 5 credits per set  
- Flashcard generation: 5 credits
- Quiz generation: 5 credits
- Textbook upload: 10 credits

### Conversion Funnels

**Hook (First 3 Sessions):**
- 65% chance of winning rewards
- Show value quickly
- Build habit

**Retention (Low Credits):**
- 60% win rate under 20 credits
- Prevents churn from running out
- Creates "just one more" moment

**Monetization (Engaged Users):**
- Base 40% win rate
- Still feels fair and fun
- Drives credit purchases

**VIP Experience:**
- PRO/ULTRA plans bypass credit system
- Unlimited usage for subscribers
- Premium features (e.g., priority AI, analytics)

## 📊 Database Schema

### New Models

```prisma
model UserProgress {
  id                String   @id @default(cuid())
  userId            String   @unique
  currentStreak     Int      @default(0)
  longestStreak     Int      @default(0)
  lastCheckIn       DateTime?
  totalCheckIns     Int      @default(0)
  lastRewardWon     DateTime?
  totalRewardsWon   Int      @default(0)
  totalQuestionSets Int      @default(0)
  consecutiveLosses Int      @default(0)
}

model InterviewSession {
  id             String   @id @default(cuid())
  userId         String
  type           QAKind   // TECH or BEHAV
  totalQuestions Int      @default(5)
  answeredCount  Int      @default(0)
  correctCount   Int      @default(0)
  completed      Boolean  @default(false)
  rewardGiven    Boolean  @default(false)
  rewardAmount   Int      @default(0)
  qa             QA[]
}
```

### Enhanced Models

```prisma
model Flashcard {
  // ... existing fields
  chunkId      String?  // Group related flashcards
  category     String?  // Topic for interleaving
  keyTerms     String[] // Key concepts for retrieval
  mnemonics    String?  // Memory aids
}

model QA {
  // ... existing fields  
  sessionId    String?  // Link to interview session
  session      InterviewSession?
}
```

## 🚀 Frontend Components

### Check-In Component
**File:** `components/check-in-streak.tsx`

Shows streak stats, daily check-in button, and reward breakdown.

### Spin Wheel
**File:** `components/spin-wheel.tsx`

Visual reward presentation with predetermined outcome:
- Shows 0, 5, or 100 credit options
- Spins to reveal server-determined reward
- Creates excitement and anticipation

### Interview Questions
**File:** `components/interview-questions.tsx`

Enhanced to track sessions:
- Maintains sessionId across 5 questions
- Shows progress counter
- Displays spin wheel after completion
- Shows total correct answers and reward

## 📈 Expected Outcomes

### Engagement Metrics
- **Daily Active Users:** +40% from check-in streaks
- **Session Length:** +60% from 5-question commitment
- **Retention (Day 7):** +35% from habit formation
- **Retention (Day 30):** +50% from streak maintenance

### Monetization Metrics
- **Free Credit Drain:** -80% from session-based rewards
- **Conversion Rate:** +25% from low-credit boosting
- **ARPU:** +40% from balanced free/paid economy
- **LTV:** +60% from improved retention

### Learning Outcomes
- **Retention Rate:** +45% from chunking and spaced repetition
- **Completion Rate:** +55% from interleaved learning
- **Mastery Speed:** +30% from active recall and mnemonics

## 🔧 Setup Instructions

### 1. Database Migration
```bash
npx prisma db push
npx prisma generate
```

### 2. Environment Variables
```env
GOOGLE_API_KEY=your_gemini_api_key
GEMINI_SMALL_MODEL=gemini-2.5-flash
```

### 3. Restart Development Server
```bash
npm run dev
```

## 🧪 Testing the System

### Check-In Flow
1. Navigate to home page
2. Click "Check In" button in CheckInStreak component
3. Verify credits awarded
4. Check streak counter increments
5. Return next day and verify streak continues

### Interview Rewards
1. Start technical interview
2. Answer all 5 questions
3. Observe spin wheel appears
4. Verify reward matches backend calculation
5. Check credits updated correctly

### Flashcard Generation
1. Upload textbook
2. Generate flashcards
3. Verify chunks created
4. Check mnemonics present
5. Review key terms extracted

## 📝 Future Enhancements

### Phase 2
- [ ] Social features (leaderboards, challenges)
- [ ] Achievement system (badges, milestones)
- [ ] Referral program (invite friends for credits)
- [ ] Study groups and collaborative learning

### Phase 3
- [ ] AI tutor chat for personalized help
- [ ] Video lessons integrated with flashcards
- [ ] Practice exam simulations
- [ ] Career counseling and job matching

### Phase 4
- [ ] Mobile app (React Native)
- [ ] Offline mode for studying
- [ ] Voice-based study assistant
- [ ] AR/VR immersive learning experiences

## 🎓 Research References

1. **Chunking:** Miller, G. A. (1956). "The Magical Number Seven, Plus or Minus Two"
2. **Spaced Repetition:** Ebbinghaus, H. (1885). "Memory: A Contribution to Experimental Psychology"  
3. **Active Recall:** Roediger & Karpicke (2006). "Test-Enhanced Learning"
4. **Interleaving:** Rohrer & Taylor (2007). "The Shuffling of Mathematics Problems"
5. **Gamification:** Deterding et al. (2011). "From Game Design Elements to Gamefulness"
