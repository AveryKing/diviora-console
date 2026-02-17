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

  test('creates draft pack from proposed event and approves it', async ({ page }) => {
    await page.addInitScript(() => {
      const now = new Date().toISOString();
      const snapshotCollection = {
        schema_version: 1,
        items: [
          {
            snapshot_id: 'ps_test_2',
            created_at: now,
            source: 'manual_paste',
            branch: 'main',
            head_sha: 'fedcba9876543210',
            raw_markdown: 'STATE_SNAPSHOT.md',
            parsed_summary: { parse_status: 'parsed' },
          },
        ],
      };
      window.localStorage.setItem('diviora.project_snapshots.v1', JSON.stringify(snapshotCollection));
    });

    await page.goto('/agent');
    await page.click('[data-testid="agent-tab-packs"]');

    await page.evaluate(() => {
      window.dispatchEvent(
        new CustomEvent('diviora:agent-pack-proposed', {
          detail: {
            kind: 'issue',
            title: 'Issue Pack: Agent Packs',
            content_markdown: '## Objective\\nValidate agent packs flow',
            selected_goals: ['Validate flow'],
            source_input: 'Validate flow',
          },
        })
      );
    });

    await expect(page.getByTestId('agent-pack-proposed')).toBeVisible();
    await page.click('[data-testid="agent-pack-create-draft"]');

    await expect(page.getByTestId('agent-packs-list')).toContainText('Issue Pack: Agent Packs');
    await page.fill('[data-testid="agent-pack-note-input"]', 'Approved in e2e');
    await page.click('[data-testid="agent-pack-approve"]');
    await expect(page.getByTestId('agent-pack-status-badge')).toContainText('approved');
    await expect(page.getByTestId('agent-packs-list')).toContainText('approved');
  });
});
