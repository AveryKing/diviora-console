import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import React from 'react';
import { StoreProvider, useStore } from '../lib/store';

const wrapper = ({ children }: { children: React.ReactNode }) => React.createElement(StoreProvider, null, children);

describe('agent packs store persistence', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('stores status updates and codex task packets', async () => {
    const source = renderHook(() => useStore(), { wrapper });
    await waitFor(() => expect(source.result.current.state.isLoaded).toBe(true));

    act(() => {
      source.result.current.addAgentPack({
        pack_id: 'pack_1',
        created_at: new Date().toISOString(),
        kind: 'issue',
        title: 'Issue Pack',
        content_markdown: '## Objective',
        inputs: { snapshot_id: undefined, selected_goals: ['goal'] },
        status: 'draft',
      });
    });

    act(() => {
      source.result.current.setAgentPackStatus('pack_1', 'approved', 'ok');
    });

    act(() => {
      source.result.current.setAgentPackCodexTaskPacket('pack_1', '# CODEX_TASK_PACKET');
    });

    const restored = renderHook(() => useStore(), { wrapper });
    await waitFor(() => expect(restored.result.current.state.isLoaded).toBe(true));
    expect(restored.result.current.state.agentPacks[0].status).toBe('approved');
    expect(restored.result.current.state.agentPacks[0].note).toBe('ok');
    expect(restored.result.current.state.agentPacks[0].codex_task_packet_markdown).toBe('# CODEX_TASK_PACKET');
  });
});
