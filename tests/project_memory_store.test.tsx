import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import React from 'react';
import { StoreProvider, useStore } from '../lib/store';
import { buildProjectSnapshot } from '../lib/project_memory';

const wrapper = ({ children }: { children: React.ReactNode }) => React.createElement(StoreProvider, null, children);

describe('project memory store persistence', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('persists and hydrates project snapshots', async () => {
    const source = renderHook(() => useStore(), { wrapper });
    await waitFor(() => expect(source.result.current.state.isLoaded).toBe(true));

    act(() => {
      source.result.current.addProjectSnapshot(
        buildProjectSnapshot({
          source: 'manual_paste',
          raw: 'branch: main\nhead sha: abc1234567\n| lint | PASS |',
        })
      );
    });

    const persisted = localStorage.getItem('diviora.project_snapshots.v1');
    expect(persisted).toBeTruthy();

    const restored = renderHook(() => useStore(), { wrapper });
    await waitFor(() => expect(restored.result.current.state.isLoaded).toBe(true));

    expect(restored.result.current.state.projectSnapshots.length).toBe(1);
    expect(restored.result.current.state.projectSnapshots[0].branch).toBe('main');
  });
});
