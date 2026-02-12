'use client';

import React, { createContext, useContext, useEffect, useReducer, ReactNode } from 'react';
import { 
  Proposal, 
  Decision, 
  RunPlan, 
  Settings, SettingsSchema,
  SnapshotV2, SnapshotV2Schema,
  AppMetadata, AppMetadataSchema,
  ProposalsCollectionSchema,
  DecisionsCollectionSchema,
  RunsCollectionSchema
} from './types';
import { migrateLocalStorage, migrateSnapshot } from './migrations';

type State = {
  proposals: Proposal[];
  decisions: Decision[];
  runs: RunPlan[];
  settings: Settings;
  metadata: AppMetadata;
  isLoaded: boolean;
};

type Action =
  | { type: 'HYDRATE'; proposals: Proposal[]; decisions: Decision[]; runs: RunPlan[]; settings: Settings; metadata: AppMetadata }
  | { type: 'ADD_PROPOSAL'; payload: Proposal }
  | { type: 'SET_DECISION'; payload: Decision }
  | { type: 'ADD_RUN'; payload: RunPlan }
  | { type: 'UPDATE_SETTINGS'; payload: Partial<Settings> }
  | { type: 'UPDATE_METADATA'; payload: Partial<AppMetadata> }
  | { type: 'REPLACE_STATE'; payload: Omit<State, 'isLoaded'> }
  | { type: 'CLEAR_ALL' };

const STORAGE_KEY_PROPOSALS = 'diviora.proposals.v1';
const STORAGE_KEY_DECISIONS = 'diviora.decisions.v1';
const STORAGE_KEY_RUNS = 'diviora.runs.v1';
const STORAGE_KEY_SETTINGS = 'diviora.settings.v1';
const STORAGE_KEY_METADATA = 'diviora.metadata.v1';

const defaultSettings: Settings = {
  schema_version: 1,
  proposal_style: 'detailed',
  risk_level: 'medium',
  default_step_count: 5,
  timeline_mode: 'expanded',
  template_id: 'generic',
};

