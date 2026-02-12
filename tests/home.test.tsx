import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Home from '../app/page';
import { Proposal } from '../lib/types';
import { StoreProvider } from '../lib/store';
import { vi, describe, it, expect, beforeEach } from 'vitest';

describe('Home Page', () => {
  beforeEach(() => {
    vi.mocked(fetch).mockClear();
    window.localStorage.clear();
  });

  const renderWithStore = (ui: React.ReactElement) => {
    return render(<StoreProvider>{ui}</StoreProvider>);
  };

  it('renders initial empty state', () => {
    renderWithStore(<Home />);
    expect(screen.getByPlaceholderText(/Type your message/i)).toBeInTheDocument();
    expect(screen.getByText(/No proposal to display yet/i)).toBeInTheDocument();
    expect(screen.getByText(/No activity recorded yet/i)).toBeInTheDocument();
  });

  it('shows error when submitting empty message', async () => {
    renderWithStore(<Home />);
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

    renderWithStore(<Home />);
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

    renderWithStore(<Home />);
    const textarea = screen.getByPlaceholderText(/Type your message/i);
    const submitButton = screen.getByText('Submit');

    fireEvent.change(textarea, { target: { value: 'Hello' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Server Error')).toBeInTheDocument();
    });
  });

  it('persists proposal after re-mount', async () => {
    const mockProposal: Proposal = {
      proposal_id: 'prop_persist',
      created_at: new Date().toISOString(),
      input: { message: 'Hello' },
      proposal: {
        title: 'Persistent Proposal',
        summary: 'Mock Summary',
        next_actions: [],
        risks: [],
      },
    };

    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => mockProposal,
    } as Response);

    const { unmount } = renderWithStore(<Home />);
    fireEvent.change(screen.getByPlaceholderText(/Type your message/i), { target: { value: 'Hello' } });
    fireEvent.click(screen.getByText('Submit'));

    await waitFor(() => {
      expect(screen.getAllByText(/Persistent Proposal/i).length).toBeGreaterThanOrEqual(1);
    });

    unmount();

    // Re-render
    renderWithStore(<Home />);
    expect(screen.getAllByText(/Persistent Proposal/i).length).toBeGreaterThanOrEqual(1);
  });
});
