import { test, expect } from '@playwright/test'

test('app loads and shows Brétema shell', async ({ page }) => {
  await page.goto('/')
  await expect(page).toHaveTitle(/Brétema/)
  // App shell renders without JS error
  await expect(page.locator('main')).toBeVisible()
})
