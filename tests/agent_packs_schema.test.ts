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
});
