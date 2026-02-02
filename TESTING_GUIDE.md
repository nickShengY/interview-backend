# Testing Guide - Interview Pro

This guide explains how to run all tests, interpret results, and add new tests to the Interview Pro application.

---

## Table of Contents

1. [Quick Start](#quick-start)
2. [Test Structure](#test-structure)
3. [Running Tests](#running-tests)
4. [Writing Tests](#writing-tests)
5. [Test Coverage](#test-coverage)
6. [Continuous Integration](#continuous-integration)
7. [Troubleshooting](#troubleshooting)

---

## Quick Start

### Run All Tests

```bash
# Frontend unit tests (Jest)
npm test

# Frontend tests with coverage
npm run test:coverage

# Backend tests (Pytest)
cd backend
pytest

# Backend tests with coverage
pytest --cov=backend --cov-report=html

# E2E tests (Playwright)
npx playwright test

# E2E tests with UI
npx playwright test --ui

# E2E tests in specific browser
npx playwright test --project=chromium
```

### Run Specific Test Suites

```bash
# Run specific test file
npm test __tests__/lib/credits.test.ts

# Run tests matching pattern
npm test -- --testNamePattern="Credit System"

# Run backend specific module
cd backend
pytest tests/test_ats_scoring.py -v

# Run E2E tests for specific feature
npx playwright test e2e/ats-scanner.spec.ts
```

---

## Test Structure

### Directory Structure

```
ats-interview-app/
├── __tests__/                   # Frontend unit & integration tests
│   ├── api/                     # API route tests
│   │   ├── user/
│   │   │   ├── credits.test.ts
│   │   │   ├── checkin.test.ts
│   │   │   └── ...
│   │   ├── interview/
│   │   │   ├── evaluate.test.ts
│   │   │   ├── reward-caps.test.ts
│   │   │   └── ...
│   │   └── textbook/
│   │       └── upload.test.ts
│   ├── lib/                     # Library/utility tests
│   │   ├── credits.test.ts
│   │   ├── auth-utils.test.ts
│   │   └── reward-probability.test.ts
│   └── setup/                   # Test configuration
│       └── prisma-mock.ts
├── backend/tests/               # Backend Python tests
│   ├── test_ats_scoring.py
│   ├── test_cover_letter.py
│   └── test_main.py
├── e2e/                         # End-to-end tests (Playwright)
│   ├── auth.spec.ts
│   ├── ats-scanner.spec.ts
│   ├── interview.spec.ts
│   ├── credits.spec.ts
│   ├── reward-system.spec.ts
│   └── ...
└── playwright.config.ts         # Playwright configuration
```

---

## Running Tests

### Frontend Tests (Jest)

**Prerequisites:**
- Node.js 18+
- npm dependencies installed

```bash
# Install dependencies
npm install

# Run all tests
npm test

# Run with watch mode (auto-rerun on changes)
npm test -- --watch

# Run specific file
npm test __tests__/lib/credits.test.ts

# Run with coverage
npm run test:coverage

# Run in CI mode (no watch)
npm test -- --ci --coverage --maxWorkers=2
```

**Configuration:** See [jest.config.js](jest.config.js)

### Backend Tests (Pytest)

**Prerequisites:**
- Python 3.10+
- Virtual environment activated
- Backend dependencies installed

```bash
# Navigate to backend
cd backend

# Create virtual environment (first time)
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# Unix/macOS:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
pip install pytest pytest-cov

# Run all tests
pytest

# Run with verbose output
pytest -v

# Run specific test file
pytest tests/test_ats_scoring.py

# Run specific test function
pytest tests/test_ats_scoring.py::TestCleanText::test_lowercase_conversion

# Run with coverage
pytest --cov=backend --cov-report=html --cov-report=term

# View HTML coverage report
# Windows:
start htmlcov/index.html
# macOS:
open htmlcov/index.html
# Linux:
xdg-open htmlcov/index.html
```

**Configuration:** See [backend/pytest.ini](backend/pytest.ini)

### E2E Tests (Playwright)

**Prerequisites:**
- Node.js 18+
- Playwright browsers installed
- Application running locally

```bash
# Install Playwright browsers (first time)
npx playwright install

# Run E2E tests
npx playwright test

# Run in UI mode (interactive)
npx playwright test --ui

# Run specific browser
npx playwright test --project=chromium
npx playwright test --project=firefox
npx playwright test --project=webkit

# Run specific test file
npx playwright test e2e/ats-scanner.spec.ts

# Run in debug mode
npx playwright test --debug

# Run with trace (for debugging failures)
npx playwright test --trace on

# View test report
npx playwright show-report
```

**Before Running E2E Tests:**
1. Start the development server:
   ```bash
   npm run dev
   ```
2. Start the backend API (if testing ATS features):
   ```bash
   cd backend
   uvicorn main:app --reload
   ```

**Configuration:** See [playwright.config.ts](playwright.config.ts)

---

## Writing Tests

### Frontend Unit Tests (Jest + Testing Library)

#### Example: Testing an API Route

```typescript
// __tests__/api/example/route.test.ts
import { prismaMock } from '../../setup/prisma-mock'

jest.mock('@/lib/prisma', () => ({
  prisma: prismaMock,
}))

jest.mock('@/lib/firebase/auth-utils', () => ({
  resolveUserId: jest.fn(),
}))

import { GET } from '@/app/api/example/route'
import { resolveUserId } from '@/lib/firebase/auth-utils'

describe('GET /api/example', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should return data for authenticated user', async () => {
    // Setup
    ;(resolveUserId as jest.Mock).mockResolvedValue('user-123')
    ;(prismaMock.user.findUnique as jest.Mock).mockResolvedValue({
      id: 'user-123',
      credits: 50,
    })

    // Execute
    const request = new Request('http://localhost/api/example')
    const response = await GET(request)
    const data = await response.json()

    // Assert
    expect(response.status).toBe(200)
    expect(data.credits).toBe(50)
  })

  it('should return 404 when user not found', async () => {
    ;(resolveUserId as jest.Mock).mockResolvedValue('nonexistent')
    ;(prismaMock.user.findUnique as jest.Mock).mockResolvedValue(null)

    const request = new Request('http://localhost/api/example')
    const response = await GET(request)

    expect(response.status).toBe(404)
  })
})
```

#### Example: Testing a Utility Function

```typescript
// __tests__/lib/example-util.test.ts
import { calculateSomething } from '@/lib/example-util'

describe('calculateSomething', () => {
  it('should handle normal case', () => {
    expect(calculateSomething(10, 5)).toBe(15)
  })

  it('should handle edge case (zero)', () => {
    expect(calculateSomething(0, 0)).toBe(0)
  })

  it('should throw on invalid input', () => {
    expect(() => calculateSomething(-1, 5)).toThrow('Invalid input')
  })
})
```

### Backend Tests (Pytest)

#### Example: Testing a Function

```python
# backend/tests/test_example.py
import pytest
from backend.example import process_data

class TestProcessData:
    def test_normal_case(self):
        result = process_data("input")
        assert result == "expected_output"

    def test_empty_input(self):
        result = process_data("")
        assert result == ""

    def test_invalid_input(self):
        with pytest.raises(ValueError):
            process_data(None)
```

#### Example: Testing FastAPI Endpoint

```python
from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)

def test_health_endpoint():
    response = client.get("/health")
    assert response.status_code == 200
    assert "status" in response.json()

def test_protected_endpoint_without_auth():
    response = client.post("/protected")
    assert response.status_code == 401
```

### E2E Tests (Playwright)

#### Example: Testing User Flow

```typescript
// e2e/example-flow.spec.ts
import { test, expect } from '@playwright/test'

test.describe('Example User Flow', () => {
  test('should complete full workflow', async ({ page }) => {
    // Navigate
    await page.goto('/')

    // Interact
    await page.click('button:text("Get Started")')
    await page.fill('input[name="email"]', 'test@example.com')
    await page.click('button[type="submit"]')

    // Assert
    await expect(page.locator('h1')).toContainText('Welcome')
    await expect(page).toHaveURL(/\/dashboard/)
  })

  test('should handle errors gracefully', async ({ page }) => {
    await page.goto('/upload')

    // Upload invalid file
    await page.setInputFiles('input[type="file"]', {
      name: 'invalid.exe',
      mimeType: 'application/x-msdownload',
      buffer: Buffer.from('MZ'),
    })

    // Should show error
    await expect(page.locator('.error-message')).toBeVisible()
    await expect(page.locator('.error-message')).toContainText('Unsupported file type')
  })
})
```

---

## Test Coverage

### Current Coverage Status

| Module | Coverage | Status |
|--------|----------|--------|
| Credits System | 95% | ✅ Excellent |
| Authentication | 90% | ✅ Excellent |
| Check-in & Streaks | 98% | ✅ Excellent |
| Interview Evaluation | 85% | ✅ Good |
| ATS Scanning | 85% | ✅ Good |
| Cover Letter | 75% | ⚠️ Adequate |
| Textbook Upload | 70% | ⚠️ Needs Work |
| Reward System | 60% | ⚠️ Needs Work |
| Stripe Integration | 0% | ❌ Missing |

### Viewing Coverage Reports

#### Frontend (Jest)

```bash
npm run test:coverage

# Open HTML report
# Windows:
start coverage/lcov-report/index.html
# macOS:
open coverage/lcov-report/index.html
# Linux:
xdg-open coverage/lcov-report/index.html
```

#### Backend (Pytest)

```bash
cd backend
pytest --cov=backend --cov-report=html

# Open HTML report
start htmlcov/index.html  # Windows
open htmlcov/index.html   # macOS
```

### Coverage Goals

- **Critical Paths:** 95%+ (auth, credits, payments)
- **Core Features:** 85%+ (ATS, interviews, textbooks)
- **UI Components:** 70%+ (acceptable for React components)
- **Utilities:** 90%+

---

## Test Categories

### 1. Unit Tests
**What:** Individual functions/modules in isolation
**When:** Always write unit tests first
**Example:** Testing `calculateReward()` function

### 2. Integration Tests
**What:** Multiple components working together
**When:** After unit tests pass
**Example:** Testing API route + database + credit system

### 3. E2E Tests
**What:** Full user workflows in browser
**When:** For critical user journeys
**Example:** Complete ATS scan workflow from upload to results

### 4. Performance Tests
**What:** Load, stress, and scalability testing
**When:** Before production launch
**Example:** 1000 concurrent API requests

### 5. Security Tests
**What:** Vulnerability scanning, penetration testing
**When:** Before production, regularly thereafter
**Example:** SQL injection attempts, XSS payloads

---

## Continuous Integration

### GitHub Actions Workflow

Create `.github/workflows/test.yml`:

```yaml
name: Tests

on: [push, pull_request]

jobs:
  frontend-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm test -- --ci --coverage --maxWorkers=2

  backend-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-python@v4
        with:
          python-version: '3.10'
      - run: cd backend && pip install -r requirements.txt
      - run: cd backend && pytest --cov=backend

  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npx playwright install --with-deps
      - run: npm run build
      - run: npm start & npx playwright test
```

---

## Troubleshooting

### Common Issues

#### 1. Jest: "Cannot find module '@/lib/...'"

**Solution:** Check `tsconfig.json` paths and `jest.config.js` moduleNameMapper:

```javascript
// jest.config.js
moduleNameMapper: {
  '^@/(.*)$': '<rootDir>/$1',
}
```

#### 2. Prisma Mock: "TypeError: Cannot read property 'findUnique' of undefined"

**Solution:** Ensure mock is set up before importing the tested module:

```typescript
jest.mock('@/lib/prisma', () => ({
  prisma: prismaMock,
}))

import { GET } from '@/app/api/example/route' // Import AFTER mock
```

#### 3. Playwright: "Target closed" / "Navigation timeout"

**Solution:**
- Ensure dev server is running
- Increase timeout: `test.setTimeout(60000)`
- Check for console errors: `page.on('console', console.log)`

#### 4. Backend: "ModuleNotFoundError: No module named 'backend'"

**Solution:**
```bash
cd backend
export PYTHONPATH="${PYTHONPATH}:$(pwd)/.."
pytest
```

Or add to `pytest.ini`:
```ini
[pytest]
pythonpath = ..
```

#### 5. Tests Pass Locally But Fail in CI

**Possible Causes:**
- Environment variables missing in CI
- Different Node/Python versions
- Race conditions (timing issues)
- Database state not reset

**Solutions:**
- Add environment variables to CI config
- Specify exact versions in package.json / requirements.txt
- Add waits/retries in flaky tests
- Use `beforeEach` to reset state

---

## Best Practices

### 1. Test Naming

✅ **Good:**
```typescript
test('should deduct credits when user has sufficient balance', ...)
test('should return 404 when user not found', ...)
```

❌ **Bad:**
```typescript
test('test1', ...)
test('credits', ...)
```

### 2. Arrange-Act-Assert Pattern

```typescript
test('should do something', () => {
  // Arrange - Set up test data
  const input = 'test'
  const expected = 'result'

  // Act - Execute the code under test
  const actual = processInput(input)

  // Assert - Verify the outcome
  expect(actual).toBe(expected)
})
```

### 3. Don't Test Implementation Details

✅ **Good:** Test public API behavior
```typescript
expect(result.credits).toBe(45) // Test what user sees
```

❌ **Bad:** Test internal state
```typescript
expect(component.state.internalCounter).toBe(3) // Brittle
```

### 4. Use Factories for Test Data

```typescript
// test-utils/factories.ts
export function createMockUser(overrides = {}) {
  return {
    id: 'user-123',
    email: 'test@example.com',
    credits: 10,
    plan: 'FREE',
    ...overrides,
  }
}

// In test:
const user = createMockUser({ credits: 50 })
```

### 5. Clean Up After Tests

```typescript
afterEach(() => {
  jest.clearAllMocks()
  // Clean up any side effects
})
```

---

## Test Checklist for New Features

When adding a new feature, ensure:

- [ ] Unit tests for all public functions (>90% coverage)
- [ ] Integration tests for API routes
- [ ] Error cases tested (invalid input, missing data, etc.)
- [ ] Edge cases tested (0, null, undefined, empty strings)
- [ ] Security tests (auth required, user isolation, XSS/injection)
- [ ] Performance acceptable (<200ms for most operations)
- [ ] E2E test for critical user path
- [ ] All tests pass in CI
- [ ] No regressions in existing tests

---

## Additional Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Playwright Documentation](https://playwright.dev/docs/intro)
- [Pytest Documentation](https://docs.pytest.org/)
- [Testing Library](https://testing-library.com/docs/)
- [Code Coverage Best Practices](https://martinfowler.com/bliki/TestCoverage.html)

---

**Last Updated:** 2026-01-14
**Maintainer:** Development Team
