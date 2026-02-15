import { expect, type Page } from '@playwright/test';

export async function waitForComposeReady(page: Page): Promise<void> {
  const textarea = page.getByTestId('home-compose-textarea');
  try {
    await expect(textarea).toBeVisible({ timeout: 5000 });
  } catch {
    // Fallback: if no active session is selected yet, create one explicitly.
    const createSession = page.getByTestId('session-new');
    if (await createSession.isVisible().catch(() => false)) {
      await createSession.click();
    }
    await expect(textarea).toBeVisible({ timeout: 30000 });
  }

  // Stabilize around transient remounts before interaction.
  await expect
    .poll(async () => {
      const handle = await textarea.elementHandle();
      if (!handle) return false;
      try {
        return await handle.evaluate((el) => el.isConnected);
      } catch {
        return false;
      }
    }, { timeout: 5000, intervals: [200] })
    .toBe(true);
}

export async function fillComposeWithRetry(page: Page, message: string): Promise<void> {
  for (let attempt = 0; attempt < 4; attempt += 1) {
    try {
      await waitForComposeReady(page);
      await page.fill('[data-testid="home-compose-textarea"]', message);
      return;
    } catch (error) {
      if (attempt === 3) throw error;
      await page.waitForTimeout(250);
    }
  }
}

export async function clickComposeSubmitWithRetry(page: Page): Promise<void> {
  for (let attempt = 0; attempt < 4; attempt += 1) {
    try {
      await page.click('[data-testid="home-compose-submit"]');
      return;
    } catch (error) {
      if (attempt === 3) throw error;
      await page.waitForTimeout(250);
    }
  }
}
