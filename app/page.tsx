'use client';

import { useState } from 'react';
import { Proposal } from '../lib/types';
import { useStore } from '../lib/store';

export default function Home() {
  const [message, setMessage] = useState('');
  const { state, addProposal } = useStore();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // We derive Latest Proposal and Timeline from the store's state
  const latestProposal = state.proposals[0] || null;
  const latestDecision = latestProposal ? state.decisions.find(d => d.proposal_id === latestProposal.proposal_id) : null;
  const history = state.proposals;
  const timelineMode = state.settings.timeline_mode;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) {
      setError('Message cannot be empty');
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      const response = await fetch('/api/compile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          message,
          settings: {
            proposal_style: state.settings.proposal_style,
            risk_level: state.settings.risk_level,
            default_step_count: state.settings.default_step_count,
          }
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to submit message');
      }

      const data: Proposal = await response.json();
      addProposal(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Chat Input Panel */}
      <section className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm transition-shadow hover:shadow-md">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <span>Chat</span>
          {isLoading && (
            <span className="flex h-2 w-2 rounded-full bg-blue-600 animate-pulse"></span>
          )}
        </h2>
        <form onSubmit={handleSubmit} className="flex flex-col space-y-4">
          <div className="relative">
            <textarea
              className={`w-full min-h-[120px] p-4 text-gray-900 bg-gray-50 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all resize-y ${
                error ? 'border-red-300' : 'border-gray-200'
              }`}
              placeholder="Type your message to Diviora Hub..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              disabled={isLoading}
            />
            {error && (
              <p className="absolute -bottom-6 left-0 text-sm text-red-600 font-medium">
                {error}
              </p>
            )}
          </div>
          <div className="flex justify-end pt-2">
            <button
              className={`px-6 py-2 rounded-lg font-medium transition-all shadow-sm flex items-center gap-2 ${
                isLoading
                  ? 'bg-blue-300 cursor-not-allowed text-white'
                  : 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow active:transform active:scale-95'
              }`}
              type="submit"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Compiling...
                </>
              ) : (
                'Submit'
              )}
            </button>
          </div>
        </form>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Latest Proposal View */}
        <section className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm h-full flex flex-col">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Latest Proposal</h2>
          {latestProposal ? (
            <div className="flex-1 space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
              <div className="border-b border-gray-100 pb-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xl font-bold text-gray-900">{latestProposal.proposal.title}</h3>
                  {latestDecision && (
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                      latestDecision.status === 'approved' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {latestDecision.status}
                    </span>
                  )}
                </div>
                <p className="text-gray-600 leading-relaxed text-sm">
                  {latestProposal.proposal.summary}
                </p>
              </div>
              
              <div className="grid grid-cols-1 gap-6">
                <div>
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Next Actions</h4>
                  <ul className="space-y-2">
                    {latestProposal.proposal.next_actions.map((action, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                        <span className="text-blue-500 mt-1">•</span>
                        {action}
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div>
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 text-amber-600">Risks</h4>
                  <ul className="space-y-2">
                    {latestProposal.proposal.risks.map((risk, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                        <span className="text-amber-500 mt-1">⚠️</span>
                        {risk}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              
              <div className="pt-4 mt-auto border-t border-gray-50 flex justify-between items-center text-[10px] text-gray-400">
                <span>Created: {new Date(latestProposal.created_at).toLocaleString()}</span>
                <span className="font-mono bg-gray-50 px-2 py-0.5 rounded italic">ID: {latestProposal.proposal_id}</span>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center min-h-[300px] text-gray-400 border-2 border-dashed border-gray-50 rounded-lg">
              <svg className="w-12 h-12 text-gray-200 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-sm">No proposal to display yet</p>
            </div>
          )}
        </section>

        {/* Timeline View */}
        <section className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm h-full flex flex-col">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Timeline</h2>
          {history.length > 0 ? (
            <div className="flex-1 relative overflow-y-auto max-h-[400px] pr-2 scrollbar-thin">
              <div className="absolute left-3 top-0 bottom-0 w-px bg-gray-100"></div>
              <ul className="space-y-6 relative">
                {history.map((item, i) => {
                  const itemDecision = state.decisions.find(d => d.proposal_id === item.proposal_id);
                  return (
                    <li key={i} className="pl-8 relative group animate-in slide-in-from-left-2 duration-300">
                      <div className="absolute left-[-24px] top-1.5 w-3 h-3 rounded-full bg-blue-100 border-2 border-blue-500 group-first:bg-blue-500"></div>
                      <div>
                        <div className="flex items-center justify-between">
                          <h5 className="text-sm font-semibold text-gray-900">{item.proposal.title}</h5>
                          {timelineMode === 'expanded' && itemDecision && (
                            <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase ${
                              itemDecision.status === 'approved' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
                            }`}>
                              {itemDecision.status}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] bg-gray-50 px-2 py-0.5 rounded text-gray-500 uppercase tracking-tighter">SUCCESS</span>
                          <span className="text-[10px] text-gray-400 font-mono italic">{new Date(item.created_at).toLocaleTimeString()}</span>
                          {timelineMode === 'expanded' && (
                            <span className="text-[8px] text-gray-300 font-mono">ID: {item.proposal_id.substring(0, 8)}</span>
                          )}
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center min-h-[300px] text-gray-400 border-2 border-dashed border-gray-50 rounded-lg">
              <svg className="w-12 h-12 text-gray-200 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm">No activity recorded yet</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