const initialState: State = {
  proposals: [],
  decisions: [],
  runs: [],
  settings: defaultSettings,
  metadata: {},
  isLoaded: false,
};

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'HYDRATE':
      return { 
        ...state, 
        ...action,
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
      
      localStorage.setItem(STORAGE_KEY_PROPOSALS, JSON.stringify({ schema_version: 1, items: newProposals }));
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
      
      localStorage.setItem(STORAGE_KEY_DECISIONS, JSON.stringify({ schema_version: 1, items: newDecisions }));
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
      
      localStorage.setItem(STORAGE_KEY_RUNS, JSON.stringify({ schema_version: 1, items: newRuns }));
      return { ...state, runs: newRuns };
    }

    case 'UPDATE_SETTINGS': {
      const newSettings = { ...state.settings, ...action.payload };
      localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(newSettings));
      return { ...state, settings: newSettings };
    }

    case 'UPDATE_METADATA': {
      const newMetadata = { ...state.metadata, ...action.payload };
      localStorage.setItem(STORAGE_KEY_METADATA, JSON.stringify(newMetadata));
      return { ...state, metadata: newMetadata };
    }

    case 'REPLACE_STATE': {
      const { proposals, decisions, runs, settings, metadata } = action.payload;
      localStorage.setItem(STORAGE_KEY_PROPOSALS, JSON.stringify({ schema_version: 1, items: proposals }));
      localStorage.setItem(STORAGE_KEY_DECISIONS, JSON.stringify({ schema_version: 1, items: decisions }));
      localStorage.setItem(STORAGE_KEY_RUNS, JSON.stringify({ schema_version: 1, items: runs }));
      localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(settings));
      localStorage.setItem(STORAGE_KEY_METADATA, JSON.stringify(metadata));
      return { ...action.payload, isLoaded: true };
    }

    case 'CLEAR_ALL':
      localStorage.removeItem(STORAGE_KEY_PROPOSALS);
      localStorage.removeItem(STORAGE_KEY_DECISIONS);
      localStorage.removeItem(STORAGE_KEY_RUNS);
      localStorage.removeItem(STORAGE_KEY_SETTINGS);
      localStorage.removeItem(STORAGE_KEY_METADATA);
      localStorage.removeItem('diviora_proposals');
      return { ...state, proposals: [], decisions: [], runs: [], settings: defaultSettings, metadata: {} };
    
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
  exportSnapshot: () => SnapshotV2;
  importSnapshot: (snapshot: unknown) => { ok: true } | { ok: false, error: string };
} | undefined>(undefined);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    const loadData = () => {
      migrateLocalStorage();

      const savedProposals = localStorage.getItem(STORAGE_KEY_PROPOSALS);
      const savedDecisions = localStorage.getItem(STORAGE_KEY_DECISIONS);
      const savedRuns = localStorage.getItem(STORAGE_KEY_RUNS);
      const savedSettings = localStorage.getItem(STORAGE_KEY_SETTINGS);
      const savedMetadata = localStorage.getItem(STORAGE_KEY_METADATA);
      
      let proposals: Proposal[] = [];
      let decisions: Decision[] = [];
      let runs: RunPlan[] = [];
      let settings: Settings = defaultSettings;
      let metadata: AppMetadata = {};

      if (savedProposals) {
        try {
          const parsed = JSON.parse(savedProposals);
          const result = ProposalsCollectionSchema.safeParse(parsed);
          if (result.success) {
            proposals = result.data.items;
          }
        } catch (e) { console.error('Failed to parse proposals:', e); }
      }

      if (savedDecisions) {
        try {
          const parsed = JSON.parse(savedDecisions);
          const result = DecisionsCollectionSchema.safeParse(parsed);
          if (result.success) {
            decisions = result.data.items;
          }
        } catch (e) { console.error('Failed to parse decisions:', e); }
      }

      if (savedRuns) {
        try {
          const parsed = JSON.parse(savedRuns);
          const result = RunsCollectionSchema.safeParse(parsed);
          if (result.success) {
            runs = result.data.items;
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

      if (savedMetadata) {
        try {
          const parsed = JSON.parse(savedMetadata);
          const result = AppMetadataSchema.safeParse(parsed);
          if (result.success) {
            metadata = result.data;
          }
        } catch (e) { console.error('Failed to parse metadata:', e); }
      }

      dispatch({ type: 'HYDRATE', proposals, decisions, runs, settings, metadata });
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

  const exportSnapshot = (): SnapshotV2 => {
    const now = new Date().toISOString();
    dispatch({ type: 'UPDATE_METADATA', payload: { last_exported_at: now } });
    return {
      snapshot_version: 2,
      exported_at: now,
      app_version: "0.1.0",
      state_schema_versions: {
        settings: 1,
        proposals: 1,
        decisions: 1,
        runs: 1,
      },
      settings: state.settings,
      proposals: state.proposals,
      decisions: state.decisions,
      runs: state.runs,
    };
  };

  const importSnapshot = (payload: unknown): { ok: true } | { ok: false, error: string } => {
    try {
      const snapshot = migrateSnapshot(payload);
      
      const result = SnapshotV2Schema.safeParse(snapshot);
      if (!result.success) {
        return { ok: false, error: `Invalid snapshot schema: ${result.error.issues[0].message}` };
      }

      const proposalIds = new Set(snapshot.proposals.map(p => p.proposal_id));

      for (const d of snapshot.decisions) {
        if (!proposalIds.has(d.proposal_id)) {
          return { ok: false, error: `Referential integrity failed: Decision ${d.decision_id} refers to missing proposal ${d.proposal_id}` };
        }
      }

      for (const r of snapshot.runs) {
        if (!proposalIds.has(r.proposal_id)) {
          return { ok: false, error: `Referential integrity failed: Run ${r.run_id} refers to missing proposal ${r.proposal_id}` };
        }
      }

      const now = new Date().toISOString();
      const updatedMetadata: AppMetadata = {
        ...state.metadata,
        last_imported_at: now,
        last_imported_version: snapshot.snapshot_version,
      };

      dispatch({ 
        type: 'REPLACE_STATE', 
        payload: {
          proposals: snapshot.proposals,
          decisions: snapshot.decisions,
          runs: snapshot.runs,
          settings: snapshot.settings,
          metadata: updatedMetadata
        }
      });

      return { ok: true };
    } catch (e) {
      return { ok: false, error: `Import failed: ${e instanceof Error ? e.message : 'Unknown error'}` };
    }
  };

  return (
    <StoreContext.Provider value={{ state, addProposal, setDecision, createRunPlan, updateSettings, resetAllData, exportSnapshot, importSnapshot }}>
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
