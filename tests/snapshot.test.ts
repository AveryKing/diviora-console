import { describe, it, expect, vi } from 'vitest';
import { SnapshotV1Schema, SnapshotV1, Proposal, Settings } from '../lib/types';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value.toString();
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
  };
})();

Object.defineProperty(global, 'localStorage', {
  value: localStorageMock,
});

describe('Snapshot Logic (Issue #8)', () => {
  const mockSettings: Settings = {
    schema_version: 1,
    proposal_style: 'detailed',
    risk_level: 'medium',
    default_step_count: 5,
    timeline_mode: 'expanded',
  };

  const mockProposal: Proposal = {
    proposal_id: 'prop_1',
    created_at: new Date().toISOString(),
    input: { message: 'test' },
    proposal: { title: 'T', summary: 'S', next_actions: [], risks: [] }
  };

  const validSnapshot: SnapshotV1 = {
    snapshot_version: 1,
    exported_at: new Date().toISOString(),
    settings: mockSettings,
    proposals: [mockProposal],
    decisions: [{
      decision_id: 'dec_1',
      proposal_id: 'prop_1',
      status: 'approved',
      decided_at: new Date().toISOString()
    }],
    runs: [{
      run_id: 'run_1',
      proposal_id: 'prop_1',
      created_at: new Date().toISOString(),
      status: 'planned',
      plan: { objective: 'O', steps: [], inputs_needed: [], expected_outputs: [], risks: [], rollback: [] }
    }]
  };

  it('validates a correct snapshot schema', () => {
    const result = SnapshotV1Schema.safeParse(validSnapshot);
    expect(result.success).toBe(true);
  });

  it('rejects an invalid snapshot schema', () => {
    const invalid = { ...validSnapshot, snapshot_version: 2 }; // Wrong version
    const result = SnapshotV1Schema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it('detects referential integrity failures (decision -> missing proposal)', () => {
    const brokenSnapshot: SnapshotV1 = {
      ...validSnapshot,
      decisions: [{
        decision_id: 'dec_bad',
        proposal_id: 'missing_prop',
        status: 'approved',
        decided_at: new Date().toISOString()
      }]
    };
    
    // Logic check (matching the one in store.tsx)
    const proposalIds = new Set(brokenSnapshot.proposals.map(p => p.proposal_id));
    const hasError = brokenSnapshot.decisions.some(d => !proposalIds.has(d.proposal_id));
    expect(hasError).toBe(true);
  });

  it('detects referential integrity failures (run -> missing proposal)', () => {
    const brokenSnapshot: SnapshotV1 = {
      ...validSnapshot,
      runs: [{
        run_id: 'run_bad',
        proposal_id: 'missing_prop',
        created_at: new Date().toISOString(),
        status: 'planned',
        plan: { objective: 'O', steps: [], inputs_needed: [], expected_outputs: [], risks: [], rollback: [] }
      }]
    };
    
    const proposalIds = new Set(brokenSnapshot.proposals.map(p => p.proposal_id));
    const hasError = brokenSnapshot.runs.some(r => !proposalIds.has(r.proposal_id));
    expect(hasError).toBe(true);
  });
});
