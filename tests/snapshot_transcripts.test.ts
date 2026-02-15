import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import React from 'react';
import { StoreProvider, useStore } from '../lib/store';

const wrapper = ({ children }: { children: React.ReactNode }) => (
  React.createElement(StoreProvider, null, children)
);

const mockProposal = {
  proposal_id: 'prop_snapshot_1',
  created_at: new Date().toISOString(),
  input: { message: 'Snapshot test proposal input' },
  proposal: {
    title: 'Snapshot Test Proposal',
    summary: 'A test summary for snapshot import/export coverage.',
    next_actions: ['Validate export payload', 'Validate import restore'],
    risks: ['Risk 1'],
  },
};

const mockDecision = {
  decision_id: 'dec_snapshot_1',
  proposal_id: 'prop_snapshot_1',
  status: 'approved' as const,
  decided_at: new Date().toISOString(),
};

describe('Snapshot transcripts persistence (Issue #28)', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('export includes transcripts with run/proposal linkage', () => {
    const { result } = renderHook(() => useStore(), { wrapper });

    act(() => {
      result.current.addProposal(mockProposal);
    });

    act(() => {
      result.current.setDecision(mockDecision);
    });

    let runId = '';
    act(() => {
      const run = result.current.createRunPlan(mockProposal.proposal_id);
      runId = run.run_id;
    });

    act(() => {
      result.current.generateTranscript(runId, 'flaky_inputs');
    });

    let snapshot = null as ReturnType<typeof result.current.exportSnapshot> | null;
    act(() => {
      snapshot = result.current.exportSnapshot();
    });
    if (!snapshot) throw new Error('Snapshot export failed in test');
    expect(snapshot.snapshot_version).toBe(3);
    expect(snapshot.transcripts.length).toBe(1);
    expect(snapshot.transcripts[0].run_id).toBe(runId);
    expect(snapshot.transcripts[0].proposal_id).toBe(mockProposal.proposal_id);
  });

  it('import restores transcript attempts', () => {
    const source = renderHook(() => useStore(), { wrapper });

    act(() => {
      source.result.current.addProposal(mockProposal);
    });

    act(() => {
      source.result.current.setDecision(mockDecision);
    });

    let runId = '';
    act(() => {
      const run = source.result.current.createRunPlan(mockProposal.proposal_id);
      runId = run.run_id;
    });

    act(() => {
      source.result.current.generateTranscript(runId, 'rate_limited');
    });

    act(() => {
      source.result.current.generateTranscript(runId, 'flaky_inputs');
    });

    let snapshot = null as ReturnType<typeof source.result.current.exportSnapshot> | null;
    act(() => {
      snapshot = source.result.current.exportSnapshot();
    });
    if (!snapshot) throw new Error('Snapshot export failed in test');

    localStorage.clear();
    const target = renderHook(() => useStore(), { wrapper });

    let importResult: { ok: true } | { ok: false; error: string } = { ok: false, error: 'not-run' };
    act(() => {
      importResult = target.result.current.importSnapshot(snapshot);
    });

    expect(importResult.ok).toBe(true);
    const imported = target.result.current.state.transcripts.filter((t) => t.run_id === runId);
    expect(imported).toHaveLength(2);
    expect(imported.map((t) => t.attempt).sort()).toEqual([1, 2]);
  });

  it('imports legacy snapshot safely with empty transcripts', () => {
    const { result } = renderHook(() => useStore(), { wrapper });

    const legacySnapshot = {
      snapshot_version: 2,
      exported_at: new Date().toISOString(),
      app_version: '0.1.0',
      state_schema_versions: {
        settings: 1,
        proposals: 1,
        decisions: 1,
        runs: 1,
      },
      settings: result.current.state.settings,
      proposals: [],
      decisions: [],
      runs: [],
    };

    let importResult: { ok: true } | { ok: false; error: string } = { ok: false, error: 'not-run' };
    act(() => {
      importResult = result.current.importSnapshot(legacySnapshot);
    });

    expect(importResult.ok).toBe(true);
    expect(result.current.state.transcripts).toEqual([]);
  });
});
