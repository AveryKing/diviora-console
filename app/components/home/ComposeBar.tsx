import { useState, useEffect } from 'react';
import { useStore } from '../../../lib/store';
import { Proposal } from '../../../lib/types';
import { useCopilotChat } from "@copilotkit/react-core";
import { TextMessage, Role } from "@copilotkit/runtime-client-gql";
import { emitCopilotHttpError } from '@/lib/copilot_error_bus';
import { parseCopilotHttpErrorSync } from '@/lib/copilot_http_error';

type CompileSubmitEventDetail = {
  message: string;
};

type ProposalCreatedEventDetail = {
  proposal_id: string;
};

function emitHomeEvent<T>(name: string, detail: T) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent<T>(name, { detail }));
}

export function ComposeBar() {
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { state, addProposal } = useStore();
  const { appendMessage } = useCopilotChat();

  useEffect(() => {
    const handleInsert = (e: Event) => {
      const customEvent = e as CustomEvent<{ message: string }>;
      setMessage(customEvent.detail.message);
    };
    window.addEventListener('diviora:insert-input', handleInsert as EventListener);
    return () => window.removeEventListener('diviora:insert-input', handleInsert as EventListener);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) {
      setError('Message cannot be empty');
      return;
    }

    setError(null);
    if (!state.settings.template_id) {
      setError('Invalid settings: missing template_id');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    emitHomeEvent<CompileSubmitEventDetail>("diviora:compile-submitted", { message });

    try {
      const response = await fetch('/api/compile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          message,
          settings: state.settings,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to submit message');
      }

      const data: Proposal = await response.json();
      addProposal(data);
      emitHomeEvent<ProposalCreatedEventDetail>("diviora:proposal-created", { proposal_id: data.proposal_id });
      setMessage('');
      
      // Let Copilot know
      void appendMessage(new TextMessage({
        role: Role.System,
        content: `User submitted a proposal request: "${message}". New proposal created with ID: ${data.proposal_id}.`,
      })).catch((err) => {
        const parsed = parseCopilotHttpErrorSync(err);
        if (parsed) emitCopilotHttpError(parsed);
      });

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div data-testid="home-compose" className="p-4 bg-white border-t border-gray-200">
      <form onSubmit={handleSubmit} className="relative flex gap-4 items-end max-w-4xl mx-auto w-full">
         <div className="flex-1 relative">
            <textarea
              data-testid="home-compose-textarea"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              disabled={isLoading}
              placeholder="Describe your request to generate a proposal..."
              className={`w-full p-3 pr-12 bg-gray-50 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all resize-none min-h-[60px] max-h-[120px] shadow-sm ${
                error ? 'border-red-300' : 'border-gray-200'
              }`}
              style={{ height: 'auto' }}
              onInput={e => {
                e.currentTarget.style.height = 'auto'; // Reset
                e.currentTarget.style.height = e.currentTarget.scrollHeight + 'px';
              }}
            />
            {error && (
              <p className="absolute -top-6 left-0 text-xs text-red-600 font-bold bg-white px-2 py-0.5 rounded shadow-sm border border-red-100">
                {error}
              </p>
            )}
         </div>
         <button
            type="submit"
            data-testid="home-compose-submit"
            disabled={isLoading || !message.trim()}
            className={`px-6 py-3 rounded-lg font-bold text-sm transition-all shadow-sm flex items-center gap-2 mb-[1px] ${
              isLoading || !message.trim()
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700 active:scale-95'
            }`}
          >
            {isLoading ? (
               <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
               </svg>
            ) : (
               <span>Compile</span>
            )}
          </button>
      </form>
    </div>
  );
}
