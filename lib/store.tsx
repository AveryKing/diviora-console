'use client';

import React, { createContext, useContext, useEffect, useReducer, ReactNode } from 'react';
import { 
  Proposal, 
  Decision, 
  RunPlan, 
  RunTranscript, 
  ProjectSnapshot,
  Settings, SettingsSchema,
  SnapshotV3, SnapshotV3Schema,
  SnapshotTranscript,
  AppMetadata, AppMetadataSchema,
  ProposalsCollectionSchema,
  DecisionsCollectionSchema,
  RunsCollectionSchema,
  TranscriptsCollectionSchema,
  ProjectSnapshotsCollectionSchema
} from './types';
import { migrateLocalStorage, migrateSnapshot } from './migrations';
import { evaluatePolicy, PolicyError } from './policy';

type State = {
  proposals: Proposal[];
  decisions: Decision[];
  runs: RunPlan[];
  transcripts: RunTranscript[];
  projectSnapshots: ProjectSnapshot[];
  settings: Settings;
  metadata: AppMetadata;
  isLoaded: boolean;
};

type Action =
  | { type: 'HYDRATE'; proposals: Proposal[]; decisions: Decision[]; runs: RunPlan[]; transcripts: RunTranscript[]; projectSnapshots: ProjectSnapshot[]; settings: Settings; metadata: AppMetadata }
  | { type: 'ADD_PROPOSAL'; payload: Proposal }
  | { type: 'SET_DECISION'; payload: Decision }
  | { type: 'ADD_RUN'; payload: RunPlan }
  | { type: 'ADD_TRANSCRIPT'; payload: RunTranscript }
  | { type: 'ADD_PROJECT_SNAPSHOT'; payload: ProjectSnapshot }
  | { type: 'DELETE_PROJECT_SNAPSHOT'; snapshot_id: string }
  | { type: 'UPDATE_SETTINGS'; payload: Partial<Settings> }
  | { type: 'UPDATE_METADATA'; payload: Partial<AppMetadata> }
  | { type: 'REPLACE_STATE'; payload: Omit<State, 'isLoaded'> }
  | { type: 'CLEAR_ALL' };

const STORAGE_KEY_PROPOSALS = 'diviora.proposals.v1';
const STORAGE_KEY_DECISIONS = 'diviora.decisions.v1';
const STORAGE_KEY_RUNS = 'diviora.runs.v1';
const STORAGE_KEY_TRANSCRIPTS = 'diviora.transcripts.v1';
const STORAGE_KEY_PROJECT_SNAPSHOTS = 'diviora.project_snapshots.v1';
const STORAGE_KEY_SETTINGS = 'diviora.settings.v1';
const STORAGE_KEY_METADATA = 'diviora.metadata.v1';

const defaultSettings: Settings = {
  schema_version: 1,
  proposal_style: 'detailed',
  risk_level: 'medium',
  default_step_count: 5,
  timeline_mode: 'expanded',
  agent_view_mode: 'split',
  template_id: 'generic',
};

