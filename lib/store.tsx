'use client';

import React, { createContext, useContext, useEffect, useReducer, ReactNode } from 'react';
import { Proposal, ProposalSchema, Decision, DecisionSchema, RunPlan, RunPlanSchema } from './types';

type State = {
  proposals: Proposal[];
  decisions: Decision[];
  runs: RunPlan[];
  isLoaded: boolean;
};

type Action =
  | { type: 'HYDRATE'; proposals: Proposal[]; decisions: Decision[]; runs: RunPlan[] }
  | { type: 'ADD_PROPOSAL'; payload: Proposal }
  | { type: 'SET_DECISION'; payload: Decision }
  | { type: 'ADD_RUN'; payload: RunPlan }
  | { type: 'CLEAR_ALL' };

const STORAGE_KEY_PROPOSALS = 'diviora.proposals.v1';
const STORAGE_KEY_DECISIONS = 'diviora.decisions.v1';
const STORAGE_KEY_RUNS = 'diviora.runs.v1';

const initialState: State = {
  proposals: [],
  decisions: [],
  runs: [],
  isLoaded: false,
};

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'HYDRATE':
      return { 
        ...state, 
        proposals: action.proposals, 
        decisions: action.decisions, 
        runs: action.runs,
        isLoaded: true 
      };
    
    case 'ADD_PROPOSAL': {
      const existingIndex = state.proposals.findIndex(p => p.proposal_id === action.payload.proposal_id);
      let newProposals;
      if (existingIndex > -1) {
        newProposals = [...state.proposals];
        newProposals[existingIndex] = action.payload;
      } else {
        newProposals = [action.payload, ...state.proposals];
      }
      newProposals.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      
      localStorage.setItem(STORAGE_KEY_PROPOSALS, JSON.stringify(newProposals));
      return { ...state, proposals: newProposals };
    }

    case 'SET_DECISION': {
      const existingIndex = state.decisions.findIndex(d => d.proposal_id === action.payload.proposal_id);
      let newDecisions;
      if (existingIndex > -1) {
        newDecisions = [...state.decisions];
        newDecisions[existingIndex] = action.payload;
      } else {
        newDecisions = [action.payload, ...state.decisions];
      }
      newDecisions.sort((a, b) => new Date(b.decided_at).getTime() - new Date(a.decided_at).getTime());
      
      localStorage.setItem(STORAGE_KEY_DECISIONS, JSON.stringify(newDecisions));
      return { ...state, decisions: newDecisions };
    }

    case 'ADD_RUN': {
      const existingIndex = state.runs.findIndex(r => r.proposal_id === action.payload.proposal_id);
      let newRuns;
      if (existingIndex > -1) {
        newRuns = [...state.runs];
        newRuns[existingIndex] = action.payload;
      } else {
        newRuns = [action.payload, ...state.runs];
      }
      newRuns.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      
      localStorage.setItem(STORAGE_KEY_RUNS, JSON.stringify(newRuns));
      return { ...state, runs: newRuns };
    }

    case 'CLEAR_ALL':
      localStorage.removeItem(STORAGE_KEY_PROPOSALS);
      localStorage.removeItem(STORAGE_KEY_DECISIONS);
      localStorage.removeItem(STORAGE_KEY_RUNS);
      return { ...state, proposals: [], decisions: [], runs: [] };
    
    default:
      return state;
  }
}

const StoreContext = createContext<{
  state: State;
  addProposal: (proposal: Proposal) => void;
  setDecision: (decision: Decision) => void;
  createRunPlan: (proposal_id: string) => RunPlan;
  clearAll: () => void;
} | undefined>(undefined);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    const loadData = () => {
      const savedProposals = localStorage.getItem(STORAGE_KEY_PROPOSALS) || localStorage.getItem('diviora_proposals');
      const savedDecisions = localStorage.getItem(STORAGE_KEY_DECISIONS);
      const savedRuns = localStorage.getItem(STORAGE_KEY_RUNS);
      
      let proposals: Proposal[] = [];
      let decisions: Decision[] = [];
      let runs: RunPlan[] = [];

      if (savedProposals) {
        try {
          const parsed = JSON.parse(savedProposals);
          if (Array.isArray(parsed)) {
            proposals = parsed
              .map(p => {
                const result = ProposalSchema.safeParse(p);
                return result.success ? result.data : null;
              })
              .filter((p): p is Proposal => p !== null);
          }
        } catch (e) { console.error('Failed to parse proposals:', e); }
      }

      if (savedDecisions) {
        try {
          const parsed = JSON.parse(savedDecisions);
          if (Array.isArray(parsed)) {
            decisions = parsed
              .map(d => {
                const result = DecisionSchema.safeParse(d);
                return result.success ? result.data : null;
              })
              .filter((d): d is Decision => d !== null);
          }
        } catch (e) { console.error('Failed to parse decisions:', e); }
      }

      if (savedRuns) {
        try {
          const parsed = JSON.parse(savedRuns);
          if (Array.isArray(parsed)) {
            runs = parsed
              .map(r => {
                const result = RunPlanSchema.safeParse(r);
                return result.success ? result.data : null;
              })
              .filter((r): r is RunPlan => r !== null);
          }
        } catch (e) { console.error('Failed to parse runs:', e); }
      }

      dispatch({ type: 'HYDRATE', proposals, decisions, runs });
    };

    loadData();
  }, []);

  const addProposal = (payload: Proposal) => dispatch({ type: 'ADD_PROPOSAL', payload });
  const setDecision = (payload: Decision) => dispatch({ type: 'SET_DECISION', payload });
  
  const createRunPlan = (proposal_id: string): RunPlan => {
    const proposal = state.proposals.find(p => p.proposal_id === proposal_id);
    const decision = state.decisions.find(d => d.proposal_id === proposal_id);

    if (!proposal) throw new Error("Proposal not found");
    if (!decision || decision.status !== 'approved') {
      throw new Error("Cannot create run plan for unapproved proposal");
    }

    const runPlan: RunPlan = {
      run_id: `run_${Math.random().toString(36).substr(2, 9)}`,
      proposal_id: proposal.proposal_id,
      created_at: new Date().toISOString(),
      status: 'planned',
      plan: {
        objective: proposal.proposal.title,
        steps: proposal.proposal.next_actions.length > 0 
          ? proposal.proposal.next_actions 
          : ["Execute proposal objective"],
        inputs_needed: ["Operator approval status"],
        expected_outputs: ["System state reflecting proposal updates"],
        risks: proposal.proposal.risks,
        rollback: ["Revert state change via manual override"]
      }
    };

    dispatch({ type: 'ADD_RUN', payload: runPlan });
    return runPlan;
  };

  const clearAll = () => dispatch({ type: 'CLEAR_ALL' });

  return (
    <StoreContext.Provider value={{ state, addProposal, setDecision, createRunPlan, clearAll }}>
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const context = useContext(StoreContext);
  if (context === undefined) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
}
