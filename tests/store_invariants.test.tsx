import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import React from 'react';
import { StoreProvider, useStore } from '../lib/store';
import type { SnapshotV3 } from '../lib/types';

const wrapper = ({ children }: { children: React.ReactNode }) => (
  React.createElement(StoreProvider, null, children)
);

describe('Store invariants', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('createRunPlan is gated by APPROVED decision', async () => {
    const { result } = renderHook(() => useStore(), { wrapper });
    await waitFor(() => expect(result.current.state.isLoaded).toBe(true));

    act(() => {
      result.current.addProposal({
        proposal_id: 'prop_gate_1',
        created_at: new Date().toISOString(),
        input: { message: 'need run plan' },
        proposal: {
          title: 'Proposal',
          summary: 'Summary',
          next_actions: ['step a'],
          risks: ['risk a'],
        },
      });
    });

    expect(() => result.current.createRunPlan('prop_gate_1')).toThrow('Cannot create run plan for unapproved proposal');

    act(() => {
      result.current.setDecision({
        decision_id: 'dec_reject_1',
        proposal_id: 'prop_gate_1',
        status: 'rejected',
        decided_at: new Date().toISOString(),
      });
    });

    expect(() => result.current.createRunPlan('prop_gate_1')).toThrow('Cannot create run plan for unapproved proposal');

    act(() => {
      result.current.setDecision({
        decision_id: 'dec_approve_1',
        proposal_id: 'prop_gate_1',
        status: 'approved',
        decided_at: new Date().toISOString(),
      });
    });

    const run = result.current.createRunPlan('prop_gate_1');
    expect(run.proposal_id).toBe('prop_gate_1');
  });

  it('importSnapshot fails closed for transcript referential mismatch', async () => {
    const { result } = renderHook(() => useStore(), { wrapper });
    await waitFor(() => expect(result.current.state.isLoaded).toBe(true));

    const now = new Date().toISOString();
    const invalidSnapshot: SnapshotV3 = {
      snapshot_version: 3,
      exported_at: now,
      app_version: '0.1.0',
      state_schema_versions: {
        settings: 1,
        proposals: 1,
        decisions: 1,
        runs: 1,
        transcripts: 1,
      },
      settings: result.current.state.settings,
      proposals: [
        {
          proposal_id: 'prop_ok',
          created_at: now,
          input: { message: 'x' },
          proposal: { title: 'T', summary: 'S', next_actions: [], risks: [] },
        },
      ],
      decisions: [],
      runs: [
        {
          run_id: 'run_ok',
          proposal_id: 'prop_ok',
          created_at: now,
          status: 'planned',
          plan: {
            objective: 'obj',
            steps: [],
            inputs_needed: [],
            expected_outputs: [],
            risks: [],
            rollback: [],
          },
        },
      ],
      transcripts: [
        {
          transcript_id: 'tx_bad',
          run_id: 'run_ok',
          proposal_id: 'prop_mismatch',
          created_at: now,
          status: 'simulated',
          scenario_id: 'happy_path',
          attempt: 1,
          events: [],
        },
      ],
    };

    let importResult: { ok: true } | { ok: false; error: string } | undefined;
    act(() => {
      importResult = result.current.importSnapshot(invalidSnapshot);
    });

    expect(importResult).toBeDefined();
    expect(importResult?.ok).toBe(false);
    if (importResult && importResult.ok === false) {
      expect(importResult.error).toContain('Referential integrity failed');
    }
  });
});
