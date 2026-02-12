'use client';

import React, { createContext, useContext, useEffect, useReducer, ReactNode } from 'react';
import { Proposal, ProposalSchema, Decision, DecisionSchema } from './types';

type State = {
  proposals: Proposal[];
  decisions: Decision[];
  isLoaded: boolean;
};

type Action =
  | { type: 'HYDRATE'; proposals: Proposal[]; decisions: Decision[] }
  | { type: 'ADD_PROPOSAL'; payload: Proposal }
  | { type: 'SET_DECISION'; payload: Decision }
  | { type: 'CLEAR_ALL' };

const STORAGE_KEY_PROPOSALS = 'diviora.proposals.v1';
const STORAGE_KEY_DECISIONS = 'diviora.decisions.v1';

const initialState: State = {
  proposals: [],
  decisions: [],
  isLoaded: false,
};

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'HYDRATE':
      return { 
        ...state, 
        proposals: action.proposals, 
        decisions: action.decisions, 
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

    case 'CLEAR_ALL':
      localStorage.removeItem(STORAGE_KEY_PROPOSALS);
      localStorage.removeItem(STORAGE_KEY_DECISIONS);
      return { ...state, proposals: [], decisions: [] };
    
    default:
      return state;
  }
}

const StoreContext = createContext<{
  state: State;
  addProposal: (proposal: Proposal) => void;
  setDecision: (decision: Decision) => void;
  clearAll: () => void;
} | undefined>(undefined);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    const loadData = () => {
      // Handle legacy key migration or just start fresh with new keys
      const savedProposals = localStorage.getItem(STORAGE_KEY_PROPOSALS) || localStorage.getItem('diviora_proposals');
      const savedDecisions = localStorage.getItem(STORAGE_KEY_DECISIONS);
      
      let proposals: Proposal[] = [];
      let decisions: Decision[] = [];

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
        } catch (e) {
          console.error('Failed to parse proposals:', e);
        }
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
        } catch (e) {
          console.error('Failed to parse decisions:', e);
        }
      }

      dispatch({ type: 'HYDRATE', proposals, decisions });
    };

    loadData();
  }, []);

  const addProposal = (payload: Proposal) => dispatch({ type: 'ADD_PROPOSAL', payload });
  const setDecision = (payload: Decision) => dispatch({ type: 'SET_DECISION', payload });
  const clearAll = () => dispatch({ type: 'CLEAR_ALL' });

  return (
    <StoreContext.Provider value={{ state, addProposal, setDecision, clearAll }}>
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
