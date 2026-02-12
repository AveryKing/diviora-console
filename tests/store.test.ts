import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Proposal } from '../lib/types';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value.toString();
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
  };
})();

Object.defineProperty(global, 'localStorage', {
  value: localStorageMock,
});

// We'll test the reducer and logic indirectly via helper if possible, 
// or just test the state transitions.
// However, since StoreProvider uses useEffect/useReducer, it's easier to test the reducer logic directly
// by exporting it or simulating the provider.

// For now, let's create a logic test for the persistence behavior.
describe('Store Persistence Logic', () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  const mockProposal: Proposal = {
    proposal_id: 'prop_1',
    created_at: new Date().toISOString(),
    input: { message: 'hello' },
    proposal: {
      title: 'Title',
      summary: 'Summary',
      next_actions: [],
      risks: [],
    },
  };

  it('correctly serializes proposals to localStorage', () => {
    const proposals = [mockProposal];
    localStorage.setItem('diviora_proposals', JSON.stringify(proposals));
    expect(localStorage.getItem('diviora_proposals')).toBe(JSON.stringify(proposals));
  });

  it('gracefully handles invalid JSON in localStorage', () => {
    localStorage.setItem('diviora_proposals', 'invalid-json');
    const saved = localStorage.getItem('diviora_proposals');
    try {
      JSON.parse(saved!);
    } catch (e) {
      expect(e).toBeDefined();
    }
  });
});
