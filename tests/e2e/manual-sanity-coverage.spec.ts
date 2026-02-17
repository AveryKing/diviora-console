import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

async function seedLifecycleData(page: import('@playwright/test').Page) {
  await page.goto('/settings');
  page.once('dialog', dialog => dialog.accept());
  await page.click('[data-testid="reset-all-data"]');

  await page.goto('/');
  await expect(page.getByTestId('home-compose-textarea')).toBeVisible({ timeout: 60_000 });
  await page.fill('[data-testid="home-compose-textarea"]', 'Seed data for snapshot export import.');
  await page.click('[data-testid="home-compose-submit"]');

  const latestProposalLink = page.locator('[data-testid="latest-proposal-link"]');
  await expect.poll(async () => latestProposalLink.count(), { timeout: 30_000 }).toBeGreaterThan(0);
  await latestProposalLink.click();

  await page.fill('[data-testid="decision-note"]', 'Seed approval note');
  await page.click('[data-testid="approve-button"]');
  await page.click('[data-testid="create-run-plan"]');
  await expect(page).toHaveURL(/\/runs\/run_/);

  await page.selectOption('[data-testid="scenario-selector"]', 'happy_path');
  await page.click('[data-testid="generate-transcript-button"]');
  await expect(page.locator('[data-testid="outcome-badge"]')).toBeVisible({ timeout: 30_000 });
}

test.describe('Manual Sanity Coverage Additions', () => {
  test.setTimeout(90_000);

  test('TC8: snapshot export -> reset -> import -> state restored', async ({ page }, testInfo) => {
    await seedLifecycleData(page);

    await page.goto('/settings');
    const downloadPromise = page.waitForEvent('download');
    await page.click('[data-testid="settings-export-snapshot"]');
    const download = await downloadPromise;

    const exportPath = path.join(testInfo.outputDir, 'manual-snapshot.json');
    await download.saveAs(exportPath);
    expect(fs.existsSync(exportPath)).toBe(true);

    page.once('dialog', dialog => dialog.accept());
    await page.click('[data-testid="reset-all-data"]');

    await page.goto('/artifacts');
    await expect(page.locator('body')).toContainText('No Artifacts');
    await page.goto('/approvals');
    await expect(page.locator('body')).toContainText('No Decisions Yet');
    await page.goto('/runs');
    await expect(page.locator('body')).toContainText('No Run Plans');

    await page.goto('/settings');
    page.once('dialog', dialog => dialog.accept());
    await page.click('[data-testid="settings-import-snapshot"]');
    await page.setInputFiles('[data-testid="settings-import-file-input"]', exportPath);
    await expect(page.locator('body')).toContainText('Snapshot imported successfully!', { timeout: 15_000 });

    await page.goto('/artifacts');
    await expect(page.locator('tbody tr')).toHaveCount(1, { timeout: 15_000 });
    await page.goto('/approvals');
    await expect(page.locator('tbody tr')).toHaveCount(1, { timeout: 15_000 });
    await page.goto('/runs');
    await expect(page.locator('tbody tr')).toHaveCount(1, { timeout: 15_000 });
  });

  test('TC10: mobile smoke at 390 and 768 with no horizontal overflow', async ({ page }) => {
    const widths = [390, 768] as const;

    for (const width of widths) {
      await page.setViewportSize({ width, height: 844 });
      await page.goto('/');
      await expect(page.getByTestId('home-compose-textarea')).toBeVisible();
      await expect(page.getByTestId('home-compose-submit')).toBeVisible();
      await expect(await page.evaluate(() => {
        window.scrollTo({ left: 10_000, top: 0 });
        const hasHorizontalScroll = window.scrollX > 0;
        window.scrollTo({ left: 0, top: 0 });
        return !hasHorizontalScroll;
      })).toBe(true);

      await page.goto('/artifacts');
      await expect(page.getByRole('heading', { name: /^Artifacts$/, exact: true })).toBeVisible();
      await expect(await page.evaluate(() => {
        window.scrollTo({ left: 10_000, top: 0 });
        const hasHorizontalScroll = window.scrollX > 0;
        window.scrollTo({ left: 0, top: 0 });
        return !hasHorizontalScroll;
      })).toBe(true);

      await page.goto('/runs');
      await expect(page.getByRole('heading', { name: /^Runs$/, exact: true })).toBeVisible();
      await expect(await page.evaluate(() => {
        window.scrollTo({ left: 10_000, top: 0 });
        const hasHorizontalScroll = window.scrollX > 0;
        window.scrollTo({ left: 0, top: 0 });
        return !hasHorizontalScroll;
      })).toBe(true);

      await page.goto('/settings');
      await expect(page.getByTestId('reset-all-data')).toBeVisible();
      await expect(await page.evaluate(() => {
        window.scrollTo({ left: 10_000, top: 0 });
        const hasHorizontalScroll = window.scrollX > 0;
        window.scrollTo({ left: 0, top: 0 });
        return !hasHorizontalScroll;
      })).toBe(true);
    }
  });
});
