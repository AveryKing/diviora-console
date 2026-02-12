import { describe, it, expect } from 'vitest';
import { POST } from '../app/api/compile/route';
import { NextRequest } from 'next/server';

describe('API: Config-Aware Compile (Issue #7 & #10)', () => {
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

  it('reflects detailed style in summary (generic template)', async () => {
    const req = new NextRequest('http://localhost:3000/api/compile', {
      method: 'POST',
      body: JSON.stringify({ 
        message: 'hello world',
        settings: {
          proposal_style: 'detailed',
          risk_level: 'medium',
          default_step_count: 5,
          template_id: 'generic'
        }
      }),
    });

    const res = await POST(req);
    const data = await res.json();

    expect(data.proposal.summary).toContain('Comprehensive analysis');
  });

  it('generates proposal with selected template structure', async () => {
    const req = new NextRequest('http://localhost:3000/api/compile', {
      method: 'POST',
      body: JSON.stringify({ 
        message: 'Outreach campaign',
        settings: {
          template_id: 'sales_outreach',
          proposal_style: 'detailed',
          risk_level: 'medium',
          default_step_count: 3
        }
      }),
    });

    const res = await POST(req);
    const data = await res.json();

    expect(data.proposal.template_id).toBe('sales_outreach');
    expect(data.proposal.sections).toBeDefined();
    const keys = (data.proposal.sections as { key: string }[]).map(s => s.key);
    expect(keys).toContain('icp');
    expect(keys).toContain('offer');
    expect(keys).toContain('sequence');
  });

  it('generates different IDs for different templates with same input', async () => {
    const baseBody = { 
      message: 'Same Input',
      settings: {
        proposal_style: 'detailed',
        risk_level: 'medium',
        default_step_count: 3
      }
    };

    const req1 = new NextRequest('http://localhost:3000/api/compile', {
      method: 'POST',
      body: JSON.stringify({ ...baseBody, settings: { ...baseBody.settings, template_id: 'generic' } }),
    });
    const res1 = await POST(req1);
    const data1 = await res1.json();

    const req2 = new NextRequest('http://localhost:3000/api/compile', {
      method: 'POST',
      body: JSON.stringify({ ...baseBody, settings: { ...baseBody.settings, template_id: 'bug_triage' } }),
    });
    const res2 = await POST(req2);
    const data2 = await res2.json();

    expect(data1.proposal_id).not.toBe(data2.proposal_id);
  });
});
