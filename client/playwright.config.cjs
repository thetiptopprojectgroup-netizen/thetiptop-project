// @ts-check
const { defineConfig, devices } = require('@playwright/test');

/**
 * Configuration Playwright de base pour tests E2E multi-navigateurs.
 */
module.exports = defineConfig({
  testDir: './tests/e2e',
  timeout: 30 * 1000,
  expect: {
    timeout: 5000
  },
  fullyParallel: true,
  retries: process.env.CI ? 1 : 0,
  use: {
    baseURL: process.env.E2E_BASE_URL || 'http://localhost:4173',
    trace: 'on-first-retry'
  },
  webServer: {
    command: process.env.CI
      ? 'npm run build && npx vite preview --port 4173'
      : 'npm run dev -- --port 4173',
    url: 'http://localhost:4173',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000
  },
  projects: process.env.E2E_BROWSER === 'chromium'
    ? [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }]
    : [
        { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
        { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
        { name: 'webkit', use: { ...devices['Desktop Safari'] } }
      ]
});

