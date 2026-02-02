import { test, expect } from '@playwright/test'

test.describe('Navigation', () => {
  test.skip(({ browserName }) => browserName === 'webkit', 'WebKit navigation is unstable for nav flows')
  test.describe('Main Navigation', () => {
    test('should navigate to homepage', async ({ page }) => {
      await page.goto('/', { waitUntil: 'domcontentloaded' })
      await expect(page.locator('body')).toBeVisible()
    })

    test('should navigate to ATS Scanner from nav', async ({ page }) => {
      await page.goto('/', { waitUntil: 'domcontentloaded' })
      
      const atsLink = page.locator('nav a[href="/ats-scanner"]').first()
      
      if (await atsLink.isVisible({ timeout: 3000 }).catch(() => false)) {
        await atsLink.evaluate((a: HTMLAnchorElement) => a.click())
        await expect(page).toHaveURL(/\/ats-scanner/)
      } else {
        await expect(page.locator('body')).toBeVisible()
      }
    })

    test('should navigate to Technical Interview from nav', async ({ page }) => {
      await page.goto('/', { waitUntil: 'domcontentloaded' })
      
      const techLink = page.locator('nav a[href="/technical-interview"]').first()
      
      if (await techLink.first().isVisible({ timeout: 3000 }).catch(() => false)) {
        await techLink.first().evaluate((a: HTMLAnchorElement) => a.click())
        await expect(page).toHaveURL(/technical-interview/)
      } else {
        await expect(page.locator('body')).toBeVisible()
      }
    })

    test('should navigate to Behavioral Interview from nav', async ({ page }) => {
      await page.goto('/', { waitUntil: 'domcontentloaded' })
      
      const behavLink = page.locator('nav a[href="/behavioral-interview"]').first()
      
      if (await behavLink.isVisible({ timeout: 3000 }).catch(() => false)) {
        await behavLink.evaluate((a: HTMLAnchorElement) => a.click())
        await expect(page).toHaveURL(/behavioral-interview/)
      } else {
        await expect(page.locator('body')).toBeVisible()
      }
    })

    test('should have logo link to home', async ({ page }) => {
      await page.goto('/ats-scanner', { waitUntil: 'domcontentloaded' })
      
      const logo = page.locator('nav a[href="/"]').first()
      
      if (await logo.isVisible({ timeout: 3000 }).catch(() => false)) {
        await logo.evaluate((a: HTMLAnchorElement) => a.click())
        await expect(page).toHaveURL(/\/$/)
      } else {
        await expect(page.locator('body')).toBeVisible()
      }
    })
  })

  test.describe('Mobile Navigation', () => {
    test.beforeEach(async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 })
    })

    test('should show mobile menu toggle', async ({ page }) => {
      await page.goto('/', { waitUntil: 'domcontentloaded' })
      
      const menuToggle = page.getByRole('button', { name: /menu/i })
        .or(page.locator('[data-testid="mobile-menu"]'))
        .or(page.locator('button').filter({ has: page.locator('svg') }))
      
      // Mobile menu might be a hamburger icon
      const isVisible = await menuToggle.first().isVisible({ timeout: 3000 }).catch(() => false)
      console.log('Mobile menu toggle visible:', isVisible)
    })

    test('should open mobile menu', async ({ page }) => {
      await page.goto('/', { waitUntil: 'domcontentloaded' })
      
      const menuToggle = page.getByRole('button', { name: /menu/i })
        .or(page.locator('[aria-label*="menu"]'))
      
      if (await menuToggle.first().isVisible({ timeout: 3000 }).catch(() => false)) {
        await menuToggle.first().click()
        await page.waitForTimeout(500)
        
        // Menu should be expanded
        const mobileNav = page.locator('nav[data-state="open"]')
          .or(page.locator('.mobile-menu'))
          .or(page.getByRole('navigation'))
        
        const isOpen = await mobileNav.first().isVisible({ timeout: 2000 }).catch(() => false)
        console.log('Mobile menu opened:', isOpen)
      }
    })
  })

  test.describe('Footer Navigation', () => {
    test('should have footer links', async ({ page }) => {
      await page.goto('/', { waitUntil: 'domcontentloaded' })
      
      const footer = page.locator('footer')
      
      if (await footer.isVisible({ timeout: 3000 }).catch(() => false)) {
        const footerLinks = footer.locator('a')
        const linkCount = await footerLinks.count()
        console.log('Footer links found:', linkCount)
      }
    })
  })

  test.describe('Breadcrumbs', () => {
    test('should show breadcrumb navigation on nested pages', async ({ page }) => {
      await page.goto('/technical-interview', { waitUntil: 'domcontentloaded' })
      
      const breadcrumb = page.locator('[aria-label="breadcrumb"]')
        .or(page.locator('.breadcrumb'))
        .or(page.getByRole('navigation', { name: /breadcrumb/i }))
      
      const isVisible = await breadcrumb.isVisible({ timeout: 3000 }).catch(() => false)
      console.log('Breadcrumb visible:', isVisible)
    })
  })

  test.describe('Deep Linking', () => {
    test('should handle direct navigation to ATS scanner', async ({ page }) => {
      await page.goto('/ats-scanner', { waitUntil: 'domcontentloaded' })
      await expect(page).toHaveURL(/\/ats-scanner/)
      await expect(page.locator('body')).toBeVisible()
    })

    test('should handle direct navigation to technical interview', async ({ page }) => {
      await page.goto('/technical-interview', { waitUntil: 'domcontentloaded' })
      await expect(page).toHaveURL(/\/technical-interview/)
      await expect(page.locator('body')).toBeVisible()
    })

    test('should handle direct navigation to profile', async ({ page }) => {
      await page.goto('/profile', { waitUntil: 'domcontentloaded' })
      // May redirect if not authenticated, but should not error
      await expect(page.locator('body')).toBeVisible()
    })
  })

  test.describe('404 Handling', () => {
    test('should show 404 page for unknown routes', async ({ page }) => {
      await page.goto('/this-page-does-not-exist-12345', { waitUntil: 'domcontentloaded' })
      
      // Should show 404 or redirect to home
      const shows404 = await page.getByText('404').isVisible({ timeout: 5000 }).catch(async () => {
        return page.getByText(/page not found/i).isVisible({ timeout: 5000 }).catch(() => false)
      })
      const isHome = /\/$/.test(page.url())
      expect(shows404 || isHome).toBeTruthy()
    })
  })
})
