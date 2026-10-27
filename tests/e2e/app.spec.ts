import { expect, test } from '@playwright/test'
import { E2E_LOGIN, highAlert, liveEvent, mockRest, mockSocket } from './mockBackend'

/**
 * Deterministic critical-path run against a production build with a mocked backend
 * (contract fixtures captured from staging). See staging.spec.ts for the live run.
 */
test.beforeEach(async ({ page }) => {
  await mockRest(page)
})

test('login → overview with live updates → crowd entries pagination → logout', async ({ page }) => {
  const socket = await mockSocket(page)
  await page.goto('/overview')
  await expect(page).toHaveURL(/\/login$/)

  await page.getByRole('button', { name: 'Login' }).click()
  await expect(page.getByText('Email is required')).toBeVisible()

  await page.getByLabel(/log in/i).fill(E2E_LOGIN.email)
  await page.getByLabel(/^password/i).fill('wrong')
  await page.getByRole('button', { name: 'Login' }).click()
  await expect(page.getByRole('alert')).toHaveText(/invalid email or password/i)

  await page.getByLabel(/^password/i).fill(E2E_LOGIN.password)
  await page.getByRole('button', { name: 'Login' }).click()
  await expect(page).toHaveURL(/\/overview/)
  await expect(page.getByRole('heading', { name: 'Overview', level: 1 })).toBeVisible()
  await expect(page.getByText('926')).toBeVisible()
  await expect(page.getByText('10% more than yesterday')).toBeVisible()
  await expect(page.locator('.recharts-surface').first()).toBeVisible()

  await expect(page.getByRole('status').filter({ hasText: 'Live feed: Live' })).toBeVisible()
  socket.emit('live_occupancy', liveEvent())
  await expect(page.getByText('122', { exact: true })).toBeVisible()
  socket.emit('alert', highAlert())
  await expect(page.getByText(/high-severity alert: joanne pacocha entered/i)).toBeVisible()
  await page.screenshot({ path: 'test-results/overview.png' })

  await page.getByRole('link', { name: 'Crowd Entries' }).click()
  await expect(page.getByRole('heading', { name: 'Crowd Entries', level: 1 })).toBeVisible()
  await expect(page.getByText('Visitor Page 1')).toBeVisible()
  await page.getByRole('button', { name: 'Page 2', exact: true }).click()
  await expect(page.getByText('Visitor Page 2')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Page 2', exact: true })).toHaveAttribute(
    'aria-current',
    'page',
  )
  await page.screenshot({ path: 'test-results/entries.png', fullPage: true })

  await page.getByRole('button', { name: 'Logout' }).click()
  await expect(page).toHaveURL(/\/login$/)
  await page.goto('/entries')
  await expect(page).toHaveURL(/\/login$/)
})

test('keyboard-only sign-in reaches the dashboard', async ({ page }) => {
  await mockSocket(page)
  await page.goto('/login')
  await expect(page.getByLabel(/log in/i)).toBeVisible()
  await page.keyboard.press('Tab')
  await expect(page.getByLabel(/log in/i)).toBeFocused()
  await page.keyboard.type(E2E_LOGIN.email)
  await page.keyboard.press('Tab')
  await page.keyboard.type(E2E_LOGIN.password)
  await page.keyboard.press('Enter')
  await expect(page.getByRole('heading', { name: 'Overview', level: 1 })).toBeVisible()
})

test('mobile layout has no horizontal overflow', async ({ page }) => {
  await mockSocket(page)
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/login')
  await page.getByLabel(/log in/i).fill(E2E_LOGIN.email)
  await page.getByLabel(/^password/i).fill(E2E_LOGIN.password)
  await page.getByRole('button', { name: 'Login' }).click()
  await expect(page.getByText('926')).toBeVisible()
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
  expect(overflow).toBeLessThanOrEqual(0)
  await page.screenshot({ path: 'test-results/overview-mobile.png', fullPage: true })
})
