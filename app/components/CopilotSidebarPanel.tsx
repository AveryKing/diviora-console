'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useStore } from '../../lib/store';
import { TemplateChecklist } from './TemplateChecklist';
import { StreamingText } from './StreamingText';
import { DiffView } from './DiffView';
import { SectionComposer } from './SectionComposer';

export function CopilotSidebarPanel() {
  const [draft, setDraft] = useState<string | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [showDiff, setShowDiff] = useState(false);
  const { state } = useStore();
  const latestProposal = state.proposals[0] || null;
  const pathname = usePathname();
  const isHome = pathname === '/';

  useEffect(() => {
    const handleDraft = (e: Event) => {
      const customEvent = e as CustomEvent<{ draft: string }>;
      setDraft(customEvent.detail.draft);
    };
    window.addEventListener('diviora:copilot-draft', handleDraft as EventListener);
    return () => window.removeEventListener('diviora:copilot-draft', handleDraft as EventListener);
  }, []);

  const handleCopy = () => {
    if (draft) {
      navigator.clipboard.writeText(draft);
      alert('Copied to clipboard!');
    }
  };

  const handleInsert = () => {
    if (draft && isHome) {
      window.dispatchEvent(new CustomEvent('diviora:insert-input', { detail: { message: draft } }));
      setShowToast(true);
      setTimeout(() => setShowToast(false), 2000);
      setDraft(null); // Clear draft after insertion
    }
  };

  return (
    <div className="flex flex-col flex-1 animate-in slide-in-from-top duration-300">
      {showToast && (
        <div 
          data-testid="copilot-insert-toast"
          className="bg-green-600 text-white text-[10px] font-bold py-2 px-4 text-center animate-in fade-in duration-300"
        >
          Inserted draft into chat input
        </div>
      )}
      {draft && (
        <div className="p-4 bg-blue-50 border-b border-blue-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">Suggested Draft</span>
            <button 
              onClick={() => setDraft(null)}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="flex justify-end mb-2">
             <button
                onClick={() => setShowDiff(!showDiff)}
                data-testid="copilot-diff-toggle"
                className="text-[10px] text-blue-600 underline hover:text-blue-800"
             >
                {showDiff ? 'Show Preview' : 'Show Diff'}
             </button>
          </div>
          
          {showDiff ? (
            <DiffView 
              original={latestProposal?.input?.message || ''} 
              modified={draft} 
            />
          ) : (
            <StreamingText key={draft} text={draft} />
          )}

          {state.settings.template_id === 'bug_triage' && (
            <SectionComposer 
              draft={draft} 
              onAssemble={setDraft} 
              className="mt-4"
            />
          )}

          <div className="flex gap-2 mt-4">
            {isHome ? (
              <button
                onClick={handleInsert}
                data-testid="copilot-insert-btn"
                className="flex-1 py-3 px-4 bg-blue-600 text-white text-xs font-bold rounded-lg hover:bg-blue-700 active:transform active:scale-95 transition-all uppercase tracking-wider shadow-md"
              >
                Insert into Home
              </button>
            ) : (
              <button
                onClick={handleCopy}
                data-testid="copilot-copy-btn"
                className="flex-1 py-3 px-4 bg-gray-900 text-white text-xs font-bold rounded-lg hover:bg-gray-800 active:transform active:scale-95 transition-all uppercase tracking-wider shadow-md"
              >
                Copy Suggestions
              </button>
            )}
            {isHome && (
              <button
                onClick={handleCopy}
                data-testid="copilot-copy-btn"
                className="py-3 px-6 bg-white border border-blue-200 text-blue-600 text-xs font-bold rounded-lg hover:bg-blue-50 transition-all shadow-sm"
                title="Copy to clipboard"
              >
                Copy
              </button>
            )}
          </div>
        </div>
      )}
      
      <div className="flex-1 overflow-y-auto">
        <TemplateChecklist 
            templateId={state.settings.template_id} 
            proposal={latestProposal} 
        />
      </div>
    </div>
  );
}
