'use client';

import { useState, useEffect } from 'react';
import { useCopilotChat } from "@copilotkit/react-core";
import { CopilotChat } from "@copilotkit/react-ui";
import { CopilotSidebarPanel } from "./CopilotSidebarPanel";
import { CopilotActivityTicker } from "./CopilotActivityTicker";
import { TextMessage, Role } from "@copilotkit/runtime-client-gql";

export function DivioraCopilotSidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isDrafting, setIsDrafting] = useState(false);
  const [draftCount, setDraftCount] = useState(0);
  const { appendMessage } = useCopilotChat();

  useEffect(() => {
    const handleToggle = () => setIsOpen(prev => !prev);
    window.addEventListener('diviora:toggle-copilot', handleToggle);
    return () => window.removeEventListener('diviora:toggle-copilot', handleToggle);
  }, []);

  const handleDraftRequest = () => {
    setIsDrafting(true);
    setDraftCount(prev => prev + 1);
    appendMessage(new TextMessage({
      role: Role.User,
      content: 'Draft a suggested next message for me based on the current context. Use the draftNextMessage action to provide it.',
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 w-80 bg-white shadow-2xl border-l border-gray-200 z-50 flex flex-col animate-in slide-in-from-right duration-300">
      <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
        <h2 className="text-sm font-bold text-gray-900 uppercase tracking-widest flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
          Diviora Copilot
        </h2>
        <button 
          onClick={() => setIsOpen(false)}
          className="text-gray-400 hover:text-gray-600 p-1"
          aria-label="Close Copilot"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="p-2 border-b border-gray-100 bg-white">
        <button
          onClick={handleDraftRequest}
          className="w-full py-2 px-4 bg-gray-900 text-white text-[10px] font-bold rounded hover:bg-gray-800 transition-colors uppercase tracking-widest flex items-center justify-center gap-2"
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          Draft Next Message
        </button>
      </div>

      <CopilotActivityTicker 
        key={draftCount}
        isActive={isDrafting} 
        onComplete={() => setIsDrafting(false)} 
      />

      <CopilotSidebarPanel />


      <div className="flex-1 min-h-0 overflow-hidden">
        <CopilotChat
          className="h-full"
          instructions="You are a helpful assistant for the Diviora Console. You help users refine their proposals and clarify their needs. You can see the current artifact context and settings."
          labels={{
            title: "Copilot Chat",
            initial: "Hi! I'm your AI assistant. I can help you draft better messages based on your current settings and proposals. Try clicking 'Draft next message' if I suggest one!",
            placeholder: "Type a message...",
          }}
        />
      </div>
    </div>
  );
}
