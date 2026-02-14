import { test, expect } from '@playwright/test';

test.describe('Core Lifecycle - Happy Path', () => {
  test.beforeEach(async ({ page }) => {
    // 1. Reset demo data at start to guarantee clean state (Invariant I3)
    await page.goto('/settings');
    page.on('dialog', dialog => dialog.accept());
    await page.click('[data-testid="reset-all-data"]');
    await expect(page.getByText('Reset All Demo Data')).toBeVisible();
  });

  test('Proposal -> Approval -> Run Plan -> Transcript (SUCCESS)', async ({ page }) => {
    // 2. Set settings: bug_triage, detailed, high, 7, expanded
    await page.goto('/settings');
    await page.selectOption('[data-testid="settings-template"]', 'bug_triage');
    await page.click('[data-testid="settings-style-detailed"]');
    await page.selectOption('[data-testid="settings-risk"]', 'high');
    await page.click('[data-testid="settings-steps-7"]');
    await page.click('[data-testid="settings-timeline-expanded"]');

    // 3. Submit bug message
    await page.goto('/');
    const bugMessage = 'Fixed button overlap on mobile in the checkout flow.';
    await page.fill('[data-testid="chat-input"]', bugMessage);
    await page.click('[data-testid="chat-submit"]');

    // 4. Assert latest proposal shows “Reproduction Steps” (part of bug_triage template)
    await expect(page.locator('[data-testid="latest-proposal-container"]')).toContainText('Reproduction Steps');

    // 5. Open artifacts newest detail and assert template badge bug_triage
    await page.click('[data-testid="latest-proposal-container"] >> text=View Full Detailed Artifact');
    await expect(page.locator('[data-testid="proposal-template-badge"]')).toContainText(/BUG TRIAGE/i);

    // 6. Approve with note
    await page.fill('[data-testid="decision-note"]', 'Verified fix in staging.');
    await page.click('[data-testid="approve-button"]');

    // 7. Create run plan
    await page.click('[data-testid="create-run-plan"]');
    await expect(page).toHaveURL(/\/runs\/run_/);

    // 8. Generate transcript with happy_path
    await page.selectOption('[data-testid="scenario-selector"]', 'happy_path');
    await page.click('[data-testid="generate-transcript-button"]');

    // 9. Assert outcome SUCCESS or WARNING
    const outcome = page.locator('[data-testid="outcome-badge"]');
    await expect(outcome).toBeVisible();
    const text = await outcome.innerText();
    expect(['SUCCESS', 'WARNING']).toContain(text);
  });
});
