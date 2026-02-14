'use client';

import { useState, useEffect } from 'react';
import { useStore } from '../../../lib/store';
import { StreamingText } from '../StreamingText';
import { DiffView } from '../DiffView';
import { SectionComposer } from '../SectionComposer';
import { BugTriageFieldsOutput } from '@/lib/copilot_actions_schema';

export function DraftCard() {
  const [draft, setDraft] = useState<string | null>(null);
  const [extraction, setExtraction] = useState<BugTriageFieldsOutput | null>(null);
  const [showDiff, setShowDiff] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const { state } = useStore();
  const latestProposal = state.proposals[0] || null;

  useEffect(() => {
    const handleDraft = (e: Event) => {
      const customEvent = e as CustomEvent<{ draft: string }>;
      setDraft(customEvent.detail.draft);
      setExtraction(null); // Clear extraction if we get a raw draft
    };
    const handleExtraction = (e: Event) => {
      const customEvent = e as CustomEvent<{ fields: BugTriageFieldsOutput, template: string }>;
      setExtraction(customEvent.detail.fields);
      setDraft(null); // Clear raw draft if we get an extraction
    };

    window.addEventListener('diviora:copilot-draft', handleDraft as EventListener);
    window.addEventListener('diviora:copilot-extraction', handleExtraction as EventListener);

    return () => {
      window.removeEventListener('diviora:copilot-draft', handleDraft as EventListener);
      window.removeEventListener('diviora:copilot-extraction', handleExtraction as EventListener);
    };
  }, []);

  const handleCopy = () => {
    const content = draft || JSON.stringify(extraction, null, 2);
    if (content) {
      navigator.clipboard.writeText(content);
      alert('Copied to clipboard!');
    }
  };

  const handleInsert = () => {
    let content = draft;
    if (extraction) {
      // Format bug triage fields into a structured prompt
      content = `BUG REPORT\n\nTitle: ${extraction.title}\nSeverity: ${extraction.severity.toUpperCase()}\nComponent: ${extraction.component}\n\nDescription: ${extraction.description}`;
      if (extraction.repro_steps) content += `\n\nReproduction Steps:\n${extraction.repro_steps}`;
      if (extraction.expected_behavior) content += `\n\nExpected Behavior:\n${extraction.expected_behavior}`;
      if (extraction.actual_result) content += `\n\nActual Result:\n${extraction.actual_result}`;
    }

    if (content) {
      window.dispatchEvent(new CustomEvent('diviora:insert-input', { detail: { message: content } }));
      setShowToast(true);
      setTimeout(() => setShowToast(false), 2000);
      setDraft(null);
      setExtraction(null);
    }
  };

  if (!draft && !extraction) return null;

  return (
    <div data-testid="copilot-draft-card" className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden mb-4 animate-in slide-in-from-bottom-4 duration-300">
      {showToast && (
        <div 
          data-testid="copilot-insert-toast"
          className="bg-green-600 text-white text-[10px] font-bold py-2 px-4 text-center animate-in fade-in duration-300"
        >
          Inserted into compose box
        </div>
      )}
      
      <div className="p-4 bg-blue-50 border-b border-blue-100 flex justify-between items-center">
        <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">
          {extraction ? 'Extracted Bug Fields' : 'Suggested Draft'}
        </span>
        <div className="flex items-center gap-2">
           {!extraction && (
             <button
                onClick={() => setShowDiff(!showDiff)}
                data-testid="copilot-diff-toggle"
                className="text-[10px] text-blue-600 underline hover:text-blue-800 mr-2"
             >
                {showDiff ? 'Show Preview' : 'Show Diff'}
             </button>
           )}
          <button 
            onClick={() => { setDraft(null); setExtraction(null); }}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
      
      <div className="p-4">
        {extraction ? (
           <div className="space-y-3 text-xs">
              <div className="grid grid-cols-3 gap-2 border-b border-gray-50 pb-2">
                 <span className="text-gray-400 font-bold uppercase">Severity</span>
                 <span className="col-span-2 capitalize font-medium text-red-600">{extraction.severity}</span>
              </div>
              <div className="grid grid-cols-3 gap-2 border-b border-gray-50 pb-2">
                 <span className="text-gray-400 font-bold uppercase">Component</span>
                 <span className="col-span-2 font-medium">{extraction.component}</span>
              </div>
              <div className="space-y-1">
                 <span className="text-gray-400 font-bold uppercase block">Title</span>
                 <p className="font-medium bg-gray-50 p-2 rounded">{extraction.title}</p>
              </div>
              <div className="space-y-1">
                 <span className="text-gray-400 font-bold uppercase block">Description</span>
                 <p className="text-gray-600 whitespace-pre-wrap">{extraction.description}</p>
              </div>
           </div>
        ) : showDiff ? (
          <DiffView 
            original={latestProposal?.input?.message || ''} 
            modified={draft || ''} 
          />
        ) : (
          <StreamingText key={draft} text={draft || ''} />
        )}

        {state.settings.template_id === 'bug_triage' && draft && (
          <SectionComposer 
            draft={draft} 
            onAssemble={setDraft} 
            className="mt-4"
          />
        )}

        <div className="flex gap-2 mt-4">
          <button
            onClick={handleInsert}
            data-testid="home-insert-draft-btn"
            className="flex-1 py-2 px-4 bg-blue-600 text-white text-xs font-bold rounded hover:bg-blue-700 transition uppercase tracking-wider shadow-sm"
          >
            Insert into Compose
          </button>
          <button
            onClick={handleCopy}
            className="px-4 py-2 bg-white border border-gray-300 text-gray-700 text-xs font-bold rounded hover:bg-gray-50 transition uppercase tracking-wider shadow-sm"
          >
            Copy
          </button>
        </div>
      </div>
    </div>
  );
}