const initialState: State = {
  proposals: [],
  decisions: [],
  runs: [],
  transcripts: [],
  projectSnapshots: [],
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

    case 'ADD_TRANSCRIPT': {
        const existingIndex = state.transcripts.findIndex(t => t.transcript_id === action.payload.transcript_id);
        let newTranscripts;
        if (existingIndex > -1) {
            newTranscripts = [...state.transcripts];
            newTranscripts[existingIndex] = action.payload;
        } else {
            newTranscripts = [action.payload, ...state.transcripts];
        }
        localStorage.setItem(STORAGE_KEY_TRANSCRIPTS, JSON.stringify({ schema_version: 1, items: newTranscripts }));
        return { ...state, transcripts: newTranscripts };
    }

    case 'ADD_PROJECT_SNAPSHOT': {
      const withNewSnapshot = [action.payload, ...state.projectSnapshots];
      withNewSnapshot.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      localStorage.setItem(STORAGE_KEY_PROJECT_SNAPSHOTS, JSON.stringify({ schema_version: 1, items: withNewSnapshot }));
      return { ...state, projectSnapshots: withNewSnapshot };
    }

    case 'DELETE_PROJECT_SNAPSHOT': {
      const remainingSnapshots = state.projectSnapshots.filter((snapshot) => snapshot.snapshot_id !== action.snapshot_id);
      localStorage.setItem(STORAGE_KEY_PROJECT_SNAPSHOTS, JSON.stringify({ schema_version: 1, items: remainingSnapshots }));
      return { ...state, projectSnapshots: remainingSnapshots };
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
      const { proposals, decisions, runs, transcripts, projectSnapshots, settings, metadata } = action.payload;
      localStorage.setItem(STORAGE_KEY_PROPOSALS, JSON.stringify({ schema_version: 1, items: proposals }));
      localStorage.setItem(STORAGE_KEY_DECISIONS, JSON.stringify({ schema_version: 1, items: decisions }));
      localStorage.setItem(STORAGE_KEY_RUNS, JSON.stringify({ schema_version: 1, items: runs }));
      localStorage.setItem(STORAGE_KEY_TRANSCRIPTS, JSON.stringify({ schema_version: 1, items: transcripts }));
      localStorage.setItem(STORAGE_KEY_PROJECT_SNAPSHOTS, JSON.stringify({ schema_version: 1, items: projectSnapshots }));
      localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(settings));
      localStorage.setItem(STORAGE_KEY_METADATA, JSON.stringify(metadata));
      return { ...action.payload, isLoaded: true };
    }

    case 'CLEAR_ALL':
      localStorage.removeItem(STORAGE_KEY_PROPOSALS);
      localStorage.removeItem(STORAGE_KEY_DECISIONS);
      localStorage.removeItem(STORAGE_KEY_RUNS);
      localStorage.removeItem(STORAGE_KEY_TRANSCRIPTS);
      localStorage.removeItem(STORAGE_KEY_PROJECT_SNAPSHOTS);
      localStorage.removeItem(STORAGE_KEY_SETTINGS);
      localStorage.removeItem(STORAGE_KEY_METADATA);
      localStorage.removeItem('diviora_proposals');
      return { ...state, proposals: [], decisions: [], runs: [], transcripts: [], projectSnapshots: [], settings: defaultSettings, metadata: {} };
    
    default:
      return state;
  }
}

