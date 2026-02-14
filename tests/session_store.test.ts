import { describe, it, expect, beforeEach } from 'vitest';
import { useSessionStore } from '../lib/session_store';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    clear: () => {
      store = {};
    },
    removeItem: (key: string) => {
      delete store[key];
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('useSessionStore', () => {
  beforeEach(() => {
    window.localStorage.clear();
    useSessionStore.setState({ sessions: [], currentSessionId: null });
  });

  it('creates a new session', () => {
    const { actions } = useSessionStore.getState();
    const id = actions.createSession('My Session');
    
    const state = useSessionStore.getState();
    expect(state.sessions).toHaveLength(1);
    expect(state.sessions[0].title).toBe('My Session');
    expect(state.sessions[0].session_id).toBe(id);
    expect(state.currentSessionId).toBe(id);
  });

  it('switches sessions', () => {
    const { actions } = useSessionStore.getState();
    const id1 = actions.createSession('Session 1');
    const id2 = actions.createSession('Session 2');

    expect(useSessionStore.getState().currentSessionId).toBe(id2); // Most recent is auto-selected

    actions.switchSession(id1);
    expect(useSessionStore.getState().currentSessionId).toBe(id1);
  });

  it('renames a session', () => {
    const { actions } = useSessionStore.getState();
    const id = actions.createSession('Old Name');
    
    actions.renameSession(id, 'New Name');
    
    const session = useSessionStore.getState().sessions.find(s => s.session_id === id);
    expect(session?.title).toBe('New Name');
  });

  it('pins context', () => {
    const { actions } = useSessionStore.getState();
    const id = actions.createSession('Session');
    
    actions.pinContext(id, { proposal_id: 'prop_123' });
    
    let session = useSessionStore.getState().sessions.find(s => s.session_id === id);
    expect(session?.pinned.proposal_id).toBe('prop_123');
    expect(session?.pinned.run_id).toBeUndefined();

    actions.pinContext(id, { proposal_id: 'prop_123', run_id: 'run_456' });
    session = useSessionStore.getState().sessions.find(s => s.session_id === id);
    expect(session?.pinned.run_id).toBe('run_456');
  });

  it('persists messages', () => {
    const { actions } = useSessionStore.getState();
    const id = actions.createSession('Session');
    
    const msg = { id: 'msg_1', role: 'user' as const, content: 'Hello', createdAt: new Date().toISOString() };
    actions.addMessage(id, msg);
    
    const session = useSessionStore.getState().sessions.find(s => s.session_id === id);
    expect(session?.messages).toHaveLength(1);
    expect(session?.messages[0].content).toBe('Hello');
  });

  it('deletes a session', () => {
    const { actions } = useSessionStore.getState();
    const id1 = actions.createSession('Session 1');
    const id2 = actions.createSession('Session 2');
    
    actions.deleteSession(id1);
    
    const state = useSessionStore.getState();
    expect(state.sessions).toHaveLength(1);
    expect(state.sessions[0].session_id).toBe(id2);
    expect(state.currentSessionId).toBe(id2); 
  });
});
