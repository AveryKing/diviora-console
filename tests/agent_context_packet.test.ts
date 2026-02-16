import { describe, it, expect } from 'vitest';
import { buildAgentContextPacket } from '../lib/agent_context_packet';

describe('agent context packet', () => {
  it('builds deterministic packet from latest snapshot and latest proposal', () => {
    const settings = {
      schema_version: 1 as const,
      proposal_style: 'detailed' as const,
      risk_level: 'medium' as const,
      default_step_count: 5 as const,
      timeline_mode: 'expanded' as const,
      template_id: 'bug_triage' as const,
      agent_view_mode: 'focus' as const,
    };

    const packet = buildAgentContextPacket({
      settings,
      proposals: [
        {
          proposal_id: 'p_old',
          created_at: '2026-01-01T00:00:00.000Z',
          input: { message: 'old' },
          proposal: { title: 'old', summary: 'old', next_actions: [], risks: [], template_id: 'generic' },
        },
        {
          proposal_id: 'p_new',
          created_at: '2026-02-01T00:00:00.000Z',
          input: { message: 'new' },
          proposal: { title: 'new', summary: 'new', next_actions: [], risks: [], template_id: 'project_plan' },
        },
      ],
      projectSnapshots: [
        {
          snapshot_id: 'ps_1',
          created_at: '2026-02-03T00:00:00.000Z',
          source: 'manual_paste',
          branch: 'main',
          head_sha: 'abc123',
          raw_markdown: '# one',
          parsed_summary: { parse_status: 'parsed' },
        },
        {
          snapshot_id: 'ps_2',
          created_at: '2026-02-04T00:00:00.000Z',
          source: 'manual_paste',
          branch: 'feat',
          head_sha: 'def456',
          raw_markdown: '# two',
          parsed_summary: { parse_status: 'parsed' },
        },
      ],
    });

    expect(packet.latestProposal?.proposal_id).toBe('p_new');
    expect(packet.latestProjectSnapshot?.snapshot_id).toBe('ps_2');
    expect(packet.settings.agent_view_mode).toBe('focus');
  });
});
