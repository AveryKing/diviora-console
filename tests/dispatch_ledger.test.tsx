import { act, renderHook } from '@testing-library/react';
import React from 'react';
import { describe, expect, it } from 'vitest';
import { sha256Hex } from '../lib/dispatch';
import { StoreProvider, useStore } from '../lib/store';

const wrapper = ({ children }: { children: React.ReactNode }) => React.createElement(StoreProvider, null, children);

describe('dispatch ledger', () => {
  it('computes deterministic sha256 hash', async () => {
    const payload = '{"x":1}';
    const first = await sha256Hex(payload);
    const second = await sha256Hex(payload);
    expect(first).toBe(second);
    expect(first).toHaveLength(64);
  });

  it('creates dispatch and enforces append-only transitions', async () => {
    localStorage.clear();
    const { result } = renderHook(() => useStore(), { wrapper });

    act(() => {
      result.current.addAgentPack({
        pack_id: 'pack_dispatch_1',
        created_at: '2026-01-01T00:00:00.000Z',
        kind: 'issue',
        title: 'Dispatch Pack',
        content_markdown: 'content',
        inputs: {},
        status: 'approved',
        approval_note: 'approved',
        codex_task_packet_markdown: '{"task":"do"}',
      });
    });

    let dispatchId = '';
    await act(async () => {
      dispatchId = await result.current.createDispatch('pack_dispatch_1', 'manual_export');
    });

    act(() => result.current.markDispatchSent(dispatchId));
    act(() => result.current.markDispatchAcked(dispatchId));
    act(() => result.current.markDispatchFailed(dispatchId, 'late failure should be ignored'));

    const created = result.current.state.dispatchRecords.find((record) => record.dispatch_id === dispatchId);
    if (!created) throw new Error('dispatch not found');

    expect(created.status).toBe('acked');
    expect(created.attempts).toBe(1);
    expect(created.transitions.map((transition) => transition.status)).toEqual(['queued', 'sent', 'acked']);

    const pack = result.current.state.agentPacks.find((candidate) => candidate.pack_id === 'pack_dispatch_1');
    expect(pack?.latest_dispatch_id).toBe(dispatchId);
  });
});
