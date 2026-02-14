import { useState, useEffect } from 'react';
import { useStore } from '../../../lib/store';
import { StreamingText } from '../StreamingText';
import { DiffView } from '../DiffView';
import { SectionComposer } from '../SectionComposer';

export function DraftCard() {
  const [draft, setDraft] = useState<string | null>(null);
  const [showDiff, setShowDiff] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const { state } = useStore();
  const latestProposal = state.proposals[0] || null;

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
    if (draft) {
      window.dispatchEvent(new CustomEvent('diviora:insert-input', { detail: { message: draft } }));
      setShowToast(true);
      setTimeout(() => setShowToast(false), 2000);
      setDraft(null); // Clear draft after insertion
    }
  };

  if (!draft) return null;

  return (
    <div className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden mb-4 animate-in slide-in-from-bottom-4 duration-300">
      {showToast && (
        <div 
          data-testid="copilot-insert-toast"
          className="bg-green-600 text-white text-[10px] font-bold py-2 px-4 text-center animate-in fade-in duration-300"
        >
          Inserted into compose box
        </div>
      )}
      
      <div className="p-4 bg-blue-50 border-b border-blue-100 flex justify-between items-center">
        <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">Suggested Draft</span>
        <div className="flex items-center gap-2">
           <button
              onClick={() => setShowDiff(!showDiff)}
              data-testid="copilot-diff-toggle"
              className="text-[10px] text-blue-600 underline hover:text-blue-800 mr-2"
           >
              {showDiff ? 'Show Preview' : 'Show Diff'}
           </button>
          <button 
            onClick={() => setDraft(null)}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
      
      <div className="p-4">
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
