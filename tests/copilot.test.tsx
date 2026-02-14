import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { DivioraCopilotSidebar } from '../app/components/DivioraCopilotSidebar';
import { useCopilotChat } from '@copilotkit/react-core';

// Mock CopilotKit and related hooks
vi.mock('@copilotkit/react-core', () => {
  return {
    useCopilotChat: vi.fn(() => ({
      appendMessage: vi.fn(),
    })),
    useCopilotContext: vi.fn(() => ({})),
    TextMessage: class { 
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      constructor(data: any) { Object.assign(this, data); }
    },
    Role: { User: 'user', Assistant: 'assistant' }
  };
});

vi.mock('@copilotkit/runtime-client-gql', () => {
  return {
    TextMessage: class { 
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      constructor(data: any) { Object.assign(this, data); }
    },
    Role: { User: 'user', Assistant: 'assistant' }
  };
});


vi.mock('@copilotkit/react-ui', () => ({
  CopilotChat: () => <div data-testid="copilot-chat">Mock Chat</div>,
}));

import { StoreProvider } from '../lib/store';
import React from 'react';

describe('DivioraCopilotSidebar', () => {
  const mockAppendMessage = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (useCopilotChat as any).mockReturnValue({
      appendMessage: mockAppendMessage,
    });
  });

  it('renders when diviora:toggle-copilot event is fired', async () => {
    render(
      <StoreProvider>
        <DivioraCopilotSidebar />
      </StoreProvider>
    );
    
    expect(screen.queryByText('Diviora Copilot')).not.toBeInTheDocument();

    await act(async () => {
      window.dispatchEvent(new CustomEvent('diviora:toggle-copilot'));
    });

    expect(screen.getByText('Diviora Copilot')).toBeInTheDocument();
  });

  it('calls appendMessage when Draft Next Message is clicked', async () => {
    render(
      <StoreProvider>
        <DivioraCopilotSidebar />
      </StoreProvider>
    );

    await act(async () => {
      window.dispatchEvent(new CustomEvent('diviora:toggle-copilot'));
    });

    const draftButton = screen.getByText('Draft Next Message');
    fireEvent.click(draftButton);

    expect(mockAppendMessage).toHaveBeenCalled();
  });

  it('closes when close button is clicked', async () => {
    render(
      <StoreProvider>
        <DivioraCopilotSidebar />
      </StoreProvider>
    );

    await act(async () => {
      window.dispatchEvent(new CustomEvent('diviora:toggle-copilot'));
    });

    const closeButton = screen.getByLabelText("Close Copilot");
    fireEvent.click(closeButton);

    expect(screen.queryByText('Diviora Copilot')).not.toBeInTheDocument();
  });
});
