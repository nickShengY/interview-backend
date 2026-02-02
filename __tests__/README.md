# Test Suite Documentation

## Overview

This test suite provides comprehensive coverage for the ATS Interview App, including:
- **Python Backend Tests** - FastAPI endpoints, ATS scoring, cover letter generation
- **TypeScript Unit Tests** - API routes, credits system, auth utilities
- **E2E Tests** - User flows with Playwright

## Running Tests

### Backend Tests (Python)

```bash
cd backend
pip install pytest pytest-asyncio httpx
pytest tests/ -v
```

### Frontend Unit Tests (Jest)

```bash
npm test
# or
npm run test:coverage
```

### E2E Tests (Playwright)

```bash
# Make sure the dev server is running
npm run dev

# In another terminal
npx playwright test

# Run with UI
npx playwright test --ui

# Run specific test file
npx playwright test e2e/auth.spec.ts
```

## Test Structure

### Backend Tests (`backend/tests/`)

| File | Coverage |
|------|----------|
| `test_ats_scoring.py` | Text extraction, keyword scoring, formatting penalty, AI similarity |
| `test_main.py` | FastAPI endpoints, validation, file upload, rate limiting |
| `test_cover_letter.py` | Cover letter generation, file formats, error handling |
| `conftest.py` | Shared fixtures and test configuration |

### Unit Tests (`__tests__/`)

| Directory | Coverage |
|-----------|----------|
| `lib/credits.test.ts` | Credit deduction, refunds, transaction types |
| `lib/auth-utils.test.ts` | Token verification, user sync, demo user |
| `lib/requireCredits.test.ts` | Credit middleware wrapper |
| `api/user/credits.test.ts` | GET credits endpoint |
| `api/user/profile.test.ts` | GET/PATCH profile endpoints |
| `api/user/checkin.test.ts` | Daily check-in, streaks, bonuses |
| `api/user/transactions.test.ts` | Transaction history |
| `api/interview/evaluate.test.ts` | Answer evaluation, sessions, rewards |
| `api/ats/scan.test.ts` | ATS scan proxy, credit integration |

### E2E Tests (`e2e/`)

| File | Coverage |
|------|----------|
| `auth.spec.ts` | Demo login, protected routes, session persistence |
| `credits.spec.ts` | Credits display, transaction history, daily check-in |
| `ats-scanner.spec.ts` | File upload, form validation, scan submission |
| `interview.spec.ts` | Technical/behavioral interviews, question flow |
| `navigation.spec.ts` | Main nav, mobile nav, deep linking, 404 handling |
| `user-management.spec.ts` | Profile editing, settings, transaction history |
| `reward-system.spec.ts` | Spin wheel, daily rewards, streak bonuses |
| `edge-cases.spec.ts` | Network errors, form edge cases, security |
| `homepage.spec.ts` | Basic homepage tests |

## Key Test Scenarios

### Credits System
- ✅ Deduct credits atomically with optimistic locking
- ✅ Handle insufficient credits (402 response)
- ✅ Refund on failed operations
- ✅ Transaction logging for all credit changes
- ✅ Different costs per operation type

### User Management
- ✅ Demo user creation and authentication
- ✅ Firebase token verification
- ✅ User sync to database on first login
- ✅ Profile updates (allowed fields only)
- ✅ Email protection (not editable)

### Daily Check-in
- ✅ First-time check-in
- ✅ Consecutive day streaks
- ✅ Streak reset after missed day
- ✅ Weekly bonus (7-day streak)
- ✅ Monthly bonus (30-day streak)
- ✅ Concurrent check-in idempotency

### Interview Evaluation
- ✅ Request validation
- ✅ Session management
- ✅ Duplicate question prevention
- ✅ Heuristic fallback evaluation
- ✅ Reward calculation on completion
- ✅ Daily reward caps

### ATS Scanner
- ✅ File type validation
- ✅ File size limits
- ✅ Job description validation
- ✅ Backend proxy integration
- ✅ Credit deduction and refund

## Mocking Strategy

### Prisma Mock (`__tests__/setup/prisma-mock.ts`)
Simple mock implementation for database operations without external dependencies.

### API Mocks
- `@/lib/prisma` - Database operations
- `@/lib/firebase/auth-utils` - Authentication
- `@/lib/credits` - Credit operations
- `@google/genai` - AI generation

## Adding New Tests

1. **Unit tests**: Add to `__tests__/` following existing patterns
2. **E2E tests**: Add to `e2e/` using Playwright test patterns
3. **Backend tests**: Add to `backend/tests/` using pytest

## Coverage Goals

- Unit tests: Focus on business logic, edge cases, error handling
- E2E tests: Focus on user flows, accessibility, mobile responsiveness
- Integration: Credit system, auth flow, session management

## CI/CD Integration

Tests can be run in CI with:

```yaml
# Unit tests
- run: npm test -- --coverage

# E2E tests
- run: npx playwright install --with-deps
- run: npx playwright test

# Backend tests
- run: cd backend && pip install -r requirements.txt pytest && pytest
```
