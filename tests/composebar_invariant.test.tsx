import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ComposeBar } from '../app/components/home/ComposeBar';
import { useStore } from '../lib/store';

vi.mock('../lib/store', () => ({
  useStore: vi.fn(),
}));

vi.mock('@copilotkit/react-core', () => ({
  useCopilotChat: vi.fn(() => ({ appendMessage: vi.fn().mockResolvedValue(undefined) })),
}));

vi.mock('@copilotkit/runtime-client-gql', () => ({
  TextMessage: class {
    constructor(public options: unknown) {}
  },
  Role: {
    System: 'system',
  },
}));

describe('ComposeBar invariants', () => {
  const addProposal = vi.fn();

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
          template_id: 'generic',
        },
      },
      addProposal,
    } as unknown as ReturnType<typeof useStore>);

    global.fetch = vi.fn();
  });

  it('updates input from diviora:insert-input without submitting compile request', () => {
    render(<ComposeBar />);

    const message = 'Drafted by Copilot';
    fireEvent(
      window,
      new CustomEvent('diviora:insert-input', {
        detail: { message },
      })
    );

    const textarea = screen.getByTestId('home-compose-textarea');
    expect(textarea).toHaveValue(message);
    expect(global.fetch).not.toHaveBeenCalled();
    expect(addProposal).not.toHaveBeenCalled();
  });
});
