import { describe, expect, it } from 'vitest';
import { generateCodexTaskPacket } from '../lib/codex_task_packet';
import { AgentPack } from '../lib/types';

describe('generateCodexTaskPacket', () => {
  it('is deterministic and contains required sections', () => {
    const pack: AgentPack = {
      pack_id: 'pack_abc123',
      created_at: '2026-02-17T00:00:00.000Z',
      kind: 'issue',
      title: 'Issue Pack: Main Canvas',
      content_markdown: [
        '## Objective',
        'Make chat the primary surface.',
        '',
        '## Scope',
        '- Move chat to main canvas',
        '- Keep artifacts in right panel',
        '',
        '## Acceptance Criteria',
        '- Focus toggle exists',
        '- No auto-submit on insert',
      ].join('\n'),
      inputs: { snapshot_id: 'snap_1', selected_goals: ['goal'] },
      status: 'approved',
      approval_note: 'approved note',
    };

    const first = generateCodexTaskPacket(pack);
    const second = generateCodexTaskPacket(pack);

    expect(first).toBe(second);
    expect(first).toContain('## Invariants (from AGENTS.md)');
    expect(first).toContain('Suggested branch: codex/issue-pack-main-canvas-abc123');
    expect(first).toContain('- [ ] Focus toggle exists');
    expect(first).toContain('- [ ] No auto-submit on insert');
    expect(first).toContain('## Required Evidence To Paste Back');
  });
});
