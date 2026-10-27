import { expect, test } from '@playwright/test'

/**
 * Live critical-path check against the real staging backend.
 * Requires E2E_BASE_URL (an app build pointed at staging) plus E2E_EMAIL / E2E_PASSWORD
 * supplied from the shell or CI secrets — credentials are never committed.
 */
const email = process.env.E2E_EMAIL
const password = process.env.E2E_PASSWORD

test.skip(
  !email || !password || !process.env.E2E_BASE_URL,
  'Set E2E_BASE_URL, E2E_EMAIL and E2E_PASSWORD to run',
)

test('staging: sign in, see live data and paginate entries', async ({ page }) => {
  await page.goto('/login')
  await page.getByLabel(/log in/i).fill(email ?? '')
  await page.getByLabel(/^password/i).fill(password ?? '')
  await page.getByRole('button', { name: 'Login' }).click()

  await expect(page.getByRole('heading', { name: 'Overview', level: 1 })).toBeVisible()
  await expect(page.getByText(/more than|less than|same as|no comparison/i).first()).toBeVisible({
    timeout: 15_000,
  })
  await expect(page.getByRole('status').filter({ hasText: 'Live feed: Live' })).toBeVisible({
    timeout: 15_000,
  })
  await expect(page.locator('.recharts-surface').first()).toBeVisible()

  await page.getByRole('link', { name: 'Crowd Entries' }).click()
  await expect(page.getByText(/showing 1–10 of/i)).toBeVisible({ timeout: 15_000 })
  await page.getByRole('button', { name: 'Page 2', exact: true }).click()
  await expect(page.getByText(/showing 11–20 of/i)).toBeVisible()
})
