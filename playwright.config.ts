import { defineConfig, devices } from '@playwright/test'

const PORT = 4173
const baseURL = process.env.E2E_BASE_URL ?? `http://localhost:${PORT}`

export default defineConfig({
  testDir: 'tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: [['list']],
  use: { baseURL, trace: 'retain-on-failure' },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  // Mocked e2e runs against a local production build. When E2E_BASE_URL is set
  // (e.g. a deployed preview), no local server is started.
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : {
        command: `npm run build:e2e && npx vite preview --port ${PORT} --strictPort`,
        url: baseURL,
        reuseExistingServer: !process.env.CI,
        timeout: 180_000,
      },
})
