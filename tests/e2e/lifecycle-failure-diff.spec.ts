import { test, expect } from '@playwright/test';

test.describe('Core Lifecycle - Failure & Diff', () => {
  test.beforeEach(async ({ page }) => {
    // 1. Reset demo data
    await page.goto('/settings');
    page.on('dialog', dialog => dialog.accept());
    await page.click('[data-testid="reset-all-data"]');
    
    // 2. Setup initial state: Proposal -> Approve -> Run Plan
    await page.goto('/');
    await page.fill('[data-testid="home-compose-textarea"]', 'Connectivity issues in Region East.');
    await page.click('[data-testid="home-compose-submit"]');
    
    await expect(page.locator('[data-testid="latest-proposal-link"]')).toBeVisible();
    await page.click('[data-testid="latest-proposal-link"]');
    
    await page.click('[data-testid="approve-button"]');
    await page.click('[data-testid="create-run-plan"]');
    await expect(page).toHaveURL(/\/runs\/run_/);
  });

  test('generate failure and compare with diff mode', async ({ page }) => {
    // 1. Generate transcript flaky_inputs (attempt 1)
    await page.selectOption('[data-testid="scenario-selector"]', 'flaky_inputs');
    await page.click('[data-testid="generate-transcript-button"]');
    await expect(page.locator('[data-testid="outcome-badge"]')).toContainText('FAILED');

    // 2. Rerun scenario rate_limited (attempt 2)
    await page.selectOption('[data-testid="scenario-selector"]', 'rate_limited');
    await page.click('[data-testid="generate-transcript-button"]');
    
    // 3. Assert outcome FAILED and contains 429
    const outcome = page.locator('[data-testid="outcome-badge"]');
    await expect(outcome).toContainText('FAILED');
    await expect(page.locator('body')).toContainText('429');

    // 4. Enable diff mode and compare attempt 1 vs 2
    await page.check('[data-testid="diff-mode-toggle"]');
    
    // Select Attempt 1 as the target to compare AGAINST
    // Attempt 2 is current, so we want to select Attempt 1 in the diff selector
    await page.selectOption('[data-testid="diff-target-selector"]', { index: 1 }); // Usually the first/only other one

    // 5. Assert diff summary visible and first error line contains 429
    await expect(page.locator('[data-testid="diff-summary"]')).toBeVisible();
    await expect(page.locator('[data-testid="diff-error-line"]')).toContainText('429');
  });
});
