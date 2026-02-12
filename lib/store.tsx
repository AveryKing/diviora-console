'use client';

import React, { createContext, useContext, useEffect, useReducer, ReactNode } from 'react';
import { Proposal, ProposalSchema, Decision, DecisionSchema, RunPlan, RunPlanSchema, Settings, SettingsSchema } from './types';

type State = {
  proposals: Proposal[];
  decisions: Decision[];
  runs: RunPlan[];
  settings: Settings;
  isLoaded: boolean;
};

type Action =
  | { type: 'HYDRATE'; proposals: Proposal[]; decisions: Decision[]; runs: RunPlan[]; settings: Settings }
  | { type: 'ADD_PROPOSAL'; payload: Proposal }
  | { type: 'SET_DECISION'; payload: Decision }
  | { type: 'ADD_RUN'; payload: RunPlan }
  | { type: 'UPDATE_SETTINGS'; payload: Partial<Settings> }
  | { type: 'CLEAR_ALL' };

const STORAGE_KEY_PROPOSALS = 'diviora.proposals.v1';
const STORAGE_KEY_DECISIONS = 'diviora.decisions.v1';
const STORAGE_KEY_RUNS = 'diviora.runs.v1';
const STORAGE_KEY_SETTINGS = 'diviora.settings.v1';

const defaultSettings: Settings = {
  schema_version: 1,
  proposal_style: 'detailed',
  risk_level: 'medium',
  default_step_count: 5,
  timeline_mode: 'expanded',
};

const initialState: State = {
  proposals: [],
  decisions: [],
  runs: [],
  settings: defaultSettings,
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
        settings: action.settings,
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

    case 'UPDATE_SETTINGS': {
      const newSettings = { ...state.settings, ...action.payload };
      localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(newSettings));
      return { ...state, settings: newSettings };
    }

    case 'CLEAR_ALL':
      localStorage.removeItem(STORAGE_KEY_PROPOSALS);
      localStorage.removeItem(STORAGE_KEY_DECISIONS);
      localStorage.removeItem(STORAGE_KEY_RUNS);
      localStorage.removeItem(STORAGE_KEY_SETTINGS);
      localStorage.removeItem('diviora_proposals'); // Legacy
      return { ...state, proposals: [], decisions: [], runs: [], settings: defaultSettings };
    
    default:
      return state;
  }
}

const StoreContext = createContext<{
  state: State;
  addProposal: (proposal: Proposal) => void;
  setDecision: (decision: Decision) => void;
  createRunPlan: (proposal_id: string) => RunPlan;
  updateSettings: (partial: Partial<Settings>) => void;
  resetAllData: () => void;
} | undefined>(undefined);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    const loadData = () => {
      const savedProposals = localStorage.getItem(STORAGE_KEY_PROPOSALS) || localStorage.getItem('diviora_proposals');
      const savedDecisions = localStorage.getItem(STORAGE_KEY_DECISIONS);
      const savedRuns = localStorage.getItem(STORAGE_KEY_RUNS);
      const savedSettings = localStorage.getItem(STORAGE_KEY_SETTINGS);
      
      let proposals: Proposal[] = [];
      let decisions: Decision[] = [];
      let runs: RunPlan[] = [];
      let settings: Settings = defaultSettings;

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

      if (savedSettings) {
        try {
          const parsed = JSON.parse(savedSettings);
          const result = SettingsSchema.safeParse(parsed);
          if (result.success) {
            settings = result.data;
          }
        } catch (e) { console.error('Failed to parse settings:', e); }
      }

      dispatch({ type: 'HYDRATE', proposals, decisions, runs, settings });
    };

    loadData();
  }, []);

  const addProposal = (payload: Proposal) => dispatch({ type: 'ADD_PROPOSAL', payload });
  const setDecision = (payload: Decision) => dispatch({ type: 'SET_DECISION', payload });
  const updateSettings = (payload: Partial<Settings>) => dispatch({ type: 'UPDATE_SETTINGS', payload });
  const resetAllData = () => {
    if (confirm("Are you sure you want to reset all data? This will clear all history and settings.")) {
      dispatch({ type: 'CLEAR_ALL' });
    }
  };
  
  const createRunPlan = (proposal_id: string): RunPlan => {
    const proposal = state.proposals.find(p => p.proposal_id === proposal_id);
    const decision = state.decisions.find(d => d.proposal_id === proposal_id);

    if (!proposal) throw new Error("Proposal not found");
    if (!decision || decision.status !== 'approved') {
      throw new Error("Cannot create run plan for unapproved proposal");
    }

    // Config-aware run plan generation
    const stepCount = state.settings.default_step_count;
    const baseSteps = proposal.proposal.next_actions;
    let finalSteps = [...baseSteps];
    
    if (finalSteps.length > stepCount) {
      finalSteps = finalSteps.slice(0, stepCount);
    } else while (finalSteps.length < stepCount) {
      finalSteps.push(`Additional verification step ${finalSteps.length + 1}`);
    }

    const riskLevel = state.settings.risk_level;
    const extraRisks = riskLevel === 'high' 
      ? ["High-sensitivity production environment", "Complex dependency chain"]
      : riskLevel === 'medium'
      ? ["Manual verification required"]
      : [];

    const runPlan: RunPlan = {
      run_id: `run_${Math.random().toString(36).substr(2, 9)}`,
      proposal_id: proposal.proposal_id,
      created_at: new Date().toISOString(),
      status: 'planned',
      plan: {
        objective: proposal.proposal.title,
        steps: finalSteps,
        inputs_needed: ["Operator approval status"],
        expected_outputs: ["System state reflecting proposal updates"],
        risks: [...proposal.proposal.risks, ...extraRisks],
        rollback: ["Revert state change via manual override", ...(riskLevel === 'high' ? ["Initialize fail-over sequence"] : [])]
      }
    };

    dispatch({ type: 'ADD_RUN', payload: runPlan });
    return runPlan;
  };

  return (
    <StoreContext.Provider value={{ state, addProposal, setDecision, createRunPlan, updateSettings, resetAllData }}>
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
