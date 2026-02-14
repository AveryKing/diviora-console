'use client';

import { useState } from 'react';
import { useCopilotChat } from "@copilotkit/react-core";
import { CopilotChat } from "@copilotkit/react-ui";
import { TextMessage, Role } from "@copilotkit/runtime-client-gql";
import { ContextPanel } from './ContextPanel';
import { ComposeBar } from './ComposeBar';
import { DraftCard } from './DraftCard';
import { CopilotActivityTicker } from '../CopilotActivityTicker';

export function ChatFirstHome() {
  const [isDrafting, setIsDrafting] = useState(false);
  const [draftCount, setDraftCount] = useState(0);
  const { appendMessage } = useCopilotChat();
  const [showContext, setShowContext] = useState(true);

  const handleDraftRequest = () => {
    setIsDrafting(true);
    setDraftCount(prev => prev + 1);
    appendMessage(new TextMessage({
      role: Role.User,
      content: 'Draft a suggested next message for me based on the current context. Use the draftNextMessage action to provide it.',
    }));
  };

  return (
    <div className="flex h-[calc(100vh-64px)] overflow-hidden">
       {/* Main Chat Area */}
       <div data-testid="home-chat-main" className="flex-1 flex flex-col min-w-0 bg-gray-50/50">
          <div className="flex-1 overflow-hidden relative flex flex-col">
             {/* Chat Interface */}
             <div className="flex-1 overflow-y-auto">
                <CopilotChat
                   className="h-full border-none shadow-none bg-transparent"
                   instructions="You are a helpful assistant for the Diviora Console. You help users refine their proposals and clarify their needs. You can see the current artifact context and settings."
                   labels={{
                      title: "Copilot Chat",
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
