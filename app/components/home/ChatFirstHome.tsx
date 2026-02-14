'use client';

import { useState, useEffect } from 'react';
import { useCopilotChat, CopilotKit } from "@copilotkit/react-core";
import { CopilotChat } from "@copilotkit/react-ui";
import { TextMessage, Role, TextMessage as TextMessageType } from "@copilotkit/runtime-client-gql";
import "@copilotkit/react-ui/styles.css";
import { ContextPanel } from './ContextPanel';
import { ComposeBar } from './ComposeBar';
import { DraftCard } from './DraftCard';
import { CopilotActivityTicker } from '../CopilotActivityTicker';
import { useSessionStore, CopilotMessage } from '@/lib/session_store';
import { SessionList } from '../sessions/SessionList';
import { CopilotContextHandler } from '../CopilotContextHandler';

export function ChatFirstHome() {
  const { currentSessionId, actions, sessions } = useSessionStore();

  useEffect(() => {
    // Ensure a session exists if none is active
    if (!currentSessionId && sessions.length === 0) {
        actions.createSession('New Session');
    } else if (!currentSessionId && sessions.length > 0) {
        actions.switchSession(sessions[0].session_id);
    }
  }, [currentSessionId, sessions, actions]);

  if (!currentSessionId) {
      return (
          <div className="h-[calc(100vh-64px)] flex items-center justify-center bg-gray-50 text-gray-400 text-sm">
              Initializing Session...
          </div>
      );
  }

  return (
    <div className="flex h-[calc(100vh-64px)] overflow-hidden">
        <SessionList 
            className="border-r border-gray-200" 
            onSelectSession={id => actions.switchSession(id)}
        />
        
        <div className="flex-1 flex flex-col min-w-0">
            {/* 
                Keying the Provider by session ID forces a remount when switching sessions,
                ensuring a clean Copilot context (empty history) that we can hydrate.
            */}
            <CopilotKit key={currentSessionId} runtimeUrl="/api/copilot">
                <CopilotContextHandler />
                <ChatFirstHomeContent sessionId={currentSessionId} />
            </CopilotKit>
        </div>
    </div>
  );
}

function ChatFirstHomeContent({ sessionId }: { sessionId: string }) {
  const [isDrafting, setIsDrafting] = useState(false);
  const [draftCount, setDraftCount] = useState(0);
  
  const { actions, sessions } = useSessionStore();
  const session = sessions.find(s => s.session_id === sessionId);

  // Initialize chat with session history
  const { appendMessage, visibleMessages } = useCopilotChat({
      initialMessages: session?.messages || []
  });
  
  const [showContext, setShowContext] = useState(true);

  // Persist messages on change
  useEffect(() => {
      if (visibleMessages) {
          const cleanMessages: CopilotMessage[] = visibleMessages.map(m => {
              if (m instanceof TextMessageType) {
                  return {
                      id: m.id,
                      role: m.role as 'user' | 'assistant' | 'system',
                      content: m.content,
                      createdAt: m.createdAt?.toISOString() || new Date().toISOString()
                  };
              }
              
              // Fallback for other message types
              const msg = m as unknown as { id: string, role: string, content?: string, createdAt?: { toISOString: () => string } };
              return {
                id: msg.id,
                role: (msg.role || 'system') as 'user' | 'assistant' | 'system',
                content: msg.content || '',
                createdAt: msg.createdAt?.toISOString() || new Date().toISOString()
              };
          });
          actions.setMessages(sessionId, cleanMessages);
      }
  }, [visibleMessages, sessionId, actions]);

  const handleDraftRequest = () => {
    setIsDrafting(true);
    setDraftCount(prev => prev + 1);
    appendMessage(new TextMessage({
      role: Role.User,
      content: 'Draft a suggested next message for me based on the current context. Use the draftNextMessage action to provide it.',
    }));
  };

  return (
    <div className="flex flex-1 h-full overflow-hidden">
       {/* Main Chat Area */}
       <div data-testid="home-chat-main" className="flex-1 flex flex-col min-w-0 bg-gray-50/50">
          <div className="flex-1 overflow-hidden relative flex flex-col">
             {/* Chat Interface */}
             <div className="flex-1 overflow-y-auto">
                <CopilotChat
                   className="h-full border-none shadow-none bg-transparent"
                   instructions="You are a helpful assistant for the Diviora Console. You help users refine their proposals and clarify their needs. You can see the current artifact context and settings."
                   labels={{
                      title: session?.title || "Copilot Chat",
                      initial: "Hi! I'm your AI assistant. I'm here to help you draft proposals. Ask me anything or click 'Draft Suggestion' to get started based on your context.",
                      placeholder: "Ask Copilot for help...",
                   }}
                />
             </div>
             
             {/* Overlay for Ticker */}
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

          {/* Draft & Compose Area */}
          <div className="border-t border-gray-200 bg-white shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-20">
             {/* Action Bar */}
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

       {/* Context Panel (Right Rail) */}
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
