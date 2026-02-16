import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ArtifactDetailPage from '../app/artifacts/[proposal_id]/page';
import { evaluatePolicy, PolicyError } from '../lib/policy';
import { useStore } from '../lib/store';

vi.mock('next/navigation', () => ({
  useParams: vi.fn(() => ({ proposal_id: 'prop_1' })),
  useRouter: vi.fn(() => ({ back: vi.fn(), push: vi.fn() })),
}));

vi.mock('../lib/store', () => ({
  useStore: vi.fn(),
}));

describe('Fail-closed invariant', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('evaluatePolicy fails closed when a policy throws internally', () => {
    const malformedTranscript = {
      transcript_id: 'tx_1',
      run_id: 'run_1',
      created_at: new Date().toISOString(),
      status: 'simulated',
      scenario_id: 'happy_path',
      attempt: 1,
      events: undefined,
    } as unknown;

    const decision = evaluatePolicy(
      { type: 'RERUN_TRANSCRIPT', scenarioId: 'happy_path' },
      {
        settings: {
          schema_version: 1,
          proposal_style: 'detailed',
          risk_level: 'medium',
          default_step_count: 5,
          timeline_mode: 'expanded',
          template_id: 'generic',
        },
        transcripts: [malformedTranscript] as never[],
      }
    );

    expect(decision.allowed).toBe(false);
    expect(decision.policy_ids).toContain('P0_FAIL_CLOSED');
    expect(decision.reasons[0]).toContain('Policy evaluation internal error');
  });

  it('shows policy violation banner when decision action fails closed', () => {
    const setDecision = vi.fn(() => {
      throw new PolicyError('Policy Violation', {
        allowed: false,
        reasons: ['Policy evaluation internal error: forced'],
        policy_ids: ['P0_FAIL_CLOSED'],
      });
    });

    vi.mocked(useStore).mockReturnValue({
      state: {
        isLoaded: true,
        proposals: [
          {
            proposal_id: 'prop_1',
            created_at: new Date().toISOString(),
            input: { message: 'x' },
            proposal: {
              title: 'Title',
              summary: 'Summary',
              next_actions: [],
              risks: [],
            },
          },
        ],
        decisions: [],
        runs: [],
      },
      setDecision,
      createRunPlan: vi.fn(),
    } as unknown as ReturnType<typeof useStore>);

    render(<ArtifactDetailPage />);
    fireEvent.click(screen.getByTestId('approve-button'));

    expect(screen.getByText(/Policy Violation:/)).toBeInTheDocument();
    expect(screen.getByText(/P0_FAIL_CLOSED/)).toBeInTheDocument();
  });
});
