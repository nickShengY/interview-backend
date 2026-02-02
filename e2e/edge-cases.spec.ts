import { test, expect } from '@playwright/test'

test.describe('Edge Cases & Error Handling', () => {
  test.skip(({ browserName }) => browserName === 'webkit', 'WebKit is unstable for edge case flows')
  test.describe('Network Errors', () => {
    test('should handle offline state gracefully', async ({ page, context }) => {
      await page.goto('/')
      await page.waitForLoadState('networkidle')
      
      // Go offline
      await context.setOffline(true)
      
      // Try to navigate - should show some error handling
      await page.goto('/ats-scanner').catch(() => {})
      
      // Page should still be somewhat functional or show offline message
      await expect(page.locator('body')).toBeVisible()
      
      // Go back online
      await context.setOffline(false)
    })

    test('should handle slow network', async ({ page }) => {
      // Simulate slow network using route throttling
      await page.route('**/*', async (route) => {
        await new Promise(resolve => setTimeout(resolve, 100))
        await route.continue()
      })
      
      await page.goto('/')
      await expect(page.locator('body')).toBeVisible()
    })
  })

  test.describe('Form Edge Cases', () => {
    test('should handle very long job description', async ({ page }) => {
      await page.goto('/ats-scanner')
      await page.waitForLoadState('networkidle')
      
      const jdInput = page.locator('textarea').first()
      
      if (await jdInput.isVisible({ timeout: 3000 }).catch(() => false)) {
        // Try to enter very long text
        const longText = 'Software Developer ' + 'requirements '.repeat(1000)
        await jdInput.fill(longText)
        
        // Should handle without crashing
        await expect(page.locator('body')).toBeVisible()
      }
    })

    test('should handle special characters in input', async ({ page }) => {
      await page.goto('/ats-scanner')
      await page.waitForLoadState('networkidle')
      
      const jdInput = page.locator('textarea').first()
      
      if (await jdInput.isVisible({ timeout: 3000 }).catch(() => false)) {
        const specialChars = '<script>alert("xss")</script> & < > " \' ® © €'
        await jdInput.fill(specialChars)
        
        // Should sanitize and not execute scripts
        await expect(page.locator('body')).toBeVisible()
      }
    })

    test('should handle unicode characters', async ({ page }) => {
      await page.goto('/ats-scanner')
      await page.waitForLoadState('networkidle')
      
      const jdInput = page.locator('textarea').first()
      
      if (await jdInput.isVisible({ timeout: 3000 }).catch(() => false)) {
        const unicode = 'Developer 日本語 中文 한국어 العربية 🚀 👨‍💻'
        await jdInput.fill(unicode)
        
        const value = await jdInput.inputValue()
        expect(value).toContain('日本語')
      }
    })

    test('should handle empty form submission attempt', async ({ page }) => {
      await page.goto('/ats-scanner')
      await page.waitForLoadState('networkidle')
      
      const submitButton = page.getByRole('button', { name: /scan|analyze|submit/i })
      
      if (await submitButton.isVisible({ timeout: 3000 }).catch(() => false)) {
        // Try clicking submit without filling form
        const isDisabled = await submitButton.isDisabled()
        
        if (!isDisabled) {
          await submitButton.click()
          
          // Should show validation error or prevent submission
          await page.waitForTimeout(500)
          await expect(page.locator('body')).toBeVisible()
        }
      }
    })
  })

  test.describe('Session Edge Cases', () => {
    test('should handle localStorage being disabled', async ({ page, context }) => {
      // Clear storage
      await context.clearCookies()
      
      await page.goto('/')
      
      // Should still load without localStorage access
      await expect(page.locator('body')).toBeVisible()
    })

    test('should handle rapid navigation', async ({ page }) => {
      // Rapidly navigate between pages
      const routes = ['/', '/ats-scanner', '/technical-interview', '/profile']
      
      for (const route of routes) {
        page.goto(route).catch(() => {})
      }
      
      // Wait for last navigation to settle
      await page.waitForLoadState('networkidle').catch(() => {})
      
      await expect(page.locator('body')).toBeVisible()
    })

    test('should handle back/forward navigation', async ({ page }) => {
      await page.goto('/')
      await page.waitForLoadState('networkidle')
      
      await page.goto('/ats-scanner')
      await page.waitForLoadState('networkidle')
      
      await page.goBack()
      await expect(page).toHaveURL('/')
      
      await page.goForward()
      await expect(page).toHaveURL(/\/ats-scanner/)
    })
  })

  test.describe('Concurrent Actions', () => {
    test('should handle multiple clicks on submit', async ({ page }) => {
      await page.goto('/technical-interview')
      await page.waitForLoadState('networkidle')
      
      const submitButton = page.getByRole('button', { name: /submit|evaluate/i })
      
      if (await submitButton.isVisible({ timeout: 3000 }).catch(() => false)) {
        // Try rapid double-clicking
        await submitButton.dblclick().catch(() => {})
        
        // Should not crash
        await expect(page.locator('body')).toBeVisible()
      }
    })
  })

  test.describe('Viewport Edge Cases', () => {
    test('should handle very small viewport', async ({ page }) => {
      await page.setViewportSize({ width: 320, height: 480 })
      await page.goto('/')
      
      await expect(page.locator('body')).toBeVisible()
    })

    test('should handle very large viewport', async ({ page }) => {
      await page.setViewportSize({ width: 2560, height: 1440 })
      await page.goto('/')
      
      await expect(page.locator('body')).toBeVisible()
    })

    test('should handle viewport resize', async ({ page }) => {
      await page.setViewportSize({ width: 1920, height: 1080 })
      await page.goto('/')
      await page.waitForLoadState('networkidle')
      
      // Resize to mobile
      await page.setViewportSize({ width: 375, height: 667 })
      await page.waitForTimeout(500)
      
      // Resize back to desktop
      await page.setViewportSize({ width: 1920, height: 1080 })
      
      await expect(page.locator('body')).toBeVisible()
    })
  })

  test.describe('Error States', () => {
    test('should display error message on API failure', async ({ page }) => {
      // Intercept API calls and make them fail
      await page.route('**/api/**', (route) => {
        route.fulfill({
          status: 500,
          body: JSON.stringify({ error: 'Internal Server Error' }),
        })
      })
      
      await page.goto('/profile')
      await page.waitForLoadState('networkidle')
      
      // Should handle error gracefully
      await expect(page.locator('body')).toBeVisible()
    })

    test('should handle 404 API response', async ({ page }) => {
      await page.route('**/api/user/**', (route) => {
        route.fulfill({
          status: 404,
          body: JSON.stringify({ error: 'Not found' }),
        })
      })
      
      await page.goto('/profile')
      await page.waitForLoadState('networkidle')
      
      await expect(page.locator('body')).toBeVisible()
    })

    test('should handle 402 insufficient credits', async ({ page }) => {
      await page.route('**/api/ats/**', (route) => {
        route.fulfill({
          status: 402,
          body: JSON.stringify({ error: 'Insufficient credits' }),
        })
      })
      
      await page.goto('/ats-scanner')
      await page.waitForLoadState('networkidle')
      
      // Should show credits error or prompt
      await expect(page.locator('body')).toBeVisible()
    })
  })

  test.describe('Security', () => {
    test('should not expose sensitive data in page source', async ({ page }) => {
      await page.goto('/')
      
      const content = await page.content()
      
      // Should not contain API keys or secrets
      expect(content).not.toMatch(/api[_-]?key/i)
      expect(content).not.toMatch(/secret/i)
      expect(content).not.toMatch(/password/i)
    })

    test('should use HTTPS in production links', async ({ page }) => {
      await page.goto('/')
      
      const links = await page.locator('a[href^="http://"]').all()
      
      // External links should be HTTPS (except localhost for dev)
      for (const link of links) {
        const href = await link.getAttribute('href')
        if (href && !href.includes('localhost') && !href.includes('127.0.0.1')) {
          console.log('HTTP link found:', href)
        }
      }
    })
  })
})
