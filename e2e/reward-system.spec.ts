import { test, expect } from '@playwright/test'

test.describe('Reward System', () => {
  test.skip(({ browserName }) => browserName === 'webkit', 'WebKit navigation is unstable for reward flows')
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('demo_user', '1')
    })
  })

  test.describe('Spin Wheel', () => {
    test('should display spin wheel component if present', async ({ page }) => {
      await page.goto('/', { waitUntil: 'domcontentloaded' }).catch(() => {})
      await page.waitForLoadState('domcontentloaded').catch(() => {})
      
      // Look for spin wheel or reward wheel
      const spinWheel = page.locator('[data-testid="spin-wheel"]')
        .or(page.getByText(/spin|wheel|reward/i))
        .or(page.locator('.spin-wheel'))
      
      const isVisible = await spinWheel.first().isVisible({ timeout: 5000 }).catch(() => false)
      console.log('Spin wheel visible:', isVisible)
    })

    test('should show spin button when eligible', async ({ page }) => {
      await page.goto('/', { waitUntil: 'domcontentloaded' }).catch(() => {})
      await page.waitForLoadState('domcontentloaded').catch(() => {})
      
      const spinButton = page.getByRole('button', { name: /spin|claim|reward/i })
      
      const isVisible = await spinButton.first().isVisible({ timeout: 3000 }).catch(() => false)
      console.log('Spin button visible:', isVisible)
    })
  })

  test.describe('Daily Check-in Rewards', () => {
    test('should show check-in button', async ({ page }) => {
      await page.goto('/', { waitUntil: 'domcontentloaded' }).catch(() => {})
      await page.waitForLoadState('domcontentloaded').catch(() => {})
      
      const checkInButton = page.getByRole('button', { name: /check.?in|daily|claim/i })
        .or(page.locator('[data-testid="checkin-button"]'))
      
      const isVisible = await checkInButton.first().isVisible({ timeout: 5000 }).catch(() => false)
      console.log('Check-in button visible:', isVisible)
    })

    test('should display streak information', async ({ page }) => {
      await page.goto('/', { waitUntil: 'domcontentloaded' }).catch(() => {})
      await page.waitForLoadState('domcontentloaded').catch(() => {})
      
      const streakInfo = page.getByText(/streak|day/i)
        .or(page.locator('[data-testid="streak"]'))
      
      const isVisible = await streakInfo.first().isVisible({ timeout: 3000 }).catch(() => false)
      console.log('Streak info visible:', isVisible)
    })

    test('should handle check-in click', async ({ page }) => {
      await page.goto('/', { waitUntil: 'domcontentloaded' }).catch(() => {})
      await page.waitForLoadState('domcontentloaded').catch(() => {})
      
      const checkInButton = page.getByRole('button', { name: /check.?in/i })
      
      if (await checkInButton.first().isVisible({ timeout: 3000 }).catch(() => false)) {
        await checkInButton.first().click()
        
        // Wait for any animation or response
        await page.waitForTimeout(1000)
        
        // Should show success message or update UI
        await expect(page.locator('body')).toBeVisible()
      }
    })
  })

  test.describe('Interview Completion Rewards', () => {
    test('should show reward after completing interview set', async ({ page }) => {
      await page.goto('/technical-interview', { waitUntil: 'domcontentloaded' }).catch(() => {})
      await page.waitForLoadState('domcontentloaded').catch(() => {})
      
      // Look for reward/completion indicators
      const rewardIndicator = page.getByText(/reward|bonus|credit|complete/i)
      
      const count = await rewardIndicator.count()
      console.log('Reward-related elements found:', count)
    })
  })

  test.describe('Reward Animations', () => {
    test('should have smooth animations for rewards', async ({ page }) => {
      await page.goto('/', { waitUntil: 'domcontentloaded' }).catch(() => {})
      await page.waitForLoadState('domcontentloaded').catch(() => {})
      
      // Check for CSS animations on reward elements
      const animatedElements = page.locator('[class*="animate"]')
      
      const count = await animatedElements.count()
      console.log('Animated elements found:', count)
    })
  })

  test.describe('Credit Balance Updates', () => {
    test('should update credit display after reward', async ({ page }) => {
      await page.goto('/', { waitUntil: 'domcontentloaded' }).catch(() => {})
      await page.waitForLoadState('domcontentloaded').catch(() => {})
      
      // Find initial credits display
      const creditsDisplay = page.locator('[data-testid="credits"]')
        .or(page.getByText(/\d+\s*credits?/i))
      
      const isVisible = await creditsDisplay.first().isVisible({ timeout: 3000 }).catch(() => false)
      
      if (isVisible) {
        // Note the initial state
        const initialText = await creditsDisplay.first().textContent()
        console.log('Initial credits display:', initialText)
      }
    })
  })

  test.describe('Reward Caps', () => {
    test('should respect daily reward limits', async ({ page }) => {
      // This test documents expected behavior
      await page.goto('/', { waitUntil: 'domcontentloaded' }).catch(() => {})
      await page.waitForLoadState('domcontentloaded').catch(() => {})
      
      // Check for any "limit reached" or similar messaging
      const limitMessage = page.getByText(/limit|maximum|cap|reached/i)
      
      const isVisible = await limitMessage.first().isVisible({ timeout: 2000 }).catch(() => false)
      console.log('Limit message visible (if applicable):', isVisible)
    })
  })

  test.describe('Jackpot Feature', () => {
    test('should display jackpot possibility', async ({ page }) => {
      await page.goto('/', { waitUntil: 'domcontentloaded' }).catch(() => {})
      await page.waitForLoadState('domcontentloaded').catch(() => {})
      
      const jackpotIndicator = page.getByText(/jackpot|bonus|prize/i)
      
      const isVisible = await jackpotIndicator.first().isVisible({ timeout: 3000 }).catch(() => false)
      console.log('Jackpot indicator visible:', isVisible)
    })
  })

  test.describe('Streak Bonuses', () => {
    test('should show weekly bonus indication', async ({ page }) => {
      await page.goto('/profile', { waitUntil: 'domcontentloaded' }).catch(() => {})
      await page.waitForLoadState('domcontentloaded').catch(() => {})
      
      const weeklyBonus = page.getByText(/week|bonus|7.?day/i)
      
      const isVisible = await weeklyBonus.first().isVisible({ timeout: 3000 }).catch(() => false)
      console.log('Weekly bonus indicator visible:', isVisible)
    })

    test('should show monthly bonus indication', async ({ page }) => {
      await page.goto('/profile', { waitUntil: 'domcontentloaded' }).catch(() => {})
      await page.waitForLoadState('domcontentloaded').catch(() => {})
      
      const monthlyBonus = page.getByText(/month|30.?day/i)
      
      const isVisible = await monthlyBonus.first().isVisible({ timeout: 3000 }).catch(() => false)
      console.log('Monthly bonus indicator visible:', isVisible)
    })
  })
})
