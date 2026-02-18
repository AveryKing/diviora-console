import { render, screen } from '@testing-library/react';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import DispatchDetailPage from '../app/dispatch/[dispatch_id]/page';
import { StoreProvider } from '../lib/store';

vi.mock('next/navigation', () => ({
  useParams: () => ({ dispatch_id: 'disp_abc_20260101000000' }),
}));

describe('Dispatch detail page', () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem('diviora.proposals.v1', JSON.stringify({ schema_version: 1, items: [] }));
    localStorage.setItem('diviora.decisions.v1', JSON.stringify({ schema_version: 1, items: [] }));
    localStorage.setItem('diviora.runs.v1', JSON.stringify({ schema_version: 1, items: [] }));
    localStorage.setItem('diviora.transcripts.v1', JSON.stringify({ schema_version: 1, items: [] }));
    localStorage.setItem('diviora.project_snapshots.v1', JSON.stringify({ schema_version: 1, items: [] }));
    localStorage.setItem('diviora.agent_packs.v1', JSON.stringify({ schema_version: 1, items: [] }));
    localStorage.setItem('diviora.dispatch_records.v1', JSON.stringify({
      schema_version: 1,
      items: [{
        dispatch_id: 'disp_abc_20260101000000',
        created_at: '2026-01-01T00:00:00.000Z',
        pack_id: 'pack_1',
        destination: 'manual_export',
        payload_json: '{"work":"x"}',
        payload_hash: 'abc123',
        status: 'queued',
        attempts: 0,
        transitions: [{ status: 'queued', at: '2026-01-01T00:00:00.000Z' }],
      }],
    }));
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

  it('renders payload hash and timeline', async () => {
    render(
      <StoreProvider>
        <DispatchDetailPage />
      </StoreProvider>
    );

    expect(await screen.findByTestId('dispatch-detail-page')).toBeInTheDocument();
    expect(screen.getByTestId('dispatch-payload-hash')).toHaveTextContent('abc123');
    expect(screen.getByTestId('dispatch-status-timeline')).toHaveTextContent('QUEUED');
    expect(screen.getByTestId('dispatch-mark-sent')).toBeEnabled();
    expect(screen.getByTestId('dispatch-mark-acked')).toBeDisabled();
  });
});
