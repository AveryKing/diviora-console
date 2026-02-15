import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';

export interface CopilotMessage {
  id: string; // CopilotKit uses IDs
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt: string;
}

export interface PinnedContext {
  proposal_id?: string;
  run_id?: string;
}

export interface CopilotSession {
  session_id: string;
  title: string;
  created_at: string;
  updated_at: string;
  pinned: PinnedContext;
  messages: CopilotMessage[];
}

interface SessionState {
  sessions: CopilotSession[];
  currentSessionId: string | null;
  hydrated: boolean;
  actions: {
    createSession: (title?: string) => string;
    switchSession: (sessionId: string) => void;
    renameSession: (sessionId: string, newTitle: string) => void;
    deleteSession: (sessionId: string) => void;
    pinContext: (sessionId: string, context: PinnedContext) => void;
    addMessage: (sessionId: string, message: CopilotMessage) => void;
    setMessages: (sessionId: string, messages: CopilotMessage[]) => void;
  };
}

let setHydratedState: ((hydrated: boolean) => void) | null = null;

export const useSessionStore = create<SessionState>()(
  persist(
    (set, get) => {
      setHydratedState = (hydrated: boolean) => set({ hydrated });
      return {
        sessions: [],
        currentSessionId: null,
        hydrated: false,
        actions: {
        createSession: (title = 'New Session') => {
          const id = `sess_${uuidv4()}`;
          const newSession: CopilotSession = {
            session_id: id,
            title,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            pinned: {},
            messages: [],
          };
          set((state) => ({
            sessions: [newSession, ...state.sessions],
            currentSessionId: id,
          }));
          return id;
        },
        switchSession: (sessionId) => {
          const session = get().sessions.find((s) => s.session_id === sessionId);
          if (session) {
            set({ currentSessionId: sessionId });
          }
        },
        renameSession: (sessionId, newTitle) => {
          set((state) => ({
            sessions: state.sessions.map((s) =>
              s.session_id === sessionId
                ? { ...s, title: newTitle, updated_at: new Date().toISOString() }
                : s
            ),
          }));
        },
        deleteSession: (sessionId) => {
          set((state) => {
            const newSessions = state.sessions.filter((s) => s.session_id !== sessionId);
            let nextId = state.currentSessionId;
            if (state.currentSessionId === sessionId) {
              nextId = newSessions.length > 0 ? newSessions[0].session_id : null;
            }
            return {
              sessions: newSessions,
              currentSessionId: nextId,
            };
          });
        },
        pinContext: (sessionId, context) => {
          set((state) => ({
            sessions: state.sessions.map((s) =>
              s.session_id === sessionId
                ? { ...s, pinned: context, updated_at: new Date().toISOString() }
                : s
            ),
          }));
        },
        addMessage: (sessionId, message) => {
          set((state) => ({
            sessions: state.sessions.map((s) =>
              s.session_id === sessionId
                ? { ...s, messages: [...s.messages, message], updated_at: new Date().toISOString() }
                : s
            ),
          }));
        },
        setMessages: (sessionId, messages) => {
            set((state) => ({
              sessions: state.sessions.map((s) =>
                s.session_id === sessionId
                  ? { ...s, messages: messages, updated_at: new Date().toISOString() }
                  : s
              ),
            }));
          },
        },
      };
    },
    {
      name: 'diviora.copilot_sessions.v1',
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => {
        return () => {
          setHydratedState?.(true);
        };
      },
      partialize: (state) => ({ 
          sessions: state.sessions, 
          currentSessionId: state.currentSessionId 
      }), // Don't persist actions
    }
  )
);
