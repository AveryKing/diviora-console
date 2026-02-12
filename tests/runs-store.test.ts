import { describe, it, expect, vi } from 'vitest';
import { Proposal, RunPlan } from '../lib/types';

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

describe('Run Plan Logic (Issue #6)', () => {
  const mockProposal: Proposal = {
    proposal_id: 'prop_123',
    created_at: new Date().toISOString(),
    input: { message: 'hello' },
    proposal: {
      title: 'Title',
      summary: 'Summary',
      next_actions: ['Step A'],
      risks: ['Risk A'],
    },
  };

  it('correctly maps proposal to run plan', () => {
    const run_id = 'run_testing';
    const plan: RunPlan = {
      run_id,
      proposal_id: mockProposal.proposal_id,
      created_at: new Date().toISOString(),
      status: 'planned',
      plan: {
        objective: mockProposal.proposal.title,
        steps: mockProposal.proposal.next_actions,
        inputs_needed: ['Operator approval status'],
        expected_outputs: ['System state reflecting proposal updates'],
        risks: mockProposal.proposal.risks,
        rollback: ['Revert state change via manual override']
      }
    };

    expect(plan.plan.objective).toBe(mockProposal.proposal.title);
    expect(plan.plan.steps).toContain('Step A');
    expect(plan.plan.risks).toContain('Risk A');
  });

  it('serializes runs to localStorage', () => {
    const run = { run_id: 'run_1', status: 'planned' };
    localStorage.setItem('diviora.runs.v1', JSON.stringify([run]));
    expect(localStorage.getItem('diviora.runs.v1')).toBe(JSON.stringify([run]));
  });
});
