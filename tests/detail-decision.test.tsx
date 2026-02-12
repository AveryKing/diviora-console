import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ArtifactDetailPage from '../app/artifacts/[proposal_id]/page';
import { Proposal } from '../lib/types';
import { StoreProvider } from '../lib/store';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import React from 'react';

// Mock useParams and useRouter
vi.mock('next/navigation', () => ({
  useParams: () => ({ proposal_id: 'prop_123' }),
  useRouter: () => ({ back: vi.fn() }),
}));

describe('Proposal Detail Decision UI', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  const renderWithStore = (ui: React.ReactElement) => {
    return render(<StoreProvider>{ui}</StoreProvider>);
  };

  it('allows approving a proposal and shows status badge', async () => {
    const mockProposal: Proposal = {
      proposal_id: 'prop_123',
      created_at: new Date().toISOString(),
      input: { message: 'hello' },
      proposal: {
        title: 'Mock Proposal',
        summary: 'Mock Summary',
        next_actions: [],
        risks: [],
      },
    };

    // Pre-populate store
    window.localStorage.setItem('diviora.proposals.v1', JSON.stringify([mockProposal]));

    renderWithStore(<ArtifactDetailPage />);

    // Wait for hydration
    await waitFor(() => {
      expect(screen.getByText('Mock Proposal')).toBeInTheDocument();
    });

    const approveButton = screen.getByText('Approve');
    const noteArea = screen.getByPlaceholderText(/Add reasoning/i);

    fireEvent.change(noteArea, { target: { value: 'This is approved.' } });
    fireEvent.click(approveButton);

    // Verify badge appears
    await waitFor(() => {
      expect(screen.getAllByText(/approved/i).length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText(/This is approved/i).length).toBeGreaterThanOrEqual(1);
    });

    // Verify button is disabled
    expect(approveButton).toBeDisabled();
  });
});
