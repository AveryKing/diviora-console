import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { StoreProvider } from '../lib/store';
import MemoryPage from '../app/memory/page';

describe('Memory page', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('pastes, saves, lists, and opens detail', async () => {
    render(
      <StoreProvider>
        <MemoryPage />
      </StoreProvider>
    );

    const input = await screen.findByTestId('memory-paste-input');
    fireEvent.change(input, {
      target: {
        value: 'branch: main\nhead sha: abcdef123456\n| lint | PASS |',
      },
    });

    fireEvent.click(screen.getByTestId('memory-save-button'));

    await waitFor(() => {
      expect(screen.getByTestId('memory-status')).toHaveTextContent('Snapshot saved.');
    });

    await waitFor(() => {
      expect(screen.getByTestId('memory-list')).toHaveTextContent('main');
    });

    const listButton = screen.getByTestId(/^memory-list-item-/);
    fireEvent.click(listButton);

    await waitFor(() => {
      expect(screen.getByTestId('memory-detail')).toHaveTextContent('abcdef123456');
    });
  });
});
