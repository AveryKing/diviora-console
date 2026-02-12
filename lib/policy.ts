import { PolicyDecision, Proposal, Decision, RunPlan, Settings, RunTranscript } from './types';

// Action Definitions
export type ActionType = 
  | { type: 'APPROVE_PROPOSAL' }
  | { type: 'REJECT_PROPOSAL' } // Policy might just say allowed:true, but useful to have context
  | { type: 'CREATE_RUN_PLAN' }
  | { type: 'GENERATE_TRANSCRIPT', scenarioId: string }
  | { type: 'RERUN_TRANSCRIPT', scenarioId: string };

export interface ActionContext {
  settings: Settings;
  proposal?: Proposal;
  decision?: Decision;
  run?: RunPlan;
  transcripts?: RunTranscript[];
  counts?: { [key: string]: number };
}

export class PolicyError extends Error {
  decision: PolicyDecision;
  constructor(message: string, decision: PolicyDecision) {
    super(message);
    this.name = 'PolicyError';
    this.decision = decision;
  }
}

// Policy Definitions
interface Policy {
  id: string;
  description: string;
  evaluate: (action: ActionType, context: ActionContext) => { allowed: boolean; reason?: string };
}

const POLICIES: Policy[] = [
  {
    id: 'P1_RUN_REQUIRES_APPROVAL',
    description: 'Cannot create run unless proposal is approved',
    evaluate: (action, ctx) => {
      if (action.type !== 'CREATE_RUN_PLAN') return { allowed: true };
      if (!ctx.proposal) return { allowed: false, reason: 'Proposal context missing' };
      if (!ctx.decision || ctx.decision.status !== 'approved') {
        return { allowed: false, reason: 'Proposal is not approved' };
      }
      return { allowed: true };
    }
  },
  {
    id: 'P2_TRANSCRIPT_REQUIRES_RUN',
    description: 'Cannot generate transcript unless run exists',
    evaluate: (action, ctx) => {
      if (action.type !== 'GENERATE_TRANSCRIPT' && action.type !== 'RERUN_TRANSCRIPT') return { allowed: true };
      if (!ctx.run) return { allowed: false, reason: 'Run Plan context missing' };
      return { allowed: true };
    }
  },
  {
    id: 'P3_NO_RERUN_ON_SUCCESS',
    description: 'Cannot rerun if last attempt already SUCCESS',
    evaluate: (action, ctx) => {
      if (action.type !== 'RERUN_TRANSCRIPT') return { allowed: true };
      if (!ctx.transcripts || ctx.transcripts.length === 0) return { allowed: true };
      
      // Sort by attempt desc
      const sorted = [...ctx.transcripts].sort((a,b) => b.attempt - a.attempt);
      const last = sorted[0];
      
      const hasError = last.events.some(e => e.level === 'error');
      if (!hasError) {
        return { allowed: false, reason: 'Last attempt was successful. Rerun denied.' };
      }
      return { allowed: true };
    }
  },
  {
    id: 'P4_HIGH_RISK_RERUN_REQUIRES_NOTE',
    description: 'If risk_level=high and scenario is risky, require a decision note for rerun',
    evaluate: (action, ctx) => {
      if (action.type !== 'RERUN_TRANSCRIPT' && action.type !== 'GENERATE_TRANSCRIPT') return { allowed: true };
      
      // Only applies to RERUN really, but prompt said "GENERATE_TRANSCRIPT (RERUN)"
      // Let's apply to both if we consider generate on existing run as rerun. 
      // But P3 handles explicit rerun action. P4 mentions "require a decision note present before allowing rerun".
      
      if (action.type === 'RERUN_TRANSCRIPT' && ctx.settings.risk_level === 'high') {
         if (['rate_limited', 'flaky_inputs'].includes(action.scenarioId)) {
             if (!ctx.decision?.note || ctx.decision.note.trim() === '') {
                 return { allowed: false, reason: 'High risk rerun requires approval note.' };
             }
         }
      }
      return { allowed: true };
    }
  },
  {
      id: 'P5_BUG_TRIAGE_REPRO_STEPS',
      description: 'If template_id=bug_triage, require Repro Steps section',
      evaluate: (action, ctx) => {
          if (action.type !== 'APPROVE_PROPOSAL') return { allowed: true };
          if (ctx.settings.template_id === 'bug_triage' || ctx.proposal?.proposal.template_id === 'bug_triage') {
              const repro = ctx.proposal?.proposal.sections?.find(s => s.title === 'Reproduction Steps' || s.title === 'Repro Steps');
              if (!repro) {
                  return { allowed: false, reason: 'Bug Triage requires "Reproduction Steps" section.' };
              }
          }
          return { allowed: true };
      }
  },
  {
      id: 'P6_SUMMARY_REQUIRED',
      description: 'Block approve if proposal summary is empty',
      evaluate: (action, ctx) => {
          if (action.type !== 'APPROVE_PROPOSAL') return { allowed: true };
          if (!ctx.proposal?.proposal.summary || ctx.proposal.proposal.summary.trim() === '') {
              return { allowed: false, reason: 'Proposal summary cannot be empty.' };
          }
          return { allowed: true };
      }
  }
];

export function evaluatePolicy(action: ActionType, context: ActionContext): PolicyDecision {
  const reasons: string[] = [];
  const policy_ids: string[] = [];
  let allowed = true;

  try {
      for (const policy of POLICIES) {
        const result = policy.evaluate(action, context);
        if (!result.allowed) {
          allowed = false;
          if (result.reason) reasons.push(result.reason);
          policy_ids.push(policy.id);
        }
      }
  } catch (e) {
      // Fail closed
      return {
          allowed: false,
          reasons: [`Policy evaluation internal error: ${e instanceof Error ? e.message : 'Unknown'}`],
          policy_ids: ['P0_FAIL_CLOSED']
      };
  }

  return {
    allowed,
    reasons,
    policy_ids
  };
}

export function getPolicies() {
    return POLICIES.map(p => ({ id: p.id, description: p.description }));
}
