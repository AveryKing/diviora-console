import { test, expect } from '@playwright/test';

test.describe('Agent Main Surface', () => {
  test.setTimeout(60_000);

  test.beforeEach(async ({ page }) => {
    await page.goto('/settings');
    page.on('dialog', (dialog) => dialog.accept());
    await page.click('[data-testid="reset-all-data"]');
  });

  test('renders /agent chat and focus toggle works', async ({ page }) => {
    await page.goto('/agent');
    await expect(page.getByTestId('agent-page')).toBeVisible();
    await expect(page.getByTestId('agent-chat-main')).toBeVisible();
    await expect(page.getByTestId('agent-right-panel')).toBeVisible();

    await page.click('[data-testid="agent-focus-toggle"]');
    await expect(page.getByTestId('agent-right-panel')).toBeHidden();

    await page.click('[data-testid="agent-focus-toggle"]');
    await expect(page.getByTestId('agent-right-panel')).toBeVisible();
  });

  test('memory tab shows latest snapshot raw markdown', async ({ page }) => {
    await page.addInitScript(() => {
      const now = new Date().toISOString();
      const snapshotCollection = {
        schema_version: 1,
        items: [
          {
            snapshot_id: 'ps_test_1',
            created_at: now,
            source: 'manual_paste',
            branch: 'main',
            head_sha: 'abcdef1234567890',
            raw_markdown: 'STATE_SNAPSHOT.md\\nbranch: main\\nhead sha: abcdef1234567890',
            parsed_summary: {
              parse_status: 'parsed',
              gate_statuses: [{ gate: 'lint', status: 'PASS' }],
            },
          },
        ],
      };
      window.localStorage.setItem('diviora.project_snapshots.v1', JSON.stringify(snapshotCollection));
    });

    await page.goto('/agent');
    await page.click('[data-testid="agent-tab-memory"]');
    await expect(page.getByTestId('agent-memory-panel')).toContainText('STATE_SNAPSHOT.md');
    await expect(page.getByTestId('agent-memory-panel')).toContainText('abcdef1234567890');
  });
});
