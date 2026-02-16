import { defineConfig, devices } from '@playwright/test';

const E2E_PORT = Number(process.env.PLAYWRIGHT_WEB_PORT ?? '3100');
const E2E_BASE_URL = `http://localhost:${E2E_PORT}`;
const AUTH_TOKEN =
  process.env.DIVIORA_CONSOLE_AUTH_TOKEN ??
  process.env.NEXT_PUBLIC_DIVIORA_CONSOLE_AUTH_TOKEN ??
  'test-token';

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: './tests/e2e',
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: 0,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: [['html', { open: 'never', outputFolder: 'test-results/playwright-report' }]],
  outputDir: 'test-results/playwright-artifacts',
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: E2E_BASE_URL,

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',
    
    /* Avoid opening copilot sidebar by default or interfering with LLM */
    extraHTTPHeaders: {
      'x-playwright-test': 'true',
    },
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  /* Run your local dev server before starting the tests */
  webServer: {
    // In CI we run against `next start`, but the client bundle needs NEXT_PUBLIC_* values
    // inlined at build time. Rebuilding here keeps e2e hermetic and avoids auth header
    // being omitted in production mode.
    command: process.env.CI
      ? `npx next build && npx next start --port ${E2E_PORT}`
      : `npx next dev --port ${E2E_PORT}`,
    url: `${E2E_BASE_URL}/api/health`,
    env: {
      ...process.env,
      PORT: String(E2E_PORT),
      DIVIORA_CONSOLE_AUTH_TOKEN: AUTH_TOKEN,
      NEXT_PUBLIC_DIVIORA_CONSOLE_AUTH_TOKEN: AUTH_TOKEN,
      OPENAI_API_KEY: process.env.OPENAI_API_KEY ?? 'test-key',
    },
    reuseExistingServer: false,
    timeout: 120_000,
  },
});
