import { test, expect } from '@playwright/test';

test.describe('Diviora Agent v0.1 Journey', () => {
  test.setTimeout(60_000);

  test.beforeEach(async ({ page }) => {
    await page.goto('/settings');
    page.on('dialog', (dialog) => dialog.accept());
    await page.click('[data-testid="reset-all-data"]');
    await expect(page.getByText('Reset All Demo Data')).toBeVisible();
  });

  test('snapshot paste -> agent chat -> approve pack -> generate codex task packet', async ({ page }) => {
    await page.goto('/memory');

    const snapshotMarkdown = [
      '# STATE_SNAPSHOT',
      'branch: main',
      'head sha: 1234567890abcdef',
      '| gate | status |',
      '| lint | PASS |',
    ].join('\n');

    await page.fill('[data-testid="memory-paste-input"]', snapshotMarkdown);
    await page.click('[data-testid="memory-save-button"]');
    await expect(page.getByTestId('memory-status')).toContainText('Snapshot saved.');
    await expect(page.getByTestId('memory-list')).toContainText('main');

    const firstSnapshotItem = page.locator('[data-testid^="memory-list-item-"]').first();
    await firstSnapshotItem.click();
    await expect(page.getByTestId('memory-detail')).toContainText('1234567890abcdef');

    await page.goto('/agent');
    await expect(page.getByTestId('agent-page')).toBeVisible();
    await expect(page.getByTestId('agent-chat-main')).toBeVisible();

    await page.click('[data-testid="agent-tab-memory"]');
    await expect(page.getByTestId('agent-memory-panel')).toContainText('STATE_SNAPSHOT');

    await page.click('[data-testid="agent-tab-packs"]');
    await page.evaluate(() => {
      window.dispatchEvent(
        new CustomEvent('diviora:agent-pack-proposed', {
          detail: {
            kind: 'issue',
            title: 'Issue Pack: Agent v0.1 Sanity',
            content_markdown: [
              '## Objective',
              'Validate v0.1 flow',
              '',
              '## Scope',
              '- Sanity checks',
              '',
              '## Acceptance Criteria',
              '- Packet generated',
            ].join('\n'),
            selected_goals: ['Sanity checks'],
            source_input: 'Sanity checks',
          },
        })
      );
    });

    await expect(page.getByTestId('agent-pack-proposed')).toBeVisible();
    await page.click('[data-testid="agent-pack-create-draft"]');
    await expect(page.getByTestId('agent-packs-list')).toContainText('Issue Pack: Agent v0.1 Sanity');

    await page.fill('[data-testid="agent-pack-note-input"]', 'Approved via journey e2e');
    await page.click('[data-testid="agent-pack-approve"]');
    await expect(page.getByTestId('agent-pack-status-badge')).toContainText('approved');

    await page.click('[data-testid="agent-pack-generate-codex-task-packet"]');
    await expect(page.getByTestId('agent-pack-status-badge')).toContainText('approved');
    await expect(page.getByTestId('agent-pack-codex-task-packet')).toContainText('## Invariants (from AGENTS.md)');
    await expect(page.getByTestId('agent-pack-codex-task-packet')).toContainText('Suggested branch: codex/issue-pack-agent-v0-1-sanity');
  });
});
