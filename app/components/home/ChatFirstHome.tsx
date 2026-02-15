'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useCopilotChatInternal, CopilotKit } from "@copilotkit/react-core";
import { TextMessage, Role } from "@copilotkit/runtime-client-gql";
import { CopilotChat } from "@copilotkit/react-ui";
import "@copilotkit/react-ui/styles.css";
import { Sparkles } from 'lucide-react';
import { ContextPanel } from './ContextPanel';
import { ComposeBar } from './ComposeBar';
import { DraftCard } from './DraftCard';
import { CopilotActivityTicker } from '../CopilotActivityTicker';
import { CopilotMessage, useSessionStore } from '@/lib/session_store';
import { SessionList } from '../sessions/SessionList';
import { CopilotContextHandler } from '../CopilotContextHandler';

export function ChatFirstHome() {
  const currentSessionId = useSessionStore(state => state.currentSessionId);
  const hasSessions = useSessionStore(state => state.sessions.length > 0);
  const actions = useSessionStore(state => state.actions);

  const [isHydrated, setIsHydrated] = useState(() => {
    const persistApi = (useSessionStore as unknown as {
      persist?: {
        hasHydrated: () => boolean;
      };
    }).persist;
    return persistApi ? persistApi.hasHydrated() : true;
  });
  const isBootstrappingSessionRef = useRef(false);

  // Sync hydration state from Zustand persist
  useEffect(() => {
    const persistApi = (useSessionStore as unknown as {
      persist?: {
        hasHydrated: () => boolean;
        onFinishHydration: (cb: () => void) => () => void;
      };
    }).persist;
    if (!persistApi) return;

    // Check initial state
    if (persistApi.hasHydrated()) return;

    // Wait for hydration callback
    return persistApi.onFinishHydration(() => {
      setIsHydrated(true);
    });
  }, []);

  // Ensure an active session exists
  useEffect(() => {
    if (!isHydrated) return;
    if (currentSessionId) {
      // Reset guard once we have a stable active session.
      isBootstrappingSessionRef.current = false;
      return;
    }
    if (isBootstrappingSessionRef.current) return;
    isBootstrappingSessionRef.current = true;

    if (hasSessions) {
      // Need to find first session ID but don't want to depend on 'sessions' array
      const firstSession = useSessionStore.getState().sessions[0];
      if (firstSession) actions.switchSession(firstSession.session_id);
    } else {
      actions.createSession('New Session');
    }
  }, [currentSessionId, hasSessions, actions, isHydrated]);

  return (
    <div className="flex h-[calc(100vh-64px)] overflow-hidden">
        <SessionList className="border-r border-gray-200" />
        
        <div className="flex-1 flex flex-col min-w-0">
            {!isHydrated ? (
                <div className="h-full flex items-center justify-center bg-gray-50 text-gray-400 text-sm">
                    Initializing Application...
                </div>
            ) : (
                <CopilotKit
                  key={currentSessionId}
                  runtimeUrl="/api/copilot"
                  threadId={currentSessionId || undefined}
                >
                    <CopilotContextHandler />
                    {currentSessionId ? (
                        <ChatFirstHomeContent sessionId={currentSessionId} />
                    ) : (
                        <div className="h-full flex items-center justify-center bg-gray-50 text-gray-400 text-sm">
                            Loading Session...
                        </div>
                    )}
                </CopilotKit>
            )}
        </div>
    </div>
  );
}

