import { expect, test } from '@playwright/test';

test.describe('Authority queue dispatch ledger', () => {
  test('approve -> dispatch -> sent -> acked with ledger linkage', async ({ page }) => {
    await page.goto('/queue');

    await page.evaluate(() => {
      localStorage.setItem(
        'diviora.agent_packs.v1',
        JSON.stringify({
          schema_version: 1,
          items: [
            {
              pack_id: 'pack_e2e_1',
              created_at: '2026-01-01T00:00:00.000Z',
              kind: 'issue',
              title: 'E2E Draft Pack',
              content_markdown: 'content',
              codex_task_packet_markdown: '{"task":"run"}',
              inputs: {},
              status: 'draft',
            },
          ],
        })
      );
      localStorage.setItem('diviora.dispatch_records.v1', JSON.stringify({ schema_version: 1, items: [] }));
      localStorage.setItem('diviora.project_snapshots.v1', JSON.stringify({ schema_version: 1, items: [] }));
      localStorage.setItem('diviora.proposals.v1', JSON.stringify({ schema_version: 1, items: [] }));
      localStorage.setItem('diviora.decisions.v1', JSON.stringify({ schema_version: 1, items: [] }));
      localStorage.setItem('diviora.runs.v1', JSON.stringify({ schema_version: 1, items: [] }));
      localStorage.setItem('diviora.transcripts.v1', JSON.stringify({ schema_version: 1, items: [] }));
      localStorage.setItem('diviora.settings.v1', JSON.stringify({
        schema_version: 1,
        proposal_style: 'detailed',
        risk_level: 'medium',
        default_step_count: 5,
        timeline_mode: 'expanded',
        agent_view_mode: 'split',
        template_id: 'generic',
      }));
      localStorage.setItem('diviora.metadata.v1', JSON.stringify({}));
    });

    await page.reload();
    await page.fill('[data-testid="authority-note-pack_e2e_1"]', 'Approved by reviewer.');
    await page.click('[data-testid="authority-approve-pack_e2e_1"]');

    await expect(page.getByTestId('authority-dispatch-pack_e2e_1')).toBeVisible();
    await page.click('[data-testid="authority-dispatch-pack_e2e_1"]');

    await expect(page).toHaveURL(/\/dispatch\/disp_/);
    await expect(page.getByTestId('dispatch-detail-page')).toBeVisible();
    await expect(page.getByTestId('dispatch-payload-hash')).toContainText(/^[a-f0-9]{64}$/);

    await page.click('[data-testid="dispatch-mark-sent"]');
    await page.click('[data-testid="dispatch-mark-acked"]');

    await expect(page.getByTestId('dispatch-status-timeline')).toContainText('ACKED');

    await page.goto('/dispatch');
    await expect(page.locator('[data-testid^="dispatch-row-disp_"]')).toBeVisible();
    await expect(page.locator('[data-testid^="dispatch-row-disp_"]')).toContainText('pack=pack_e2e_1');
  });
});
