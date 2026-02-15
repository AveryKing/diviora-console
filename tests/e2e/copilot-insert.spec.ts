import { test, expect } from '@playwright/test';

test.describe('Copilot Insert (Optional C)', () => {
  test.setTimeout(60_000);

  test.beforeEach(async ({ page }) => {
    // 1. Reset demo data
    // 1. Reset demo data via Settings
    await page.goto('/settings');
    page.on('dialog', dialog => dialog.accept());
    await page.click('[data-testid="reset-all-data"]');
    await expect(page.getByText('Reset All Demo Data')).toBeVisible();
    await page.goto('/');
    await expect(page.getByTestId('home-compose-textarea')).toBeVisible({ timeout: 60_000 });
  });

  test('no-submit on insert', async ({ page }) => {
    // 2. Open Copilot Sidebar (if closed initially, toggle button might not be visible depending on screen size, assuming desktop default visible or toggle)
    // Wait, sidebar is inside the page. Let's make sure we can trigger the draft event.
    
    // 3. Mock a suggestion via event dispatch (bypassing LLM)
    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('diviora:copilot-draft', { detail: { draft: 'Mock Draft Suggestion' } }));
    });

    // 4. Assert suggestion appears in StreamingText
    const suggestion = page.getByTestId('copilot-suggestion');
    await expect(suggestion).toContainText('Mock Draft Suggestion');

    // 5. Click Insert
    const insertBtn = page.getByTestId('home-insert-draft-btn');
    await insertBtn.click();

    // 6. Assert Home textarea filled
    const textarea = page.getByTestId('home-compose-textarea');
    await expect(textarea).toHaveValue('Mock Draft Suggestion');

    // 7. Assert NO compilation request fired (fail-closed check)
    // We can check if we navigated away or if a network request happened.
    // Since compilation navigates to /compile or /proposal/[id], staying on / is a good sign.
    await expect(page).toHaveURL('/');
    
    // Also, check that the "Compile" button is still visible and enabled/clickable needed to submit manually.
    const compileBtn = page.getByTestId('home-compose-submit');
    await expect(compileBtn).toBeVisible();
  });
});
