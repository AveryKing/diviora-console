import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ChatFirstHome } from '../app/components/home/ChatFirstHome';
import { useStore } from '../lib/store';
import { useSessionStore } from '../lib/session_store';

// Mock dependencies
vi.mock('../lib/store', () => ({
  useStore: vi.fn(),
}));

vi.mock('../lib/session_store', () => ({
  useSessionStore: vi.fn(),
}));

vi.mock('@copilotkit/react-core', () => ({
  useCopilotChat: vi.fn(() => ({
    appendMessage: vi.fn(),
    visibleMessages: [],
  })),
  useCopilotChatInternal: vi.fn(() => ({
    appendMessage: vi.fn(),
    messages: [],
    visibleMessages: [],
  })),
  useCopilotReadable: vi.fn(),
  useCopilotAction: vi.fn(),
  CopilotKit: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock('@copilotkit/react-ui', () => ({
  CopilotChat: () => <div data-testid="mock-copilot-chat">Copilot Chat</div>,
}));

vi.mock("next/navigation", () => ({
  usePathname: vi.fn().mockReturnValue("/"),
  useParams: vi.fn().mockReturnValue({}),
}));

vi.mock('../app/components/CopilotContextHandler', () => ({
  CopilotContextHandler: () => null,
}));

vi.mock('@copilotkit/runtime-client-gql', () => ({
  TextMessage: class {
    constructor(public options: unknown) {}
  },
  Role: {
    User: 'user',
    System: 'system',
    Assistant: 'assistant',
  },
}));

describe('ChatFirstHome', () => {
  const mockAddProposal = vi.fn();
  const mockState = {
    settings: {
      template_id: 'bug_triage',
      risk_level: 'low',
    },
    proposals: [],
    decisions: [],
    runs: [],
  };

  const mockSessionActions = {
      createSession: vi.fn(),
      switchSession: vi.fn(),
      renameSession: vi.fn(),
      setMessages: vi.fn(),
      pinContext: vi.fn()
  };

  const mockSession = {
      session_id: 'sess_1',
      title: 'Test Session',
      pinned: {},
      messages: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
  };

  let mockSessionStoreState: {
    currentSessionId: string | null;
    sessions: typeof mockSession[];
    hydrated: boolean;
    actions: typeof mockSessionActions;
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (useStore as unknown as { mockReturnValue: (val: unknown) => void }).mockReturnValue({
      state: mockState,
      addProposal: mockAddProposal,
    });
    
    (useSessionStore as unknown as { mockReturnValue: (val: unknown) => void }).mockReturnValue({
      currentSessionId: 'sess_1',
      sessions: [mockSession],
      hydrated: true,
      actions: mockSessionActions
    });

    mockSessionStoreState = {
      currentSessionId: 'sess_1',
      sessions: [mockSession],
      hydrated: true,
      actions: mockSessionActions,
    };

    const mockedSessionStore = useSessionStore as unknown as {
      mockImplementation: (fn: (selector?: (state: typeof mockSessionStoreState) => unknown) => unknown) => void;
      persist?: { hasHydrated: () => boolean };
    };

    mockedSessionStore.mockImplementation((selector?: (state: typeof mockSessionStoreState) => unknown) => {
      if (selector) {
        return selector(mockSessionStoreState);
      }
      return mockSessionStoreState;
    });
    mockedSessionStore.persist = {
      hasHydrated: () => mockSessionStoreState.hydrated,
    };

    // Mock fetch
    global.fetch = vi.fn();
  });

  it('renders the chat-first layout with sessions', () => {
    render(<ChatFirstHome />);
    expect(screen.getByTestId('home-chat-main')).toBeInTheDocument();
    expect(screen.getByTestId('home-compose')).toBeInTheDocument();
    expect(screen.getByTestId('home-context-panel')).toBeInTheDocument();
    expect(screen.getByTestId('sessions-list')).toBeInTheDocument(); 
  });

  it('inserts draft into compose area but does not submit', async () => {
    render(<ChatFirstHome />);
    
    const draftText = "Suggested Draft Message";
    
    await waitFor(() => {
        const event = new CustomEvent('diviora:copilot-draft', { detail: { draft: draftText } });
        window.dispatchEvent(event);
    });
    
    const insertBtn = await screen.findByTestId('home-insert-draft-btn');
    expect(insertBtn).toBeInTheDocument();

    fireEvent.click(insertBtn);

    const textarea = screen.getByTestId('home-compose-textarea');
    expect(textarea).toHaveValue(draftText);

    expect(mockAddProposal).not.toHaveBeenCalled();
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('submits proposal when compile button is clicked', async () => {
    (global.fetch as unknown as { mockResolvedValue: (val: unknown) => void }).mockResolvedValue({
        ok: true,
        json: async () => ({ proposal_id: '123', proposal: { title: 'New Proposal' } }),
    });

    render(<ChatFirstHome />);
    
    const textarea = screen.getByTestId('home-compose-textarea');
    fireEvent.change(textarea, { target: { value: 'My user request' } });

    const submitBtn = screen.getByTestId('home-compose-submit');
    fireEvent.click(submitBtn);

    await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/compile', expect.objectContaining({
            method: 'POST',
            body: expect.stringContaining('My user request'),
        }));
    });

    expect(mockAddProposal).toHaveBeenCalled();
  });

  it('initializes deterministically when hydration flips to ready', async () => {
    mockSessionStoreState = {
      ...mockSessionStoreState,
      currentSessionId: null,
      hydrated: false,
    };

    const { rerender } = render(<ChatFirstHome />);
    expect(screen.getByText('Initializing Application...')).toBeInTheDocument();

    mockSessionStoreState = {
      ...mockSessionStoreState,
      hydrated: true,
    };

    rerender(<ChatFirstHome />);

    await waitFor(() => {
      expect(mockSessionActions.switchSession).toHaveBeenCalledWith('sess_1');
    });
  });
});
