import { render, screen, waitFor } from '@testing-library/react';
import ArtifactDetailPage from '../app/artifacts/[proposal_id]/page';
import { Proposal, Decision } from '../lib/types';
import { StoreProvider } from '../lib/store';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import React from 'react';

// Mock navigation
vi.mock('next/navigation', () => ({
  useParams: () => ({ proposal_id: 'prop_999' }),
  useRouter: () => ({ 
    back: vi.fn(),
    push: vi.fn(),
  }),
}));

describe('Proposal Detail -> Runs Integration', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  const renderWithStore = (ui: React.ReactElement) => {
    return render(<StoreProvider>{ui}</StoreProvider>);
  };

  const mockProposal: Proposal = {
    proposal_id: 'prop_999',
    created_at: new Date().toISOString(),
    input: { message: 'hello' },
    proposal: {
      title: 'Run Gating Test',
      summary: 'Summary',
      next_actions: ['Action'],
      risks: ['Risk'],
    },
  };

  it('disables "Create Run Plan" if not approved', async () => {
    window.localStorage.setItem('diviora.proposals.v1', JSON.stringify([mockProposal]));

    renderWithStore(<ArtifactDetailPage />);

    await waitFor(() => {
      expect(screen.getByText('Run Gating Test')).toBeInTheDocument();
    });

    const runBtn = screen.getByText(/Create Run Plan/i);
    expect(runBtn).toBeDisabled();
  });

  it('enables "Create Run Plan" after approval', async () => {
    const approvedDecision: Decision = {
      decision_id: 'dec_999',
      proposal_id: 'prop_999',
      status: 'approved',
      decided_at: new Date().toISOString(),
    };

    window.localStorage.setItem('diviora.proposals.v1', JSON.stringify([mockProposal]));
    window.localStorage.setItem('diviora.decisions.v1', JSON.stringify([approvedDecision]));

    renderWithStore(<ArtifactDetailPage />);

    await waitFor(() => {
      expect(screen.getByText(/Create Run Plan/i)).not.toBeDisabled();
    });
  });
});
