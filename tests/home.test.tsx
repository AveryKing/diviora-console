import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Home from '../app/page';
import { Proposal } from '../lib/types';
import { vi, describe, it, expect, beforeEach } from 'vitest';

describe('Home Page', () => {
  beforeEach(() => {
    vi.mocked(fetch).mockClear();
  });

  it('renders initial empty state', () => {
    render(<Home />);
    expect(screen.getByPlaceholderText(/Type your message/i)).toBeInTheDocument();
    expect(screen.getByText(/No proposal to display yet/i)).toBeInTheDocument();
    expect(screen.getByText(/No activity recorded yet/i)).toBeInTheDocument();
  });

  it('shows error when submitting empty message', async () => {
    render(<Home />);
    const submitButton = screen.getByText('Submit');
    fireEvent.click(submitButton);
    expect(screen.getByText(/Message cannot be empty/i)).toBeInTheDocument();
    expect(fetch).not.toHaveBeenCalled();
  });

  it('submits message and renders proposal on success', async () => {
    const mockProposal: Proposal = {
      proposal_id: 'prop_123',
      created_at: new Date().toISOString(),
      input: { message: 'Hello' },
      proposal: {
        title: 'Mock Proposal',
        summary: 'Mock Summary',
        next_actions: ['Action 1'],
        risks: ['Risk 1'],
      },
    };

    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => mockProposal,
    } as Response);

    render(<Home />);
    const textarea = screen.getByPlaceholderText(/Type your message/i);
    const submitButton = screen.getByText('Submit');

    fireEvent.change(textarea, { target: { value: 'Hello' } });
    fireEvent.click(submitButton);

    expect(screen.getByText(/Compiling.../i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getAllByText(/Mock Proposal/i).length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText(/Mock Summary/i)).toBeInTheDocument();
      expect(screen.getByText(/Action 1/i)).toBeInTheDocument();
      expect(screen.getByText(/Risk 1/i)).toBeInTheDocument();
    });

    expect(screen.getByText(/Timeline/i)).toBeInTheDocument();
    expect(screen.getByText('SUCCESS')).toBeInTheDocument();
  });

  it('handles error during submission', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'Server Error' }),
    } as Response);

    render(<Home />);
    const textarea = screen.getByPlaceholderText(/Type your message/i);
    const submitButton = screen.getByText('Submit');

    fireEvent.change(textarea, { target: { value: 'Hello' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Server Error')).toBeInTheDocument();
    });
  });
});
