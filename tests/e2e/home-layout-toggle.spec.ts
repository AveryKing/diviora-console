import { test, expect } from '@playwright/test';

test.describe('Home Layout - Focus Toggle', () => {
  test.setTimeout(60_000);

  test.beforeEach(async ({ page }) => {
    await page.goto('/settings');
    page.on('dialog', dialog => dialog.accept());
    await page.click('[data-testid="reset-all-data"]');
  });

  test('toggle focus hides and shows the right panel', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByTestId('home-chat-main')).toBeVisible({ timeout: 60_000 });

    await expect(page.getByTestId('home-right-panel')).toBeVisible();
    await page.click('[data-testid="home-focus-toggle"]');
    await expect(page.getByTestId('home-right-panel')).toBeHidden();

    await page.click('[data-testid="home-focus-toggle"]');
    await expect(page.getByTestId('home-right-panel')).toBeVisible();
  });

  test('latest proposal renders in-context in Artifact tab', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByTestId('home-compose-textarea')).toBeVisible({ timeout: 60_000 });
    await page.fill('[data-testid="home-compose-textarea"]', 'In-context render check.');
    await expect(page.getByTestId('home-compose-submit')).toBeEnabled();
    await page.click('[data-testid="home-compose-submit"]');

    await page.click('[data-testid="home-artifact-tab-artifact"]');
    await expect(page.getByTestId('proposal-sections')).toBeVisible({ timeout: 30_000 });
  });
});

