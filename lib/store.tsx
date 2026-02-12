'use client';

import React, { createContext, useContext, useEffect, useReducer, ReactNode } from 'react';
import { Proposal, ProposalSchema } from './types';

type State = {
  proposals: Proposal[];
  isLoaded: boolean;
};

type Action =
  | { type: 'SET_PROPOSALS'; payload: Proposal[] }
  | { type: 'ADD_PROPOSAL'; payload: Proposal }
  | { type: 'CLEAR_PROPOSALS' };

const STORAGE_KEY = 'diviora_proposals';

const initialState: State = {
  proposals: [],
  isLoaded: false,
};

function proposalReducer(state: State, action: Action): State {
  switch (action.type) {
    case 'SET_PROPOSALS':
      return { ...state, proposals: action.payload, isLoaded: true };
    case 'ADD_PROPOSAL': {
      const existingIndex = state.proposals.findIndex(p => p.proposal_id === action.payload.proposal_id);
      let newProposals;
      if (existingIndex > -1) {
        newProposals = [...state.proposals];
        newProposals[existingIndex] = action.payload;
      } else {
        newProposals = [action.payload, ...state.proposals];
      }
      // Keep sorted by newest first
      newProposals.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newProposals));
      return { ...state, proposals: newProposals };
    }
    case 'CLEAR_PROPOSALS':
      localStorage.removeItem(STORAGE_KEY);
      return { ...state, proposals: [] };
    default:
      return state;
  }
}

const StoreContext = createContext<{
  state: State;
  addProposal: (proposal: Proposal) => void;
  clearProposals: () => void;
} | undefined>(undefined);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(proposalReducer, initialState);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          // Validate each proposal, filter out invalid ones
          const validProposals = parsed
            .map(p => {
              const result = ProposalSchema.safeParse(p);
              return result.success ? result.data : null;
            })
            .filter((p): p is Proposal => p !== null);
          
          dispatch({ type: 'SET_PROPOSALS', payload: validProposals });
        } else {
          dispatch({ type: 'SET_PROPOSALS', payload: [] });
        }
      } catch (e) {
        console.error('Failed to load proposals from localStorage:', e);
        dispatch({ type: 'SET_PROPOSALS', payload: [] });
      }
    } else {
      dispatch({ type: 'SET_PROPOSALS', payload: [] });
    }
  }, []);

  const addProposal = (proposal: Proposal) => {
    dispatch({ type: 'ADD_PROPOSAL', payload: proposal });
  };

  const clearProposals = () => {
    dispatch({ type: 'CLEAR_PROPOSALS' });
  };

  return (
    <StoreContext.Provider value={{ state, addProposal, clearProposals }}>
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
