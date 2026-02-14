import { describe, it, expect } from 'vitest';
import { getTemplateChecklist } from '../lib/template_checklist';
import { Proposal } from '../lib/types';

describe('getTemplateChecklist', () => {
  it('returns empty for non-bug_triage templates', () => {
    expect(getTemplateChecklist('generic', null)).toEqual([]);
    expect(getTemplateChecklist('sales_outreach', null)).toEqual([]);
  });

  it('returns missing items for bug_triage when no proposal exists', () => {
    const checklist = getTemplateChecklist('bug_triage', null);
    expect(checklist).toHaveLength(4);
    expect(checklist.every(item => !item.isCompleted)).toBe(true);
  });

  it('detects completed sections from proposal', () => {
    const mockProposal: Proposal = {
      proposal_id: 'p1',
      created_at: '',
      input: { message: '' },
      proposal: {
        title: '',
        summary: '',
        next_actions: [],
        risks: [],
        template_id: 'bug_triage',
        sections: [
          { key: 'repro_steps', title: 'Repro', content: 'Do this.' },
          { key: 'expected_actual', title: 'E vs A', content: ['Exp', 'Act'] }
        ]
      }
    };

    const checklist = getTemplateChecklist('bug_triage', mockProposal);
    
    const repro = checklist.find(i => i.id === 'repro_steps');
    const expAct = checklist.find(i => i.id === 'expected_actual');
    const cause = checklist.find(i => i.id === 'suspected_cause');

    expect(repro?.isCompleted).toBe(true);
    expect(expAct?.isCompleted).toBe(true);
    expect(cause?.isCompleted).toBe(false);
  });
});
