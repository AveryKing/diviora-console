import { describe, expect, it } from 'vitest';
import { AgentPackSchema } from '../lib/types';

describe('agent pack schema', () => {
  it('validates a complete agent pack', () => {
    const result = AgentPackSchema.safeParse({
      pack_id: 'pack_1',
      created_at: new Date().toISOString(),
      kind: 'issue',
      title: 'Issue Pack: Agent Surface',
      content_markdown: '## Objective\nShip agent',
      inputs: {
        snapshot_id: 'ps_1',
        selected_goals: ['Goal A'],
      },
      status: 'draft',
      note: 'initial',
      codex_task_packet_markdown: '# CODEX_TASK_PACKET',
    });

    expect(result.success).toBe(true);
  });

  it('rejects invalid status', () => {
    const result = AgentPackSchema.safeParse({
      pack_id: 'pack_1',
      created_at: new Date().toISOString(),
      kind: 'issue',
      title: 'Bad',
      content_markdown: 'x',
      inputs: {},
      status: 'pending',
    });

    expect(result.success).toBe(false);
  });

  it('accepts dispatched status', () => {
    const result = AgentPackSchema.safeParse({
      pack_id: 'pack_2',
      created_at: new Date().toISOString(),
      kind: 'issue',
      title: 'Dispatched',
      content_markdown: 'x',
      inputs: {},
      status: 'dispatched',
    });

    expect(result.success).toBe(true);
  });
});
