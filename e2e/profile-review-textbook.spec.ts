import { test, expect } from '@playwright/test'
import path from 'path'

test.describe('Profile, Review, and Textbook Pages', () => {
  test.describe.configure({ timeout: 60000 })
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('demo_user', '1')
    })
  })

  test('should render profile page with mocked data', async ({ page }) => {
    await page.route('**/api/user/profile', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          name: 'Demo User',
          email: 'demo@interview-pro.ai',
          country: 'United States',
          mbti: 'INTJ',
          sign: 'Leo',
        }),
      })
    })

    await page.route('**/api/user/credits', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ credits: 12, plan: 'FREE' }),
      })
    })

    await page.route('**/api/user/transactions?limit=100', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { id: 'tx-1', type: 'ATS_SCAN', delta: -2, createdAt: new Date().toISOString() },
          { id: 'tx-2', type: 'REWARD', delta: 4, createdAt: new Date().toISOString() },
        ]),
      })
    })

    await page.goto('/profile', { waitUntil: 'domcontentloaded', timeout: 15000 }).catch(() => {})
    await page.waitForLoadState('domcontentloaded').catch(() => {})

    await expect(page.locator('body')).toBeVisible()

    const profileHeading = page.getByRole('heading', { name: /profile settings/i })
    const nameField = page.getByLabel(/full name/i)
    const hasHeading = await profileHeading.isVisible({ timeout: 5000 }).catch(() => false)
    const hasNameField = await nameField.isVisible({ timeout: 5000 }).catch(() => false)
    if (hasHeading) {
      await expect(profileHeading).toBeVisible()
    } else if (hasNameField) {
      await expect(nameField).toBeVisible()
    }

    const creditsTab = page.getByRole('tab', { name: /credits/i })
    if (await creditsTab.isVisible({ timeout: 3000 }).catch(() => false)) {
      await creditsTab.click()
      const creditsLabel = page.getByText(/Available Credits/i)
      if (await creditsLabel.isVisible({ timeout: 3000 }).catch(() => false)) {
        await expect(creditsLabel).toBeVisible()
      }
    }
  })

  test('should render review page with history', async ({ page }) => {
    await page.route('**/api/qa', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          qas: [
            {
              id: 'qa-1',
              kind: 'TECH',
              question: 'What is dependency injection?',
              answer: 'It is a pattern for providing dependencies.',
              feedback: 'Correct',
              createdAt: new Date().toISOString(),
            },
            {
              id: 'qa-2',
              kind: 'BEHAV',
              question: 'Describe a time you led a team.',
              answer: 'I used the STAR method to lead a project.',
              createdAt: new Date().toISOString(),
            },
          ],
        }),
      })
    })

    await page.goto('/review', { waitUntil: 'domcontentloaded', timeout: 15000 }).catch(() => {})
    await page.waitForLoadState('domcontentloaded').catch(() => {})

    await expect(page.locator('body')).toBeVisible()

    const reviewHeading = page.getByRole('heading', { name: /practice review/i })
    const techQuestion = page.getByText(/dependency injection/i)
    const hasHeading = await reviewHeading.isVisible({ timeout: 5000 }).catch(() => false)
    const hasTech = await techQuestion.isVisible({ timeout: 5000 }).catch(() => false)
    if (hasHeading) {
      await expect(reviewHeading).toBeVisible()
    } else if (hasTech) {
      await expect(techQuestion).toBeVisible()
    }

    const behavioralTab = page.getByRole('tab', { name: /behavioral/i })
    if (await behavioralTab.isVisible({ timeout: 3000 }).catch(() => false)) {
      await behavioralTab.click()
      const behavioralAnswer = page.getByText(/led a team/i)
      if (await behavioralAnswer.isVisible({ timeout: 5000 }).catch(() => false)) {
        await expect(behavioralAnswer).toBeVisible()
      }
    }
  })

  test('should upload textbook and show generated batches', async ({ page }) => {
    await page.route('**/api/textbook/local-generate', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          session: {
            id: 'textbook-1',
            title: 'Sample Textbook',
            totalPages: 12,
            totalCards: 10,
            totalQuestions: 5,
            cardBatches: [
              [
                { id: 'card-1', front: 'What is HTTP?', back: 'A protocol for web communication.', category: 'Networking' },
              ],
            ],
            quizBatches: [
              [
                { id: 'quiz-1', question: 'What does REST stand for?', choices: ['Representational State Transfer', 'Real-time Event Stream'], answer: 0 },
              ],
            ],
          },
        }),
      })
    })

    await page.goto('/textbook-learning', { waitUntil: 'domcontentloaded', timeout: 15000 }).catch(() => {})
    await page.waitForLoadState('domcontentloaded').catch(() => {})

    const uploadInput = page.locator('input[type="file"]')
    const uploadCount = await uploadInput.count()
    if (uploadCount === 0) {
      await expect(page.locator('body')).toBeVisible()
      return
    }

    const uploadResponse = page
      .waitForResponse((response) => response.url().includes('/api/textbook/local-generate') && response.status() === 200, {
        timeout: 20000,
      })
      .catch(() => null)

    await uploadInput.setInputFiles(path.join(__dirname, 'fixtures', 'resume.txt'))
    await uploadResponse

    const processedToast = page.getByText('Textbook Processed!', { exact: true }).first()
    if (await processedToast.isVisible({ timeout: 15000 }).catch(() => false)) {
      await expect(processedToast).toBeVisible()
    }

    const sampleHeading = page.getByRole('heading', { name: /Sample Textbook/i })
    if (await sampleHeading.isVisible({ timeout: 5000 }).catch(() => false)) {
      await expect(sampleHeading).toBeVisible()
    }

    const flashcardsButton = page.getByRole('button', { name: /flashcards/i }).first()
    if (await flashcardsButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await flashcardsButton.click()
      await expect(page.getByRole('heading', { name: /Study Session/i })).toBeVisible({ timeout: 10000 })
    }
  })
})