function ChatFirstHomeContent({ sessionId }: { sessionId: string }) {
  const [isDrafting, setIsDrafting] = useState(false);
  const [draftCount, setDraftCount] = useState(0);
  const [chatError, setChatError] = useState<string | null>(null);
  
  const session = useSessionStore(state => state.sessions.find(s => s.session_id === sessionId));
  const sessionActions = useSessionStore(state => state.actions);

  // Determine initial messages once per mount/sessionId
  const initialMessages = useMemo(() => {
    const rawMessages = session?.messages || [];
    return rawMessages.map(m => {
      return {
        id: m.id,
        role: m.role,
        content: m.content,
      };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  const copilotChat = useCopilotChatInternal({
    initialMessages,
  });

  const appendMessage = copilotChat.appendMessage;
  const copilotMessages = useMemo(() => {
    const messages = Array.isArray(copilotChat.messages) ? copilotChat.messages : [];
    const visibleMessages = Array.isArray(copilotChat.visibleMessages) ? copilotChat.visibleMessages : [];
    return messages.length > 0 ? messages : visibleMessages;
  }, [copilotChat.messages, copilotChat.visibleMessages]);
  
  const [showContext, setShowContext] = useState(true);

  const getNormalizedRole = (value: unknown): CopilotMessage['role'] => {
    const rawRole = typeof value === 'string' ? value.toLowerCase() : '';
    if (rawRole === 'user' || rawRole === 'assistant' || rawRole === 'system') {
      return rawRole;
    }
    return 'system';
  };

  const getNormalizedContent = (value: unknown): string => {
    if (typeof value === 'string') return value;
    if (Array.isArray(value)) {
      return value
        .map((chunk) => {
          if (typeof chunk === 'string') return chunk;
          if (typeof chunk !== 'object' || chunk === null) return '';
          const typedChunk = chunk as { text?: unknown; value?: unknown };
          if (typeof typedChunk.text === 'string') return typedChunk.text;
          if (typeof typedChunk.value === 'string') return typedChunk.value;
          return '';
        })
        .join('');
    }
    if (typeof value === 'object' && value !== null) {
      const typedValue = value as { text?: unknown };
      if (typeof typedValue.text === 'string') return typedValue.text;
    }
    return '';
  };

  const getCreatedAtIso = (value: unknown): string => {
    if (value instanceof Date) return value.toISOString();
    if (typeof value === 'string') return value;
    return new Date().toISOString();
  };

  // Persist Copilot messages into the current session so history survives session switches/reloads.
  useEffect(() => {
    const normalized = copilotMessages
      .map((message, index): CopilotMessage | null => {
        const messageObj = message as Record<string, unknown>;
        const role = getNormalizedRole(messageObj.role);
        const content = getNormalizedContent(messageObj.content) || getNormalizedContent(messageObj.text);

        if (!content) return null;

        return {
          id: typeof messageObj.id === 'string' ? messageObj.id : `${sessionId}-${role}-${index}`,
          role,
          content,
          createdAt: getCreatedAtIso(messageObj.createdAt),
        };
      })
      .filter((message): message is CopilotMessage => message !== null);

    const existing = session?.messages || [];

    // Avoid wiping persisted history when a session remounts and Copilot state
    // is temporarily empty before messages rehydrate.
    if (normalized.length === 0 && existing.length > 0) {
      return;
    }

    const isSameLength = existing.length === normalized.length;
    const isSameContent = isSameLength && existing.every((msg, idx) => {
      const next = normalized[idx];
      return (
        msg.id === next.id &&
        msg.role === next.role &&
        msg.content === next.content
      );
    });

    if (!isSameContent) {
      sessionActions.setMessages(sessionId, normalized);
    }
  }, [copilotMessages, sessionActions, sessionId, session?.messages]);

  const handleDraftRequest = useCallback(async () => {
    setChatError(null);
    setIsDrafting(true);
    setDraftCount(prev => prev + 1);
    try {
      await appendMessage(new TextMessage({
          role: Role.User,
          content: 'Draft a suggested next message for me based on the current context. Use the draftNextMessage action to provide it.',
      }));
    } catch (err) {
      setChatError(err instanceof Error ? err.message : 'Failed to send draft request.');
    }
  }, [appendMessage]);

  return (
    <div className="flex-1 flex overflow-hidden">
       {/* Main Chat Area */}
       <div data-testid="home-chat-main" className="flex-1 flex flex-col min-w-0 bg-gray-50/50">
          <div className="flex-1 overflow-hidden relative flex flex-col glass-panel m-4 rounded-3xl">
             {/* Header */}
             <div className="px-6 py-4 border-b border-gray-200/50 flex items-center gap-3 bg-white/40">
                <div className="p-2 bg-gray-900 rounded-xl">
                   <Sparkles className="h-4 w-4 text-emerald-400" />
                </div>
                <div>
                   <h2 className="text-sm font-bold text-gray-900">{session?.title || "Copilot Chat"}</h2>
                   <p className="text-[10px] text-gray-500 uppercase tracking-wider font-medium">Diviora Intelligent Assistant</p>
                </div>
             </div>

             <div className="flex-1 overflow-y-auto">
                <CopilotChat
                   className="h-full border-none shadow-none bg-transparent"
                   instructions="You are a helpful assistant for the Diviora Console. You help users refine proposals and clarify needs using available context."
                   labels={{
                      title: session?.title || "Copilot Chat",
                      initial: "Hi. I can help you draft proposals, troubleshoot, and prepare next actions from your current context.",
                      placeholder: "Ask Copilot...",
                   }}
                />
             </div>

             {chatError && (
                <div className="mx-6 mb-2 text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                  {chatError}
                </div>
             )}
             
             <div className="absolute top-4 right-4 z-10 pointer-events-none">
                <div className="pointer-events-auto">
                   <CopilotActivityTicker 
                      key={draftCount}
                      isActive={isDrafting} 
                      onComplete={() => setIsDrafting(false)} 
                   />
                </div>
             </div>
          </div>

          <div className="border-t border-gray-200 bg-white shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-20">
             <div className="px-4 py-2 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
                <div className="flex gap-2">
                   <button
                      onClick={handleDraftRequest}
                      className="px-3 py-1.5 bg-gray-900 text-white text-[10px] font-bold rounded hover:bg-gray-800 transition uppercase tracking-wider flex items-center gap-2 shadow-sm"
                   >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      Draft Suggestion
                   </button>
                </div>
                <div className="md:hidden">
                   <button 
                      onClick={() => setShowContext(!showContext)}
                      className="text-gray-500 hover:text-gray-700 p-1"
                   >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                   </button>
                </div>
             </div>

             <div className="bg-gray-50 p-4 pb-0">
                <DraftCard />
             </div>
             
             <ComposeBar /> 
          </div>
       </div>

       <div className={`w-80 border-l border-gray-200 bg-white flex flex-col transition-all duration-300 ${showContext ? 'translate-x-0' : 'translate-x-full absolute right-0 h-full shadow-xl md:relative md:translate-x-0 md:shadow-none'}`}>
          <div className="p-4 border-b border-gray-100 flex justify-between items-center md:hidden">
             <h3 className="text-xs font-bold uppercase text-gray-400">Context</h3>
             <button onClick={() => setShowContext(false)}>
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
             </button>
          </div>
          <ContextPanel />
       </div>
    </div>
  );
}
