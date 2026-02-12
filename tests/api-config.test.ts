import { describe, it, expect } from 'vitest';
import { POST } from '../app/api/compile/route';
import { NextRequest } from 'next/server';

describe('API: Config-Aware Compile (Issue #7)', () => {
  it('respects default_step_count in next_actions length', async () => {
    const req = new NextRequest('http://localhost:3000/api/compile', {
      method: 'POST',
      body: JSON.stringify({ 
        message: 'hello world',
        settings: {
          proposal_style: 'concise',
          risk_level: 'low',
          default_step_count: 3
        }
      }),
    });

    const res = await POST(req);
    const data = await res.json();

    expect(data.proposal.next_actions.length).toBe(3);
  });

  it('reflects detailed style in summary', async () => {
    const req = new NextRequest('http://localhost:3000/api/compile', {
      method: 'POST',
      body: JSON.stringify({ 
        message: 'hello world',
        settings: {
          proposal_style: 'detailed',
          risk_level: 'medium',
          default_step_count: 5
        }
      }),
    });

    const res = await POST(req);
    const data = await res.json();

    expect(data.proposal.summary).toContain('detailed breakdown');
    expect(data.proposal.summary).toContain('medium risk factors');
  });
});
