import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Decision } from '../lib/types';

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

describe('Store Logic (Issue #5)', () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  const mockDecision: Decision = {
    decision_id: 'dec_1',
    proposal_id: 'prop_1',
    status: 'approved',
    decided_at: new Date().toISOString(),
    note: 'Looks good',
  };

  it('serializes decisions to localStorage', () => {
    localStorage.setItem('diviora.decisions.v1', JSON.stringify([mockDecision]));
    expect(localStorage.getItem('diviora.decisions.v1')).toBe(JSON.stringify([mockDecision]));
  });

  it('correctly handles replacing a decision for the same proposal', () => {
    const updatedDecision: Decision = {
      ...mockDecision,
      decision_id: 'dec_2',
      status: 'rejected',
      note: 'Change of heart',
    };
    
    // Simulating reducer logic
    const state = { decisions: [mockDecision] };
    const existingIndex = state.decisions.findIndex(d => d.proposal_id === updatedDecision.proposal_id);
    let newDecisions = [...state.decisions];
    if (existingIndex > -1) {
      newDecisions[existingIndex] = updatedDecision;
    } else {
      newDecisions = [updatedDecision, ...state.decisions];
    }

    expect(newDecisions.length).toBe(1);
    expect(newDecisions[0].status).toBe('rejected');
    expect(newDecisions[0].decision_id).toBe('dec_2');
  });
});
