import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Home from '../app/page';
import { Proposal } from '../lib/types';
import * as storeModule from '../lib/store';
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
  
  it('sends full settings including template_id in the compile request', async () => {
    // Set custom settings in localStorage before rendering
    const customSettings = {
      schema_version: 1,
      proposal_style: 'concise',
      risk_level: 'high',
      default_step_count: 7,
      timeline_mode: 'expanded',
      template_id: 'bug_triage',
    };
    window.localStorage.setItem('diviora.settings.v1', JSON.stringify(customSettings));

    const mockProposal: Proposal = {
      proposal_id: 'prop_123',
      created_at: new Date().toISOString(),
      input: { message: 'Fix bug' },
      proposal: {
        title: 'Fix Bug Proposal',
        summary: 'Summary',
        next_actions: ['Action 1'],
        risks: ['Risk 1'],
        template_id: 'bug_triage',
      },
    };

    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => mockProposal,
    } as Response);

    renderWithStore(<Home />);
    
    const textarea = screen.getByPlaceholderText(/Type your message/i);
    const submitButton = screen.getByText('Submit');

    fireEvent.change(textarea, { target: { value: 'Fix bug' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalled();
    });

    const fetchCall = vi.mocked(fetch).mock.calls[0];
    const requestBody = JSON.parse(fetchCall[1]?.body as string);

    expect(requestBody.message).toBe('Fix bug');
    expect(requestBody.settings).toEqual(expect.objectContaining({
      proposal_style: 'concise',
      risk_level: 'high',
      default_step_count: 7,
      template_id: 'bug_triage',
    }));
  });

  it('fails closed if template_id is missing from settings', async () => {
    const spy = vi.spyOn(storeModule, 'useStore').mockReturnValue({
      state: {
        proposals: [],
        decisions: [],
        runs: [],
        settings: {
          proposal_style: 'detailed',
          risk_level: 'medium',
          default_step_count: 5,
        }
      },
      addProposal: vi.fn(),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);

    renderWithStore(<Home />);
    
    const textarea = screen.getByPlaceholderText(/Type your message/i);
    const submitButton = screen.getByText('Submit');

    fireEvent.change(textarea, { target: { value: 'Test message' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/Invalid settings: missing template_id/i)).toBeInTheDocument();
    });

    expect(fetch).not.toHaveBeenCalled();
    spy.mockRestore();
  });

  it('renders sections as primary view when available', async () => {
    const mockProposal: Proposal = {
      proposal_id: 'prop_sections',
      created_at: new Date().toISOString(),
      input: { message: 'Sections test' },
      proposal: {
        title: 'Sections Proposal',
        summary: 'Should be hidden',
        next_actions: ['Legacy action'], // Should be hidden
        risks: ['Legacy risk'], // Should be hidden
        template_id: 'bug_triage',
        sections: [
          { key: 'repro', title: 'Reproduction Steps', content: ['Step 1', 'Step 2'] },
          { key: 'fix', title: 'Fix Plan', content: 'Apply patch' }
        ],
      },
    };

    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => mockProposal,
    } as Response);

    renderWithStore(<Home />);
    fireEvent.change(screen.getByPlaceholderText(/Type your message/i), { target: { value: 'test' } });
    fireEvent.click(screen.getByText('Submit'));

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Reproduction Steps/i })).toBeInTheDocument();
      expect(screen.getByText(/Step 1/i)).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: /Fix Plan/i })).toBeInTheDocument();
      expect(screen.getByText(/Apply patch/i)).toBeInTheDocument();
      expect(screen.getAllByText(/bug triage/i).length).toBeGreaterThanOrEqual(1); // Badge and/or timeline
    });

    // Legacy fields should NOT be rendered
    expect(screen.queryByText(/Should be hidden/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Legacy action/i)).not.toBeInTheDocument();
  });

  it('falls back to legacy layout when sections are missing', async () => {
    const mockProposal: Proposal = {
      proposal_id: 'prop_legacy',
      created_at: new Date().toISOString(),
      input: { message: 'Legacy test' },
      proposal: {
        title: 'Legacy Proposal',
        summary: 'Visible Summary',
        next_actions: ['Action 1'],
        risks: ['Risk 1'],
      },
    };

    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => mockProposal,
    } as Response);

    renderWithStore(<Home />);
    fireEvent.change(screen.getByPlaceholderText(/Type your message/i), { target: { value: 'test' } });
    fireEvent.click(screen.getByText('Submit'));

    await waitFor(() => {
      expect(screen.getByText(/Visible Summary/i)).toBeInTheDocument();
      expect(screen.getByText(/NEXT ACTIONS/i)).toBeInTheDocument();
      expect(screen.getByText(/Action 1/i)).toBeInTheDocument();
    });
  });
});
