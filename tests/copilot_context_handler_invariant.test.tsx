import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import { CopilotContextHandler } from '../app/components/CopilotContextHandler';
import { useStore } from '../lib/store';
import { useCopilotAction } from '@copilotkit/react-core';

vi.mock('../lib/store', () => ({
  useStore: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  usePathname: vi.fn(() => '/'),
  useParams: vi.fn(() => ({})),
}));

vi.mock('@copilotkit/react-core', () => ({
  useCopilotReadable: vi.fn(),
  useCopilotAction: vi.fn(),
}));

describe('CopilotContextHandler authority boundary', () => {
  const addProposal = vi.fn();
  const setDecision = vi.fn();
  const createRunPlan = vi.fn();
  const generateTranscript = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useStore).mockReturnValue({
      state: {
        settings: {
          schema_version: 1,
          proposal_style: 'detailed',
          risk_level: 'medium',
          default_step_count: 5,
          timeline_mode: 'expanded',
          template_id: 'bug_triage',
        },
        proposals: [
          {
            proposal_id: 'prop_1',
            created_at: new Date().toISOString(),
            input: { message: 'hello' },
            proposal: {
              title: 'Proposal',
              summary: 'Summary',
              next_actions: ['step'],
              risks: ['risk'],
              template_id: 'bug_triage',
              sections: [{ key: 'repro', title: 'Reproduction Steps', content: 'step 1' }],
            },
          },
        ],
        runs: [],
      },
      addProposal,
      setDecision,
      createRunPlan,
      generateTranscript,
    } as unknown as ReturnType<typeof useStore>);
  });

  it('dispatches events from actions and does not call store mutators', async () => {
    const dispatchSpy = vi.spyOn(window, 'dispatchEvent');
    render(<CopilotContextHandler />);

    const registered = vi
      .mocked(useCopilotAction)
      .mock.calls.map((call) => call[0] as { name: string; handler: (args: unknown) => Promise<void> });

    const byName = (name: string) => {
      const entry = registered.find((action) => action.name === name);
      if (!entry) throw new Error(`Missing action: ${name}`);
      return entry;
    };

    await byName('draft_prompt_for_template').handler({ draft: 'draft content' });
    await byName('extract_bug_triage_fields').handler({
      title: 'Bug',
      severity: 'high',
      component: 'frontend',
      description: 'broken',
      repro_steps: '1. do x',
      expected_behavior: 'works',
      actual_result: 'fails',
    });
    await byName('suggest_missing_fields').handler({
      missing: ['repro_steps'],
      hints: ['Add steps'],
    });
    await byName('draftNextMessage').handler({ draft: 'legacy draft' });
    await byName('propose_issue_pack').handler({
      goal_text: 'Ship agent page',
      title: 'Issue Pack',
      content_markdown: '## Objective\nShip',
    });
    await byName('propose_review_pack').handler({
      pr_url_or_branch: 'feature/agent',
      title: 'Review Pack',
      content_markdown: '## Objective\nReview',
    });
    await byName('propose_manual_test_pack').handler({
      target_flow: '/agent',
      title: 'Manual Test Pack',
      content_markdown: '## Objective\nTest',
    });

    expect(dispatchSpy).toHaveBeenCalled();
    expect(addProposal).not.toHaveBeenCalled();
    expect(setDecision).not.toHaveBeenCalled();
    expect(createRunPlan).not.toHaveBeenCalled();
    expect(generateTranscript).not.toHaveBeenCalled();
  });
});
