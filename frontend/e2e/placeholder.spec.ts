import { test, expect } from '@playwright/test'

// Placeholder test - will be replaced with real tests later
test('page loads and has content', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('body')).not.toBeEmpty()
})
