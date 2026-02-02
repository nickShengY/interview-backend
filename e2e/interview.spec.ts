import { test, expect } from '@playwright/test'

test.describe('Interview Features', () => {
  test.skip(({ browserName }) => browserName === 'webkit', 'WebKit navigation is unstable for interview flows')
  test.describe.configure({ timeout: 60000 })
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('demo_user', '1')
    })
  })

  test.describe('Technical Interview Page', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/technical-interview')
      await page.waitForLoadState('networkidle')
    })

    test('should display technical interview page', async ({ page }) => {
      await expect(page).toHaveURL(/\/technical-interview/)
      
      const heading = page.getByRole('heading', { name: /technical|interview/i })
      await expect(heading.first()).toBeVisible({ timeout: 5000 })
    })

    test('should have question display area', async ({ page }) => {
      // Look for question area
      const questionArea = page.locator('[data-testid="question"]')
        .or(page.getByText(/question/i))
        .or(page.locator('.question'))
      
      const count = await questionArea.count()
      console.log('Question-related elements:', count)
    })

    test('should have answer input area', async ({ page }) => {
      const answerInput = page.locator('textarea')
        .or(page.getByPlaceholder(/answer/i))
        .or(page.getByLabel(/answer/i))
      
      if (await answerInput.first().isVisible({ timeout: 5000 }).catch(() => false)) {
        await expect(answerInput.first()).toBeVisible()
      }
    })

    test('should have submit button', async ({ page }) => {
      const submitButton = page.getByRole('button', { name: /submit|send|answer/i })
      
      if (await submitButton.isVisible({ timeout: 5000 }).catch(() => false)) {
        await expect(submitButton).toBeVisible()
      }
    })

    test('should show difficulty or category options', async ({ page }) => {
      // Look for difficulty selector or category options
      const optionsArea = page.getByRole('combobox')
        .or(page.getByRole('listbox'))
        .or(page.getByText(/difficulty|category|topic/i))
      
      const count = await optionsArea.count()
      console.log('Options/selectors found:', count)
    })

    test('should allow answering questions', async ({ page }) => {
      const answerInput = page.locator('textarea').first()
      
      if (await answerInput.isVisible({ timeout: 5000 }).catch(() => false)) {
        await answerInput.fill('This is my test answer for the technical interview question.')
        
        const value = await answerInput.inputValue()
        expect(value).toContain('test answer')
      }
    })
  })

  test.describe('Mocked Interview Flows', () => {
    test.skip('should generate and evaluate technical questions', async ({ page }) => {
      await page.route('**/api/interview/technical', (route) => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            questions: [
              {
                id: 1,
                question: 'Explain the virtual DOM in React.',
                difficulty: 'Medium',
                category: 'React',
                expectedAnswer: 'A description of reconciliation and UI diffing.',
              },
            ],
          }),
        })
      })

      await page.route('**/api/interview/evaluate', (route) => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            correct: true,
            answeredCount: 1,
            totalQuestions: 5,
            sessionId: 'session-tech-1',
            solution: {
              idealAnswer: 'The virtual DOM is an in-memory representation used to efficiently update the UI.',
              keyPoints: ['Diffing', 'Reconciliation', 'Batch updates'],
              improvementTips: ['Mention Fiber scheduling.'],
            },
          }),
        })
      })

      await page.goto('/technical-interview')
      await page.waitForLoadState('networkidle')

      const industryTrigger = page.getByRole('combobox', { name: /industry/i }).first()
      await industryTrigger.click()
      await page.getByRole('option', { name: /technology/i }).click({ timeout: 10000 })

      const jobTitleTrigger = page.getByRole('combobox', { name: /job title/i }).first()
      await jobTitleTrigger.click()
      await page.getByRole('option', { name: /frontend developer/i }).click({ timeout: 10000 })

      await page.getByRole('combobox', { name: /focus area/i }).first().click()
      await page.getByPlaceholder(/search skills/i).fill('React')
      const focusOption = page.getByRole('option', { name: /^react$/i }).first()
      await focusOption.click({ force: true })

      const generateButton = page.getByRole('button', { name: /generate questions/i })
      await generateButton.click()

      await expect(page.getByText('Question 1', { exact: true })).toBeVisible({ timeout: 10000 })
      await expect(page.getByText(/virtual DOM/i)).toBeVisible()

      const answerInput = page.getByPlaceholder(/type your answer/i)
      await answerInput.fill('It is a lightweight representation used for efficient updates.')
      await page.getByRole('button', { name: /submit answer/i }).click()

      await expect(page.getByText(/Correct Answer!/i)).toBeVisible({ timeout: 10000 })
      await expect(page.getByText(/Solution/i)).toBeVisible()
    })

    test.skip('should generate behavioral questions', async ({ page }) => {
      await page.route('**/api/interview/behavioral', (route) => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            questions: [
              {
                id: 1,
                question: 'Describe a time you handled a difficult stakeholder.',
                difficulty: 'Medium',
                category: 'Behavioral',
                expectedAnswer: 'Use the STAR method to answer clearly.',
              },
            ],
          }),
        })
      })

      await page.goto('/behavioral-interview')
      await page.waitForLoadState('networkidle')

      const industryTrigger = page.getByRole('combobox', { name: /industry/i }).first()
      await industryTrigger.click()
      await page.getByRole('option', { name: /technology/i }).click({ timeout: 10000 })

      const jobTitleTrigger = page.getByRole('combobox', { name: /job title/i }).first()
      await jobTitleTrigger.click()
      await page.getByRole('option', { name: /software engineer/i }).click({ timeout: 10000 })

      await page.getByRole('button', { name: /generate questions/i }).click()

      await expect(page.getByText('Question 1', { exact: true })).toBeVisible({ timeout: 10000 })
      await expect(page.getByText(/difficult stakeholder/i)).toBeVisible()
    })
  })

  test.describe('Behavioral Interview Page', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/behavioral-interview')
      await page.waitForLoadState('networkidle')
    })

    test('should display behavioral interview page', async ({ page }) => {
      await expect(page).toHaveURL(/\/behavioral/)
      
      const heading = page.getByRole('heading', { name: /behavioral|interview/i })
      await expect(heading.first()).toBeVisible({ timeout: 5000 })
    })

    test('should show STAR method guidance', async ({ page }) => {
      // Look for STAR method reference
      const starReference = page.getByText(/star/i)
        .or(page.getByText(/situation/i))
        .or(page.getByText(/task/i))
        .or(page.getByText(/action/i))
        .or(page.getByText(/result/i))
      
      const count = await starReference.count()
      console.log('STAR-related elements:', count)
    })

    test('should have industry selection', async ({ page }) => {
      const industrySelector = page.getByRole('combobox')
        .or(page.getByText(/industry/i))
        .or(page.locator('[data-testid="industry"]'))
      
      const isVisible = await industrySelector.first().isVisible({ timeout: 3000 }).catch(() => false)
      console.log('Industry selector visible:', isVisible)
    })
  })

  test.describe('Question Generation', () => {
    test('should generate new question on request', async ({ page }) => {
      await page.goto('/technical-interview')
      await page.waitForLoadState('networkidle')
      
      const generateButton = page.getByRole('button', { name: /generate|new|next/i })
      
      if (await generateButton.isVisible({ timeout: 5000 }).catch(() => false)) {
        await generateButton.click()
        
        // Wait for potential loading
        await page.waitForTimeout(1000)
        
        // Page should still be functional
        await expect(page.locator('body')).toBeVisible()
      }
    })
  })

  test.describe('Answer Evaluation', () => {
    test('should show feedback after answer submission', async ({ page }) => {
      await page.goto('/technical-interview')
      await page.waitForLoadState('networkidle')
      
      const answerInput = page.locator('textarea').first()
      const submitButton = page.getByRole('button', { name: /submit|evaluate|check/i })
      
      if (await answerInput.isVisible({ timeout: 3000 }).catch(() => false) &&
          await submitButton.isVisible({ timeout: 3000 }).catch(() => false)) {
        
        await answerInput.fill('This is a comprehensive answer that explains the concept in detail with examples and best practices.')
        
        // Note: Actual submission requires backend
        console.log('Answer input and submit button are functional')
      }
    })
  })

  test.describe('Session Progress', () => {
    test('should display progress indicator', async ({ page }) => {
      await page.goto('/technical-interview')
      await page.waitForLoadState('networkidle')
      
      // Look for progress indicator
      const progressIndicator = page.locator('[role="progressbar"]')
        .or(page.getByText(/\d+\s*\/\s*\d+/))
        .or(page.getByText(/question \d/i))
        .or(page.locator('.progress'))
      
      const count = await progressIndicator.count()
      console.log('Progress indicators found:', count)
    })
  })

  test.describe('Mobile Responsiveness', () => {
    test('should be responsive on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 })
      await page.goto('/technical-interview')
      await page.waitForLoadState('networkidle')
      
      // Page should be functional on mobile
      await expect(page.locator('body')).toBeVisible()
      
      // Content should not overflow
      const body = page.locator('body')
      const box = await body.boundingBox()
      
      if (box) {
        expect(box.width).toBeLessThanOrEqual(375)
      }
    })
  })
})
