import { describe, it, expect } from 'vitest';
import { evaluatePolicy, ActionType } from '../lib/policy';
import { Settings, Proposal, Decision, RunPlan } from '../lib/types';

describe('Policy Engine (Issue #13)', () => {
    const defaultSettings: Settings = {
        schema_version: 1,
        proposal_style: 'detailed',
        risk_level: 'medium',
        default_step_count: 5,
        timeline_mode: 'expanded',
        template_id: 'generic',
    };

    const mockProposal: Proposal = {
        proposal_id: 'p1',
        created_at: '2023-01-01',
        input: { message: 'test' },
        proposal: { 
            title: 'Test', 
            summary: 'Summary', 
            next_actions: [], 
            risks: [], 
            sections: [{ key: 'repro', title: 'Reproduction Steps', content: 'Steps' }] 
        }
    };

    it('P1: Blocks run creation if proposal not approved', () => {
        const decision: Decision = { decision_id: 'd1', proposal_id: 'p1', status: 'rejected', decided_at: '2023-01-01' };
        
        const result = evaluatePolicy(
            { type: 'CREATE_RUN_PLAN' },
            { settings: defaultSettings, proposal: mockProposal, decision }
        );

        expect(result.allowed).toBe(false);
        expect(result.policy_ids).toContain('P1_RUN_REQUIRES_APPROVAL');
    });

    it('P1: Allows run creation if approved', () => {
        const decision: Decision = { decision_id: 'd1', proposal_id: 'p1', status: 'approved', decided_at: '2023-01-01' };
        
        const result = evaluatePolicy(
            { type: 'CREATE_RUN_PLAN' },
            { settings: defaultSettings, proposal: mockProposal, decision }
        );

        expect(result.allowed).toBe(true);
    });

    it('P3: Blocks rerun if last attempt was success', () => {
        const run: RunPlan = { 
            run_id: 'r1', proposal_id: 'p1', created_at: '2023-01-01', status: 'planned', 
            plan: { objective: 'obj', steps: [], inputs_needed: [], expected_outputs: [], risks: [], rollback: [] }
        };
        const transcripts = [
            { 
                transcript_id: 't1', run_id: 'r1', created_at: '2023-01-01', status: 'simulated' as const, 
                scenario_id: 'happy_path' as const, attempt: 1, events: [] 
            }
        ];

        const result = evaluatePolicy(
            { type: 'RERUN_TRANSCRIPT', scenarioId: 'happy_path' },
            { settings: defaultSettings, run, transcripts }
        );

        expect(result.allowed).toBe(false);
        expect(result.policy_ids).toContain('P3_NO_RERUN_ON_SUCCESS');
    });

    it('P5: Blocks Bug Triage approval if no Repro Steps', () => {
         const bugSettings = { ...defaultSettings, template_id: 'bug_triage' as const };
         const proposalWithoutRepro = { ...mockProposal, proposal: { ...mockProposal.proposal, sections: [] } };
         
         const result = evaluatePolicy(
             { type: 'APPROVE_PROPOSAL' },
             { settings: bugSettings, proposal: proposalWithoutRepro }
         );

         expect(result.allowed).toBe(false);
         expect(result.policy_ids).toContain('P5_BUG_TRIAGE_REPRO_STEPS');
    });

    it('P6: Blocks approval if summary is empty', () => {
        const emptySummaryProposal = { ...mockProposal, proposal: { ...mockProposal.proposal, summary: '' } };
        
        const result = evaluatePolicy(
            { type: 'APPROVE_PROPOSAL' },
            { settings: defaultSettings, proposal: emptySummaryProposal }
        );

        expect(result.allowed).toBe(false);
        expect(result.policy_ids).toContain('P6_SUMMARY_REQUIRED');
    });
});