const StoreContext = createContext<{
  state: State;
  addProposal: (proposal: Proposal) => void;
  setDecision: (decision: Decision) => void;
  createRunPlan: (proposal_id: string) => RunPlan;
  generateTranscript: (run_id: string, scenarioId?: 'happy_path' | 'flaky_inputs' | 'rate_limited' | 'validation_error', seed?: string) => RunTranscript;
  addProjectSnapshot: (snapshot: ProjectSnapshot) => void;
  deleteProjectSnapshot: (snapshot_id: string) => void;
  updateSettings: (partial: Partial<Settings>) => void;
  resetAllData: () => void;
  exportSnapshot: () => SnapshotV3;
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
      const savedTranscripts = localStorage.getItem(STORAGE_KEY_TRANSCRIPTS);
      const savedProjectSnapshots = localStorage.getItem(STORAGE_KEY_PROJECT_SNAPSHOTS);
      const savedSettings = localStorage.getItem(STORAGE_KEY_SETTINGS);
      const savedMetadata = localStorage.getItem(STORAGE_KEY_METADATA);
      
      let proposals: Proposal[] = [];
      let decisions: Decision[] = [];
      let runs: RunPlan[] = [];
      let transcripts: RunTranscript[] = [];
      let projectSnapshots: ProjectSnapshot[] = [];
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

      if (savedTranscripts) {
        try {
          const parsed = JSON.parse(savedTranscripts);
          const result = TranscriptsCollectionSchema.safeParse(parsed);
          if (result.success) {
            transcripts = result.data.items;
          }
        } catch (e) { console.error('Failed to parse transcripts:', e); }
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

      if (savedProjectSnapshots) {
        try {
          const parsed = JSON.parse(savedProjectSnapshots);
          const result = ProjectSnapshotsCollectionSchema.safeParse(parsed);
          if (result.success) {
            projectSnapshots = result.data.items;
          }
        } catch (e) { console.error('Failed to parse project snapshots:', e); }
      }

      dispatch({ type: 'HYDRATE', proposals, decisions, runs, transcripts, projectSnapshots, settings, metadata });
    };

    loadData();
  }, []);

  const addProposal = (payload: Proposal) => dispatch({ type: 'ADD_PROPOSAL', payload });
  const addProjectSnapshot = (payload: ProjectSnapshot) => dispatch({ type: 'ADD_PROJECT_SNAPSHOT', payload });
  const deleteProjectSnapshot = (snapshot_id: string) => dispatch({ type: 'DELETE_PROJECT_SNAPSHOT', snapshot_id });
  const setDecision = (payload: Decision) => {
    const proposal = state.proposals.find(p => p.proposal_id === payload.proposal_id);
    const actionType = payload.status === 'approved' ? 'APPROVE_PROPOSAL' : 'REJECT_PROPOSAL';
    const polDecision = evaluatePolicy(
        { type: actionType }, 
        { settings: state.settings, proposal, decision: payload }
    );
    
    if (!polDecision.allowed) {
        throw new PolicyError(`Policy Violation: ${polDecision.reasons[0]}`, polDecision);
    }
    dispatch({ type: 'SET_DECISION', payload });
  };
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

    // Policy Check
    const polDecision = evaluatePolicy(
        { type: 'CREATE_RUN_PLAN' }, 
        { settings: state.settings, proposal, decision, run: runPlan }
    );
    if (!polDecision.allowed) {
        throw new PolicyError(`Policy Violation (Create Run): ${polDecision.reasons[0]}`, polDecision);
    }

    dispatch({ type: 'ADD_RUN', payload: runPlan });
    return runPlan;
  };

  const generateTranscript = (run_id: string, scenarioId: 'happy_path' | 'flaky_inputs' | 'rate_limited' | 'validation_error' = 'happy_path', seed?: string): RunTranscript => {
    const run = state.runs.find(r => r.run_id === run_id);
    if (!run) throw new Error("Run not found");

    const existingTranscripts = state.transcripts.filter(t => t.run_id === run_id);

    
    // If exact same request (same scenario, no seed override), return existing latest if relevant?
    // Requirement says: "Rerun creates a NEW transcript record (do not overwrite)."
    // So we always generate new if explicitly requested via UI action, but maybe idempotency check is for "viewing"?
    // The previous implementation was idempotent: "if (existing) return existing".
    // New requirement: "Rerun creates a NEW transcript record".
    // So if called via the "Rerun" button, we definitely want a new one. But the signature doesn't distinguish "view" from "create".
    // However, the text says: "Only one “current” transcript shown by default (latest attempt)".
    // Let's assume this function is ONLY called when we want to GENERATE a new one.
    // But for backward compatibility/idempotency tests, maybe we check if attempt 1 exists for this scenario?
    // Actually, "Rerun creates a NEW transcript".
    // Let's just create new every time this is called, assuming the UI protects against accidental calls.
    // Wait, "Once generated, transcript is immutable".

    const attempt = existingTranscripts.length + 1;
    const transcriptId = `tx_${Math.random().toString(36).substr(2, 9)}`;
    const createdAt = new Date().toISOString();
    const baseTime = new Date(createdAt).getTime();

    const events: RunTranscript['events'] = [];
    const steps = run.plan.steps;
    const risks = run.plan.risks;
    const riskLevel = state.settings.risk_level;

    // Policy Check
    const isRerun = existingTranscripts.length > 0;
    const actionType = isRerun ? 'RERUN_TRANSCRIPT' : 'GENERATE_TRANSCRIPT';

    const transcriptProposalId = run.proposal_id;
    const transcriptDecision = state.decisions.find(d => d.proposal_id === transcriptProposalId);

    const polDecision = evaluatePolicy(
        { type: actionType, scenarioId }, 
        { 
            settings: state.settings, 
            run, 
            transcripts: existingTranscripts, 
            decision: transcriptDecision,
            counts: { attempts: existingTranscripts.length } 
        }
    );

    if (!polDecision.allowed) {
        throw new PolicyError(`Policy Violation (Transcript): ${polDecision.reasons[0]}`, polDecision);
    }

    // SCENARIO LOGIC
    if (scenarioId === 'validation_error') {
         events.push({
            ts: new Date(baseTime).toISOString(),
            level: 'error',
            step_index: 0,
            message: `VALIDATION FAILED: Missing required input 'Operator approval status'.`,
        });
    } else {
        // Pseudo-random deterministic
        const pseudoRandom = (input: number) => {
             const x = Math.sin(input + (seed ? seed.length : 0) + attempt) * 10000;
             return x - Math.floor(x);
        };

        let hasFailed = false;

        steps.forEach((step, index) => {
            if (hasFailed) return;

            // START
            events.push({
                ts: new Date(baseTime + (index * 30000)).toISOString(),
                level: 'info',
                step_index: index + 1,
                message: `INIT STEP ${index + 1}: ${step.substring(0, 40)}...`,
            });

            // SCENARIO: Rate Limited
            if (scenarioId === 'rate_limited' && index === 1) {
                events.push({
                    ts: new Date(baseTime + (index * 30000) + 2000).toISOString(),
                    level: 'error',
                    step_index: index + 1,
                    message: `API ERROR: 429 Too Many Requests. Retry-After: 30s.`,
                });
                hasFailed = true;
                return;
            }

            // ACTION
            events.push({
                ts: new Date(baseTime + (index * 30000) + 5000).toISOString(),
                level: 'info',
                step_index: index + 1,
                message: `EXECUTING: ${step}`,
            });

            // SCENARIO: Flaky Inputs
            if (scenarioId === 'flaky_inputs') {
                if (index === 2) { // Fail on 3rd step
                     events.push({
                        ts: new Date(baseTime + (index * 30000) + 7000).toISOString(),
                        level: 'error',
                        step_index: index + 1,
                        message: `RUNTIME ERROR: Input data inconsistent with schema v2.`,
                    });
                    hasFailed = true;
                    return;
                }
                // Determine warnings
                if (pseudoRandom(index) > 0.3) {
                     events.push({
                        ts: new Date(baseTime + (index * 30000) + 8000).toISOString(),
                        level: 'warn',
                        step_index: index + 1,
                        message: `FLAKY: unexpected latency detected (${Math.floor(pseudoRandom(index)*500)}ms).`,
                    });
                }
            }

            // WARNING (Deterministic Risk Injection from happy path)
            if (scenarioId === 'happy_path' && risks.length > 0 && (index + 1) % 2 === 0 && riskLevel !== 'low') {
                 events.push({
                    ts: new Date(baseTime + (index * 30000) + 10000).toISOString(),
                    level: 'warn',
                    step_index: index + 1,
                    message: `RISK CHECK: ${risks[index % risks.length]}`,
                });
            }

            // RESULT
            events.push({
                ts: new Date(baseTime + (index * 30000) + 15000).toISOString(),
                level: 'info',
                step_index: index + 1,
                message: `COMPLETE: Step ${index + 1} finalized successfully.`,
            });
        });
    }

    const transcript: RunTranscript = {
        transcript_id: transcriptId,
        run_id: run.run_id,
        created_at: createdAt,
        status: 'simulated',
        scenario_id: scenarioId,
        attempt: attempt,
        events: events
    };

    dispatch({ type: 'ADD_TRANSCRIPT', payload: transcript });
    return transcript;
  };

  const exportSnapshot = (): SnapshotV3 => {
    const now = new Date().toISOString();
    dispatch({ type: 'UPDATE_METADATA', payload: { last_exported_at: now } });

    const runProposalMap = new Map(state.runs.map((run) => [run.run_id, run.proposal_id]));
    const snapshotTranscripts: SnapshotTranscript[] = state.transcripts.map((transcript) => {
      const proposalId = runProposalMap.get(transcript.run_id);
      if (!proposalId) {
        throw new Error(`Snapshot export failed: transcript ${transcript.transcript_id} refers to missing run ${transcript.run_id}`);
      }
      return {
        ...transcript,
        proposal_id: proposalId,
      };
    });

    return {
      snapshot_version: 3,
      exported_at: now,
      app_version: "0.1.0",
      state_schema_versions: {
        settings: 1,
        proposals: 1,
        decisions: 1,
        runs: 1,
        transcripts: 1,
      },
      settings: state.settings,
      proposals: state.proposals,
      decisions: state.decisions,
      runs: state.runs,
      transcripts: snapshotTranscripts,
    };
  };

  const importSnapshot = (payload: unknown): { ok: true } | { ok: false, error: string } => {
    try {
      const snapshot = migrateSnapshot(payload);
      
      const result = SnapshotV3Schema.safeParse(snapshot);
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

      const runById = new Map(snapshot.runs.map((run) => [run.run_id, run]));
      for (const t of snapshot.transcripts) {
        const run = runById.get(t.run_id);
        if (!run) {
          return { ok: false, error: `Referential integrity failed: Transcript ${t.transcript_id} refers to missing run ${t.run_id}` };
        }
        if (!proposalIds.has(t.proposal_id)) {
          return { ok: false, error: `Referential integrity failed: Transcript ${t.transcript_id} refers to missing proposal ${t.proposal_id}` };
        }
        if (run.proposal_id !== t.proposal_id) {
          return { ok: false, error: `Referential integrity failed: Transcript ${t.transcript_id} proposal ${t.proposal_id} does not match run ${t.run_id} proposal ${run.proposal_id}` };
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
          transcripts: snapshot.transcripts.map((transcript) => ({
            transcript_id: transcript.transcript_id,
            run_id: transcript.run_id,
            created_at: transcript.created_at,
            status: transcript.status,
            scenario_id: transcript.scenario_id,
            attempt: transcript.attempt,
            events: transcript.events,
          })),
          projectSnapshots: state.projectSnapshots,
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
    <StoreContext.Provider value={{ state, addProposal, setDecision, createRunPlan, generateTranscript, addProjectSnapshot, deleteProjectSnapshot, updateSettings, resetAllData, exportSnapshot, importSnapshot }}>
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
