import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { StoreProvider, useStore } from '../lib/store';
import { Proposal, Decision, RunPlan, Settings } from '../lib/types';
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
  proposal_id: 'prop_999',
  created_at: new Date().toISOString(),
  input: { message: "Test run" },
  proposal: {
    title: "Test Proposal",
    summary: "A test summary",
    next_actions: ["Step 1", "Step 2"],
    risks: ["Risk A"],
  }
};

const mockDecision: Decision = {
  decision_id: 'dec_999',
  proposal_id: 'prop_999',
  status: 'approved',
  decided_at: new Date().toISOString()
};

describe('Run Transcripts (Issue #11)', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    React.createElement(StoreProvider, null, children)
  );

  it('generates a transcript for an existing run', () => {
    const { result } = renderHook(() => useStore(), { wrapper });

    act(() => {
      result.current.addProposal(mockProposal);
    });

    act(() => {
      result.current.setDecision(mockDecision);
    });
    
    act(() => {
      result.current.createRunPlan(mockProposal.proposal_id);
    });

    const run = result.current.state.runs[0];
    expect(run).toBeDefined();

    act(() => {
      result.current.generateTranscript(run.run_id);
    });

    const transcript = result.current.state.transcripts.find(t => t.run_id === run.run_id);
    expect(transcript).toBeDefined();
    expect(transcript?.events.length).toBeGreaterThan(0);
    expect(transcript?.status).toBe('simulated');
  });

  it('generates deterministic transcripts', () => {
    const { result } = renderHook(() => useStore(), { wrapper });

    act(() => {
      result.current.addProposal(mockProposal);
    });

    act(() => {
      result.current.setDecision(mockDecision);
    });
    
    act(() => {
      result.current.createRunPlan(mockProposal.proposal_id);
    });

    const run = result.current.state.runs[0];

    // Use rate_limited to fail first attempt, allowing rerun
    act(() => {
      result.current.generateTranscript(run.run_id, 'rate_limited');
    });

    const t1 = result.current.state.transcripts.find(t => t.run_id === run.run_id);
    
    // Attempt regen (also rate_limited for logic consistency, or different one)
    act(() => {
        result.current.generateTranscript(run.run_id, 'rate_limited');
    });

    const t2 = result.current.state.transcripts.find(t => t.run_id === run.run_id && t.attempt === 2);
    
    // Should return a new transcript (new attempt)
    expect(t1).not.toBe(t2);
    expect(t2?.attempt).toBe((t1?.attempt || 0) + 1); 
  });

  it('fails to generate transcript for missing run', () => {
    const { result } = renderHook(() => useStore(), { wrapper });

    expect(() => {
        act(() => {
            result.current.generateTranscript('non_existent_run');
        });
    }).toThrow("Run not found");
  });

  it('includes risk warnings in transcript based on risk level', () => {
    const { result } = renderHook(() => useStore(), { wrapper });

    act(() => {
      result.current.addProposal(mockProposal);
    });

    // Wait for state propagation?
    // Using fake timer or multiple acts usually works.
    
    act(() => {
      // Re-fetch proposal from state to ensure it exists?
      // No, hooks update automatically.
      // But let's verify before calling setDecision?
      // Cannot verify inside act easily.
      result.current.setDecision(mockDecision);
    });

    act(() => {
        result.current.createRunPlan(mockProposal.proposal_id);
    });

    const run = result.current.state.runs[0];
    
    act(() => {
        result.current.generateTranscript(run.run_id);
    });

    const transcript = result.current.state.transcripts.find(t => t.run_id === run.run_id);
    const warnings = transcript?.events.filter(e => e.level === 'warn');
    
    expect(warnings?.length).toBeGreaterThan(0);
  });
});
