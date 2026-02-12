import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { StoreProvider, useStore } from '../lib/store';
import { Proposal, Decision, Settings } from '../lib/types';
import React from 'react';

const mockSettings: Settings = {
  schema_version: 1,
  proposal_style: 'detailed',
  risk_level: 'medium',
  default_step_count: 5,
  timeline_mode: 'expanded',
  template_id: 'generic',
};

const mockProposal: Proposal = {
  proposal_id: 'prop_scenarios',
  created_at: new Date().toISOString(),
  input: { message: "Test run" },
  proposal: {
    title: "Scenario Test Proposal",
    summary: "Testing scenarios",
    next_actions: ["Step 1", "Step 2", "Step 3"],
    risks: ["Risk A"],
  }
};

const mockDecision: Decision = {
  decision_id: 'dec_scenarios',
  proposal_id: 'prop_scenarios',
  status: 'approved',
  decided_at: new Date().toISOString()
};

describe('Run Scenarios (Issue #12)', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    React.createElement(StoreProvider, null, children)
  );

  it('generates multiple attempts with incrementing attempt numbers', () => {
    const { result } = renderHook(() => useStore(), { wrapper });

    act(() => {
      result.current.addProposal(mockProposal);
      result.current.setDecision(mockDecision);
    });
    
    act(() => {
      result.current.createRunPlan(mockProposal.proposal_id);
    });

    const run = result.current.state.runs[0];
    
    // Attempt 1
    act(() => {
      result.current.generateTranscript(run.run_id, 'happy_path');
    });

    const t1 = result.current.state.transcripts.find(t => t.run_id === run.run_id && t.attempt === 1);
    expect(t1).toBeDefined();
    expect(t1?.scenario_id).toBe('happy_path');

    // Attempt 2 (Rerun)
    act(() => {
      result.current.generateTranscript(run.run_id, 'flaky_inputs');
    });

    const t2 = result.current.state.transcripts.find(t => t.run_id === run.run_id && t.attempt === 2);
    expect(t2).toBeDefined();
    expect(t2?.scenario_id).toBe('flaky_inputs');
    
    // Total count check
    expect(result.current.state.transcripts.filter(t => t.run_id === run.run_id).length).toBe(2);
  });

  it('generates validation_error scenario correctly', () => {
    const { result } = renderHook(() => useStore(), { wrapper });

    act(() => {
      result.current.addProposal(mockProposal);
      result.current.setDecision(mockDecision);
    });
    
    act(() => {
        result.current.createRunPlan(mockProposal.proposal_id);
    });

    const run = result.current.state.runs[0];
    
    act(() => {
      result.current.generateTranscript(run.run_id, 'validation_error');
    });

    const t = result.current.state.transcripts[0];
    expect(t.events[0].level).toBe('error');
    expect(t.events[0].message).toContain('VALIDATION FAILED');
  });

  it('generates rate_limited scenario correctly', () => {
    const { result } = renderHook(() => useStore(), { wrapper });

    act(() => {
      result.current.addProposal(mockProposal);
      result.current.setDecision(mockDecision);
    });
    
    act(() => {
        result.current.createRunPlan(mockProposal.proposal_id);
    });

    const run = result.current.state.runs[0];
    
    act(() => {
      result.current.generateTranscript(run.run_id, 'rate_limited');
    });

    const t = result.current.state.transcripts[0];
    const errorEvent = t.events.find(e => e.level === 'error');
    expect(errorEvent).toBeDefined();
    expect(errorEvent?.message).toContain('429 Too Many Requests');
  });
});
